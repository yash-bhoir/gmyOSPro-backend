import { Member } from '../models/Member.model';
import { User } from '../models/User.model';
import { CheckIn } from '../models/CheckIn.model';
import { ApiError } from '../utils/ApiError';
import { signAccessToken } from '../utils/jwt';

const generateMemberCode = (): string => {
  const prefix = 'GYM';
  const num = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}${num}`;
};

export const memberService = {

  async getAll(gymId: string, params: {
    status?: string; page?: number; limit?: number; search?: string;
  }) {
    const { status, page = 1, limit = 20, search } = params;
    const query: any = { gymId };
    if (status) query.status = status;

    let memberQuery = Member.find(query)
      .populate('userId', 'fullName phone email photoUrl')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const [members, total] = await Promise.all([
      memberQuery.exec(),
      Member.countDocuments(query),
    ]);

    // Apply search filter on populated data
    let results = members;
    if (search) {
      const s = search.toLowerCase();
      results = members.filter((m: any) => {
        const user = m.userId as any;
        return (
          user?.fullName?.toLowerCase().includes(s) ||
          user?.phone?.includes(s) ||
          m.memberCode?.toLowerCase().includes(s)
        );
      });
    }

    return { items: results, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async getById(gymId: string, memberId: string) {
    const member = await Member.findOne({ _id: memberId, gymId })
      .populate('userId', 'fullName phone email photoUrl')
      .populate('planId');
    if (!member) throw ApiError.notFound('Member not found');
    return member;
  },

  async create(gymId: string, data: {
    phone: string; fullName: string; email?: string;
    planId?: string; planName?: string;
    planStartDate?: string; planEndDate?: string;
    healthNotes?: string; fitnessGoals?: string[];
    emergencyContact?: { name: string; phone: string; relation: string };
  }) {
    // Find or create user
    let user = await User.findOne({ phone: data.phone });
    if (!user) {
      user = await User.create({
        phone: data.phone,
        fullName: data.fullName,
        email: data.email,
        systemRole: 'member',
      });
    } else {
      user.fullName = data.fullName;
      if (data.email) user.email = data.email;
      await user.save();
    }

    // Check if already a member of this gym
    const existing = await Member.findOne({ gymId, userId: user._id });
    if (existing) throw ApiError.badRequest('This phone number is already registered as a member');

    const member = await Member.create({
      gymId,
      userId: user._id,
      memberCode: generateMemberCode(),
      status: 'active',
      planId: data.planId,
      planName: data.planName,
      planStartDate: data.planStartDate ? new Date(data.planStartDate) : new Date(),
      planEndDate: data.planEndDate ? new Date(data.planEndDate) : undefined,
      healthNotes: data.healthNotes,
      fitnessGoals: data.fitnessGoals,
      emergencyContact: data.emergencyContact,
    });

    return Member.findById(member._id).populate('userId', 'fullName phone email photoUrl');
  },

  async update(gymId: string, memberId: string, data: any) {
    const member = await Member.findOneAndUpdate(
      { _id: memberId, gymId },
      { $set: data },
      { new: true }
    ).populate('userId', 'fullName phone email photoUrl');
    if (!member) throw ApiError.notFound('Member not found');
    return member;
  },

  async getMyProfile(userId: string) {
    const member = await Member.findOne({ userId })
      .populate('userId', 'fullName phone email photoUrl')
      .populate('planId');
    if (!member) throw ApiError.notFound('Member profile not found');
    return member;
  },

  async getQrToken(userId: string) {
    const member = await Member.findOne({ userId });
    if (!member) throw ApiError.notFound('Member not found');
    // Generate a short-lived QR token
    const token = signAccessToken({
      userId: userId,
      gymId: member.gymId.toString(),
      role: 'member',
    });
    return { token, memberCode: member.memberCode };
  },

  async getAttendance(userId: string, limit = 30) {
    const member = await Member.findOne({ userId });
    if (!member) throw ApiError.notFound('Member not found');
    const checkIns = await CheckIn.find({ memberId: member._id })
      .sort({ checkedInAt: -1 })
      .limit(limit);
    return checkIns;
  },

  async checkin(gymId: string, memberId: string, method: 'qr' | 'manual') {
    const member = await Member.findOne({ _id: memberId, gymId });
    if (!member) {
      return await CheckIn.create({ gymId, memberId, method, result: 'denied', denialReason: 'Member not found' });
    }
    if (member.status !== 'active') {
      return await CheckIn.create({ gymId, memberId, method, result: 'denied', denialReason: `Membership is ${member.status}` });
    }
    if (member.planEndDate && member.planEndDate < new Date()) {
      await Member.findByIdAndUpdate(memberId, { status: 'expired' });
      return await CheckIn.create({ gymId, memberId, method, result: 'denied', denialReason: 'Membership expired' });
    }

    await Member.findByIdAndUpdate(memberId, { $inc: { totalCheckIns: 1 } });
    return await CheckIn.create({ gymId, memberId, method, result: 'success' });
  },

  async getDashboardStats(gymId: string) {
    const [
      totalActive, totalExpired, totalFrozen,
      checkInsToday, checkInsMonth,
      expiringThisWeek,
    ] = await Promise.all([
      Member.countDocuments({ gymId, status: 'active' }),
      Member.countDocuments({ gymId, status: 'expired' }),
      Member.countDocuments({ gymId, status: 'frozen' }),
      CheckIn.countDocuments({
        gymId, result: 'success',
        checkedInAt: { $gte: new Date(new Date().setHours(0,0,0,0)) },
      }),
      CheckIn.countDocuments({
        gymId, result: 'success',
        checkedInAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      }),
      Member.countDocuments({
        gymId, status: 'active',
        planEndDate: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    return {
      totalActive, totalExpired, totalFrozen,
      checkInsToday, checkInsMonth, expiringThisWeek,
      totalMembers: totalActive + totalExpired + totalFrozen,
    };
  },
};