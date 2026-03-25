import { StaffMember, ROLE_PERMISSIONS, StaffRole } from '../models/StaffMember.model';
import { User } from '../models/User.model';
import { Gym } from '../models/Gym.model';
import { ApiError } from '../utils/ApiError';
import mongoose from 'mongoose';

const oid = (id: string) => new mongoose.Types.ObjectId(id);

export const staffService = {

  // ── Get all staff for a gym ──
  async getAll(gymId: string) {
    return StaffMember.find({ gymId: oid(gymId) })
      .populate('userId', 'fullName phone email photoUrl lastLoginAt')
      .populate('invitedBy', 'fullName')
      .sort({ createdAt: -1 });
  },

  // ── Invite staff by phone ──
  async invite(gymId: string, invitedById: string, data: {
    phone: string;
    role: StaffRole;
    fullName?: string;
  }) {
    // Find or create user
    let user = await User.findOne({ phone: data.phone });
    if (!user) {
      user = await User.create({
        phone:      data.phone,
        fullName:   data.fullName || 'Staff Member',
        systemRole: 'staff',
      });
    } else {
      // Update role to staff if not already
      if (user.systemRole === 'member') {
        user.systemRole = 'staff';
        await user.save();
      }
    }

    // Check if already staff at this gym
    const existing = await StaffMember.findOne({ gymId: oid(gymId), userId: user._id });
    if (existing) {
      if (existing.isActive) throw ApiError.badRequest('This person is already a staff member');
      // Reactivate if was removed
      existing.isActive  = true;
      existing.role      = data.role;
      existing.permissions = ROLE_PERMISSIONS[data.role];
      await existing.save();
      return StaffMember.findById(existing._id).populate('userId', 'fullName phone email');
    }

    const staff = await StaffMember.create({
      gymId:      oid(gymId),
      userId:     user._id,
      role:       data.role,
      invitedBy:  oid(invitedById),
      permissions: ROLE_PERMISSIONS[data.role],
    });

    return StaffMember.findById(staff._id)
      .populate('userId', 'fullName phone email photoUrl')
      .populate('invitedBy', 'fullName');
  },

  // ── Update staff role ──
  async updateRole(gymId: string, staffId: string, role: StaffRole) {
    const staff = await StaffMember.findOneAndUpdate(
      { _id: staffId, gymId: oid(gymId) },
      { role, permissions: ROLE_PERMISSIONS[role] },
      { new: true }
    ).populate('userId', 'fullName phone email');
    if (!staff) throw ApiError.notFound('Staff member not found');
    return staff;
  },

  // ── Remove staff ──
  async remove(gymId: string, staffId: string) {
    const staff = await StaffMember.findOneAndUpdate(
      { _id: staffId, gymId: oid(gymId) },
      { isActive: false },
      { new: true }
    );
    if (!staff) throw ApiError.notFound('Staff member not found');

    // Revert user role to member
    await User.findByIdAndUpdate(staff.userId, { systemRole: 'member' });
    return staff;
  },

  // ── Get staff profile for logged-in staff ──
  async getMyStaffProfile(userId: string) {
    return StaffMember.findOne({ userId: oid(userId), isActive: true })
      .populate('gymId', 'name city logoUrl planStatus')
      .populate('invitedBy', 'fullName');
  },

  // ── Check if user has permission ──
  async hasPermission(userId: string, gymId: string, permission: string): Promise<boolean> {
    const staff = await StaffMember.findOne({
      userId:   oid(userId),
      gymId:    oid(gymId),
      isActive: true,
    });
    if (!staff) return false;
    if (staff.permissions.includes('*')) return true;
    return staff.permissions.some(p =>
      p === permission || p === permission.split(':')[0]
    );
  },
};