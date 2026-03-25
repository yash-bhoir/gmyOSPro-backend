import { Gym } from '../models/Gym.model';
import { User } from '../models/User.model';
import { MembershipPlan } from '../models/MembershipPlan.model';
import { ApiError } from '../utils/ApiError';

const slugify = (name: string): string =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') +
  '-' + Math.random().toString(36).slice(2, 6);

export const gymService = {

  async createGym(ownerId: string, data: {
    name: string; phone?: string; address?: string; city?: string; gstin?: string;
  }) {
    const existing = await Gym.findOne({ ownerId });
    if (existing) return existing;

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    const gym = await Gym.create({
      ...data,
      ownerId,
      slug:            slugify(data.name),
      planTier:        'starter',
      planStatus:      'trial',
      trialEndsAt,
      isSetupComplete: false,
    });

    // ── Auto-upgrade user role to gym_owner ──
    await User.findByIdAndUpdate(ownerId, { systemRole: 'gym_owner' });

    return gym;
  },

  async getMyGym(ownerId: string) {
    return Gym.findOne({ ownerId });
  },

  async getGymById(gymId: string) {
    const gym = await Gym.findById(gymId);
    if (!gym) throw ApiError.notFound('Gym not found');
    return gym;
  },

  async updateGym(gymId: string, data: Partial<{
    name: string; phone: string; address: string; city: string;
    gstin: string; logoUrl: string; isSetupComplete: boolean;
  }>) {
    const gym = await Gym.findByIdAndUpdate(gymId, { $set: data }, { new: true });
    if (!gym) throw ApiError.notFound('Gym not found');
    return gym;
  },

  async completeSetup(gymId: string) {
    return this.updateGym(gymId, { isSetupComplete: true });
  },

  async getPlans(gymId: string) {
    return MembershipPlan.find({ gymId, isActive: true }).sort({ sortOrder: 1, price: 1 });
  },

  async getAllPlans(gymId: string) {
    return MembershipPlan.find({ gymId }).sort({ sortOrder: 1, price: 1 });
  },

  async createPlan(gymId: string, data: {
    name: string; durationDays: number; price: number;
    description?: string; features?: string[];
    gstRate?: number; maxFreezeDays?: number; includesClasses?: boolean;
  }) {
    const count = await MembershipPlan.countDocuments({ gymId });
    return MembershipPlan.create({ ...data, gymId, sortOrder: count });
  },

  async updatePlan(gymId: string, planId: string, data: any) {
    const plan = await MembershipPlan.findOneAndUpdate(
      { _id: planId, gymId }, { $set: data }, { new: true }
    );
    if (!plan) throw ApiError.notFound('Plan not found');
    return plan;
  },

  async deletePlan(gymId: string, planId: string) {
    const plan = await MembershipPlan.findOneAndUpdate(
      { _id: planId, gymId }, { isActive: false }, { new: true }
    );
    if (!plan) throw ApiError.notFound('Plan not found');
    return plan;
  },

  async seedDefaultPlans(gymId: string) {
    const defaults = [
      { name: 'Monthly',     durationDays: 30,  price: 999,  sortOrder: 0 },
      { name: 'Quarterly',   durationDays: 90,  price: 2499, sortOrder: 1 },
      { name: 'Half Yearly', durationDays: 180, price: 4499, sortOrder: 2 },
      { name: 'Annual',      durationDays: 365, price: 7999, sortOrder: 3 },
    ];
    const existing = await MembershipPlan.countDocuments({ gymId });
    if (existing > 0) return;
    await MembershipPlan.insertMany(defaults.map(p => ({ ...p, gymId })));
  },
};