import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICheckIn extends Document {
  gymId: Types.ObjectId;
  memberId: Types.ObjectId;
  checkedInAt: Date;
  method: 'qr' | 'manual' | 'rfid';
  result: 'success' | 'denied';
  denialReason?: string;
}

const CheckInSchema = new Schema<ICheckIn>({
  gymId:       { type: Schema.Types.ObjectId, ref: 'Gym', required: true, index: true },
  memberId:    { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
  checkedInAt: { type: Date, default: Date.now, index: true },
  method:      { type: String, enum: ['qr', 'manual', 'rfid'], default: 'qr' },
  result:      { type: String, enum: ['success', 'denied'], required: true },
  denialReason:{ type: String },
}, { timestamps: true });

export const CheckIn = mongoose.model<ICheckIn>('CheckIn', CheckInSchema);