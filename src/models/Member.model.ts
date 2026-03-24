import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMember extends Document {
  gymId: Types.ObjectId;
  userId: Types.ObjectId;
  memberCode: string;
  status: 'active' | 'expired' | 'frozen' | 'cancelled';
  planId?: Types.ObjectId;
  planName?: string;
  planStartDate?: Date;
  planEndDate?: Date;
  frozenFrom?: Date;
  frozenUntil?: Date;
  trainerId?: Types.ObjectId;
  healthNotes?: string;
  fitnessGoals?: string[];
  emergencyContact?: { name: string; phone: string; relation: string };
  totalCheckIns: number;
  churnRiskScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema = new Schema<IMember>(
  {
    gymId:        { type: Schema.Types.ObjectId, ref: 'Gym', required: true, index: true },
    userId:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
    memberCode:   { type: String, required: true, unique: true },
    status:       { type: String, enum: ['active', 'expired', 'frozen', 'cancelled'], default: 'active', index: true },
    planId:       { type: Schema.Types.ObjectId, ref: 'MembershipPlan' },
    planName:     { type: String },
    planStartDate:{ type: Date },
    planEndDate:  { type: Date, index: true },
    frozenFrom:   { type: Date },
    frozenUntil:  { type: Date },
    trainerId:    { type: Schema.Types.ObjectId, ref: 'User' },
    healthNotes:  { type: String },
    fitnessGoals: [{ type: String }],
    emergencyContact: { name: String, phone: String, relation: String },
    totalCheckIns:{ type: Number, default: 0 },
    churnRiskScore:{ type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Member = mongoose.model<IMember>('Member', MemberSchema);