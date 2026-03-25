import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IInvoice extends Document {
  gymId:             Types.ObjectId;
  memberId:          Types.ObjectId;
  invoiceNumber:     string;
  status:            'draft' | 'sent' | 'paid' | 'overdue' | 'void';
  subtotal:          number;
  gstAmount:         number;
  discountAmount:    number;
  totalAmount:       number;
  dueDate:           Date;
  paidAt?:           Date;
  paymentMode?:      'cash' | 'upi' | 'card' | 'bank' | 'razorpay';
  razorpayOrderId?:  string;
  razorpayPaymentId?:string;
  planName?:         string;
  notes?:            string;
  createdAt:         Date;
  updatedAt:         Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    gymId:             { type: Schema.Types.ObjectId, ref: 'Gym',    required: true, index: true },
    memberId:          { type: Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    invoiceNumber:     { type: String, required: true, unique: true },
    status:            { type: String, enum: ['draft','sent','paid','overdue','void'], default: 'draft', index: true },
    subtotal:          { type: Number, required: true, min: 0 },
    gstAmount:         { type: Number, default: 0, min: 0 },
    discountAmount:    { type: Number, default: 0, min: 0 },
    totalAmount:       { type: Number, required: true, min: 0 },
    dueDate:           { type: Date,   required: true },
    paidAt:            { type: Date },
    paymentMode:       { type: String, enum: ['cash','upi','card','bank','razorpay'] },
    razorpayOrderId:   { type: String },
    razorpayPaymentId: { type: String },
    planName:          { type: String },
    notes:             { type: String },
  },
  { timestamps: true }
);

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);