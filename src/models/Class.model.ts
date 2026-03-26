import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IClass extends Document {
  gymId:        Types.ObjectId;
  title:        string;
  description?: string;
  trainer:      string;
  trainerId?:   Types.ObjectId;
  startTime:    Date;
  endTime:      Date;
  days:         string[];          // ['monday','wednesday','friday']
  isRecurring:  boolean;
  capacity:     number;
  enrolled:     Types.ObjectId[];  // userId array
  status:       'active' | 'cancelled' | 'completed';
  location?:    string;
  color?:       string;
  createdBy:    Types.ObjectId;
  createdAt:    Date;
  updatedAt:    Date;
}

const ClassSchema = new Schema<IClass>(
  {
    gymId:       { type: Schema.Types.ObjectId, ref: 'Gym',  required: true, index: true },
    title:       { type: String, required: true, trim: true },
    description: { type: String },
    trainer:     { type: String, required: true },
    trainerId:   { type: Schema.Types.ObjectId, ref: 'User' },
    startTime:   { type: Date,   required: true },
    endTime:     { type: Date,   required: true },
    days:        [{ type: String, enum: ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] }],
    isRecurring: { type: Boolean, default: false },
    capacity:    { type: Number, default: 20, min: 1 },
    enrolled:    [{ type: Schema.Types.ObjectId, ref: 'User' }],
    status:      { type: String, enum: ['active','cancelled','completed'], default: 'active' },
    location:    { type: String },
    color:       { type: String, default: '#6366F1' },
    createdBy:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Class = mongoose.model<IClass>('Class', ClassSchema);