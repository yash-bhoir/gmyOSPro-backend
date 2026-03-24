import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IGym extends Document {
  name: string;
  slug: string;
  ownerId: Types.ObjectId;
  planTier: 'starter' | 'growth' | 'enterprise';
  planStatus: 'trial' | 'active' | 'suspended' | 'churned';
  trialEndsAt?: Date;
  gstin?: string;
  phone?: string;
  address?: string;
  city?: string;
  logoUrl?: string;
  isActive: boolean;
  isSetupComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GymSchema = new Schema<IGym>(
  {
    name:            { type: String, required: true, trim: true },
    slug:            { type: String, required: true, unique: true, lowercase: true, trim: true },
    ownerId:         { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    planTier:        { type: String, enum: ['starter', 'growth', 'enterprise'], default: 'starter' },
    planStatus:      { type: String, enum: ['trial', 'active', 'suspended', 'churned'], default: 'trial' },
    trialEndsAt:     { type: Date },
    gstin:           { type: String },
    phone:           { type: String },
    address:         { type: String },
    city:            { type: String },
    logoUrl:         { type: String },
    isActive:        { type: Boolean, default: true },
    isSetupComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Gym = mongoose.model<IGym>('Gym', GymSchema);