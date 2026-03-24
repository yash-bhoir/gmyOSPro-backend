import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMembershipPlan extends Document {
  gymId: Types.ObjectId;
  name: string;
  durationDays: number;
  price: number;
  gstRate: number;
  description?: string;
  features?: string[];
  maxFreezeDays: number;
  includesClasses: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema<IMembershipPlan>(
  {
    gymId:           { type: Schema.Types.ObjectId, ref: 'Gym', required: true, index: true },
    name:            { type: String, required: true, trim: true },
    durationDays:    { type: Number, required: true },
    price:           { type: Number, required: true },
    gstRate:         { type: Number, default: 18 },
    description:     { type: String },
    features:        [{ type: String }],
    maxFreezeDays:   { type: Number, default: 30 },
    includesClasses: { type: Boolean, default: false },
    isActive:        { type: Boolean, default: true },
    sortOrder:       { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const MembershipPlan = mongoose.model<IMembershipPlan>('MembershipPlan', PlanSchema);