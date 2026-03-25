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
export const ROLE_PERMISSIONS: Record<StaffRole, string[]> = {
  owner:      ['*'],  // full access
  manager:    ['dashboard','members','billing','reports','plans','checkin','classes','notifications'],
  trainer:    ['dashboard','members:read','checkin','classes'],
  front_desk: ['dashboard','members:read','checkin','billing:collect'],
  accounts:   ['dashboard','billing','reports','invoices'],
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