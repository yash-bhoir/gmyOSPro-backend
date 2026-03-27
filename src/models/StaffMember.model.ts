import mongoose, { Document, Schema, Types } from 'mongoose';

export type StaffRole = 'owner' | 'manager' | 'trainer' | 'front_desk' | 'accounts';

export interface IStaffMember extends Document {
  gymId:      Types.ObjectId;
  userId:     Types.ObjectId;
  role:       StaffRole;
  isActive:   boolean;
  invitedBy:  Types.ObjectId;
  joinedAt:   Date;
  permissions: string[];
  createdAt:  Date;
  updatedAt:  Date;
}

// What each role can access
// Permission hierarchy: holding the parent ('members') satisfies any sub-check ('members:read', 'members:add', 'members:edit')
export const ROLE_PERMISSIONS: Record<StaffRole, string[]> = {
  owner: ['*'],  // full access

  // manager: everything EXCEPT edit gym, edit/delete plans, manage staff
  manager: [
    'dashboard',
    'members',          // full member access: view + add + edit
    'billing',          // full billing: view invoices + create + record payment
    'reports',          // analytics / reports
    'plans:read',       // view plans only — owner edits plans
    'checkin',
    'classes',          // create / update / cancel classes
    'notifications',    // broadcast
  ],

  // trainer: view members, check-in, manage classes, view plans
  trainer: [
    'dashboard',
    'members:read',     // view members only
    'checkin',
    'classes',          // create / update / cancel classes
    'plans:read',
  ],

  // front_desk: view + add members, check-in, billing (create + record), view plans, classes
  front_desk: [
    'dashboard',
    'members:read',     // view members
    'members:add',      // add new members
    'checkin',
    'billing:read',     // view invoices
    'billing:collect',  // create invoice + record payment
    'plans:read',
    'classes',          // create / update / cancel classes
  ],

  // accounts: billing + reports + view plans + classes
  accounts: [
    'dashboard',
    'billing',          // full billing access
    'reports',          // analytics / reports
    'plans:read',
    'classes',          // create / update / cancel classes
  ],
};

const StaffMemberSchema = new Schema<IStaffMember>(
  {
    gymId:      { type: Schema.Types.ObjectId, ref: 'Gym',  required: true, index: true },
    userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role:       { type: String, enum: ['owner','manager','trainer','front_desk','accounts'], required: true },
    isActive:   { type: Boolean, default: true },
    invitedBy:  { type: Schema.Types.ObjectId, ref: 'User' },
    joinedAt:   { type: Date, default: Date.now },
    permissions:{ type: [String], default: [] },
  },
  { timestamps: true }
);

// Unique: one user per gym
StaffMemberSchema.index({ gymId: 1, userId: 1 }, { unique: true });

export const StaffMember = mongoose.model<IStaffMember>('StaffMember', StaffMemberSchema);