import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IGym extends Document {
  name:            string;
  slug:            string;
  ownerId:         Types.ObjectId;
  planTier:        'starter' | 'growth' | 'enterprise';
  planStatus:      'trial' | 'active' | 'suspended' | 'churned';
  trialEndsAt?:    Date;
  gstin?:          string;
  phone?:          string;
  address?:        string;
  city?:           string;
  logoUrl?:        string;
  isActive:        boolean;
  isSetupComplete: boolean;
  features: {
    checkin:       boolean;
    kiosk:         boolean;
    classes:       boolean;
    notifications: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const GymSchema = new Schema<IGym>(
  {
    name:            { type: String, required: true, trim: true },
    slug:            { type: String, required: true, unique: true, lowercase: true },
    ownerId:         { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    planTier:        { type: String, enum: ['starter','growth','enterprise'], default: 'starter' },
    planStatus:      { type: String, enum: ['trial','active','suspended','churned'], default: 'trial' },
    trialEndsAt:     { type: Date },
    gstin:           { type: String },
    phone:           { type: String },
    address:         { type: String },
    city:            { type: String },
    logoUrl:         { type: String },
    isActive:        { type: Boolean, default: true },
    isSetupComplete: { type: Boolean, default: false },
    features: {
      checkin:       { type: Boolean, default: true },
      kiosk:         { type: Boolean, default: true },
      classes:       { type: Boolean, default: true },
      notifications: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export const Gym = mongoose.model<IGym>('Gym', GymSchema);