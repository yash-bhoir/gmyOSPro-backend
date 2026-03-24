import mongoose, { Document, Schema, CallbackWithoutResultAndOptionalError } from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';

export interface IUser extends Document {
  phone: string;
  email?: string;
  fullName: string;
  photoUrl?: string;
  systemRole: 'super_admin' | 'gym_owner' | 'staff' | 'member';
  isActive: boolean;
  otp?: string;
  otpExpiry?: Date;
  passwordHash?: string;
  fcmToken?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  compareOtp(candidate: string): Promise<boolean>;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    phone:        { type: String, default: '', trim: true, index: true },
    email:        { type: String, lowercase: true, trim: true, sparse: true },
    fullName:     { type: String, required: true, trim: true },
    photoUrl:     { type: String },
    systemRole:   {
      type: String,
      enum: ['super_admin', 'gym_owner', 'staff', 'member'],
      default: 'member',
    },
    isActive:     { type: Boolean, default: true },
    otp:          { type: String, select: false },
    otpExpiry:    { type: Date,   select: false },
    passwordHash: { type: String, select: false },
    fcmToken:     { type: String },
    lastLoginAt:  { type: Date },
  },
  { timestamps: true }
);

// Hash OTP before saving
UserSchema.pre<IUser>('save', async function () {
  if (!this.isModified('otp') || !this.otp) return;
  this.otp = await bcrypt.hash(this.otp, env.BCRYPT_ROUNDS);
});

// Compare OTP
UserSchema.methods.compareOtp = async function (
  this: IUser,
  candidate: string
): Promise<boolean> {
  if (!this.otp) return false;
  return bcrypt.compare(candidate, this.otp);
};

// Compare password
UserSchema.methods.comparePassword = async function (
  this: IUser,
  candidate: string
): Promise<boolean> {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidate, this.passwordHash);
};

export const User = mongoose.model<IUser>('User', UserSchema);