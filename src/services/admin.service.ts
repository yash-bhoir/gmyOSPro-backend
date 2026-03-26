import { Gym } from '../models/Gym.model';
import { User } from '../models/User.model';
import { Member } from '../models/Member.model';
import { Invoice } from '../models/Invoice.model';
import { CheckIn } from '../models/CheckIn.model';
import { StaffMember, ROLE_PERMISSIONS } from '../models/StaffMember.model';
import { ApiError } from '../utils/ApiError';
import mongoose from 'mongoose';

const oid = (id: string) => new mongoose.Types.ObjectId(id);

export const adminService = {

  // ── Platform stats ──
  async getPlatformStats() {
    const now          = new Date();
    const thisMonth    = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth    = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalGyms, activeGyms, trialGyms, suspendedGyms,
      totalMembers, activeMembers,
      totalRevenue, thisMonthRevenue, lastMonthRevenue,
      totalCheckIns, checkInsToday,
    ] = await Promise.all([
      Gym.countDocuments(),
      Gym.countDocuments({ planStatus: 'active' }),
      Gym.countDocuments({ planStatus: 'trial' }),
      Gym.countDocuments({ planStatus: 'suspended' }),
      Member.countDocuments(),
      Member.countDocuments({ status: 'active' }),
      Invoice.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Invoice.aggregate([{ $match: { status: 'paid', paidAt: { $gte: thisMonth } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Invoice.aggregate([{ $match: { status: 'paid', paidAt: { $gte: lastMonth, $lte: lastMonthEnd } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      CheckIn.countDocuments({ result: 'success' }),
      CheckIn.countDocuments({ result: 'success', checkedInAt: { $gte: new Date(new Date().setHours(0,0,0,0)) } }),
    ]);

    return {
      gyms:    { total: totalGyms, active: activeGyms, trial: trialGyms, suspended: suspendedGyms },
      members: { total: totalMembers, active: activeMembers },
      revenue: {
        total:     totalRevenue[0]?.total     ?? 0,
        thisMonth: thisMonthRevenue[0]?.total ?? 0,
        lastMonth: lastMonthRevenue[0]?.total ?? 0,
        growth:    lastMonthRevenue[0]?.total
          ? Math.round(((thisMonthRevenue[0]?.total ?? 0) - lastMonthRevenue[0].total) / lastMonthRevenue[0].total * 100)
          : 0,
      },
      checkins: { total: totalCheckIns, today: checkInsToday },
    };
  },

  // ── Get all gyms ──
  async getAllGyms(params: { status?: string; page?: number; limit?: number; search?: string }) {
    const { status, page = 1, limit = 20, search } = params;
    const query: any = {};
    if (status) query.planStatus = status;
    if (search) query.name = { $regex: search, $options: 'i' };

    const [gyms, total] = await Promise.all([
      Gym.find(query).populate('ownerId', 'fullName phone email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Gym.countDocuments(query),
    ]);

    const enriched = await Promise.all(gyms.map(async (gym) => {
      const [memberCount, revenue] = await Promise.all([
        Member.countDocuments({ gymId: gym._id, status: 'active' }),
        Invoice.aggregate([{ $match: { gymId: gym._id, status: 'paid' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      ]);
      return { ...gym.toObject(), memberCount, totalRevenue: revenue[0]?.total ?? 0 };
    }));

    return { items: enriched, total, page, totalPages: Math.ceil(total / limit) };
  },

  // ── Get gym detail ──
  async getGymDetail(gymId: string) {
    const gym = await Gym.findById(gymId).populate('ownerId', 'fullName phone email');
    if (!gym) throw ApiError.notFound('Gym not found');

    const [memberCount, activeMembers, totalRevenue, recentInvoices] = await Promise.all([
      Member.countDocuments({ gymId }),
      Member.countDocuments({ gymId, status: 'active' }),
      Invoice.aggregate([{ $match: { gymId: oid(gymId), status: 'paid' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Invoice.find({ gymId }).sort({ createdAt: -1 }).limit(5),
    ]);

    return { ...gym.toObject(), memberCount, activeMembers, totalRevenue: totalRevenue[0]?.total ?? 0, recentInvoices };
  },

  // ── Update gym status ──
  async updateGymStatus(gymId: string, status: 'active' | 'suspended' | 'trial' | 'churned') {
    const gym = await Gym.findByIdAndUpdate(gymId, { planStatus: status, isActive: status !== 'suspended' }, { new: true });
    if (!gym) throw ApiError.notFound('Gym not found');
    return gym;
  },

  // ── Update gym plan ──
  async updateGymPlan(gymId: string, planTier: 'starter' | 'growth' | 'enterprise') {
    const gym = await Gym.findByIdAndUpdate(gymId, { planTier }, { new: true });
    if (!gym) throw ApiError.notFound('Gym not found');
    return gym;
  },

  // ── Platform revenue by month ──
  async platformRevenueByMonth() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const data = await Invoice.aggregate([
      { $match: { status: 'paid', paidAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$paidAt' }, month: { $month: '$paidAt' } }, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear(), month = d.getMonth() + 1;
      const found = data.find((r: any) => r._id.year === year && r._id.month === month);
      months.push({
        label:   d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
        revenue: found?.revenue ?? 0,
        count:   found?.count   ?? 0,
      });
    }
    return months;
  },

  // ── Get ALL users — no role filter on empty, high limit ──
  async getAllUsers(params: { search?: string; page?: number; limit?: number; role?: string }) {
    const { search, page = 1, limit = 500, role } = params;

    const query: any = {};

    // Only filter by role if explicitly provided
    if (role && role.trim().length > 0) {
      query.systemRole = role.trim();
    }

    // Only search if non-empty string
    if (search && search.trim().length > 0) {
      query.$or = [
        { phone:    { $regex: search.trim() } },
        { fullName: { $regex: search.trim(), $options: 'i' } },
        { email:    { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      User.find(query).sort({ systemRole: 1, createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(query),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  // ── Create user ──
  async createUser(data: {
    phone: string;
    fullName: string;
    email?: string;
    systemRole: 'super_admin' | 'gym_owner' | 'staff' | 'member';
  }) {
    const existing = await User.findOne({ phone: data.phone });
    if (existing) throw ApiError.badRequest('A user with this phone number already exists');
    return User.create({ phone: data.phone, fullName: data.fullName, email: data.email, systemRole: data.systemRole });
  },

  // ── Update user role ──
async updateUserRole(userId: string, systemRole?: string, isActive?: boolean) {
  const update: any = {};
  if (systemRole !== undefined) update.systemRole = systemRole;
  if (isActive   !== undefined) update.isActive   = isActive;
  const user = await User.findByIdAndUpdate(userId, update, { new: true });
  if (!user) throw ApiError.notFound('User not found');
  return user;
},
  // ── Deactivate user ──
  async deleteUser(userId: string) {
    const user = await User.findByIdAndUpdate(userId, { isActive: false }, { new: true });
    if (!user) throw ApiError.notFound('User not found');
    return user;
  },

  // ── Create gym owner + gym in one shot ──
  async createGymOwner(data: {
    phone: string; fullName: string; email?: string;
    gymName: string; city: string; gymPhone?: string; address?: string;
  }) {
    let user = await User.findOne({ phone: data.phone });
    if (!user) {
      user = await User.create({ phone: data.phone, fullName: data.fullName, email: data.email, systemRole: 'gym_owner' });
    } else {
      user.systemRole = 'gym_owner';
      user.fullName   = data.fullName;
      await user.save();
    }

    const existingGym = await Gym.findOne({ ownerId: user._id });
    if (existingGym) throw ApiError.badRequest('This user already owns a gym');

    const slug        = data.gymName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).slice(2, 6);
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    const gym = await Gym.create({
      name: data.gymName, slug, ownerId: user._id,
      city: data.city, phone: data.gymPhone, address: data.address,
      planTier: 'starter', planStatus: 'trial', trialEndsAt, isSetupComplete: false,
    });

    return { user, gym };
  },

  // ── Assign staff role to user for a gym ──
  async assignStaffRole(data: {
    userId: string; gymId: string;
    role: 'manager' | 'trainer' | 'front_desk' | 'accounts';
  }) {
    const [user, gym] = await Promise.all([User.findById(data.userId), Gym.findById(data.gymId)]);
    if (!user) throw ApiError.notFound('User not found');
    if (!gym)  throw ApiError.notFound('Gym not found');

    await User.findByIdAndUpdate(data.userId, { systemRole: 'staff' });

    const existing = await StaffMember.findOne({ userId: oid(data.userId), gymId: oid(data.gymId) });
    if (existing) {
      existing.role        = data.role;
      existing.permissions = ROLE_PERMISSIONS[data.role];
      existing.isActive    = true;
      await existing.save();
      return existing;
    }

    return StaffMember.create({
      gymId: oid(data.gymId), userId: oid(data.userId),
      role: data.role, permissions: ROLE_PERMISSIONS[data.role],
    });
  },

  // ── Get all users (simple, for super admin) ──
  async getAllUsersSimple() {
    return User.find({}).sort({ systemRole: 1, createdAt: -1 });
  },
};