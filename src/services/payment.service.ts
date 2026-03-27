import crypto from 'crypto';
import { Invoice } from '../models/Invoice.model';
import { Member } from '../models/Member.model';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';
import { logger } from '../config/logger';

// Generate unique invoice number
const generateInvoiceNumber = (): string => {
  const date   = new Date();
  const year   = date.getFullYear().toString().slice(2);
  const month  = String(date.getMonth() + 1).padStart(2, '0');
  const ts     = Date.now().toString().slice(-4);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `INV-${year}${month}-${ts}${random}`;
};

export const paymentService = {

  // ── Create invoice (offline/manual payment) ──
  async createInvoice(gymId: string, data: {
    memberId: string;
    subtotal: number;
    gstRate?: number;
    discountAmount?: number;
    planName?: string;
    notes?: string;
    dueDate?: string;
  }) {
    const gstRate      = data.gstRate ?? 18;
    const gstAmount    = Math.round(data.subtotal * gstRate / 100);
    const discount     = data.discountAmount ?? 0;
    const totalAmount  = data.subtotal + gstAmount - discount;

    const invoice = await Invoice.create({
      gymId,
      memberId:      data.memberId,
      invoiceNumber: generateInvoiceNumber(),
      status:        'sent',
      subtotal:      data.subtotal,
      gstAmount,
      discountAmount: discount,
      totalAmount,
      planName:      data.planName,
      notes:         data.notes,
      dueDate:       data.dueDate ? new Date(data.dueDate) : new Date(),
    });

    return invoice;
  },

  // ── Record offline payment (cash/upi/card) ──
  async recordPayment(gymId: string, invoiceId: string, data: {
    paymentMode: 'cash' | 'upi' | 'card' | 'bank';
    memberId?: string;
    extendDays?: number;
  }) {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: invoiceId, gymId },
      {
        status:      'paid',
        paymentMode: data.paymentMode,
        paidAt:      new Date(),
      },
      { new: true }
    );
    if (!invoice) throw ApiError.notFound('Invoice not found');

    // Extend member plan — validate member belongs to same gym
    if (data.extendDays && invoice.memberId) {
      const member = await Member.findOne({ _id: invoice.memberId, gymId });
      if (member) {
        const base = member.planEndDate && member.planEndDate > new Date()
          ? member.planEndDate
          : new Date();
        const newEnd = new Date(base);
        newEnd.setDate(newEnd.getDate() + data.extendDays);
        await Member.findOneAndUpdate({ _id: invoice.memberId, gymId }, {
          status:      'active',
          planEndDate: newEnd,
          planName:    invoice.planName,
        });
      }
    }

    return invoice;
  },

  // ── Create Razorpay order ──
  async createRazorpayOrder(gymId: string, data: {
    memberId: string;
    amount: number;
    planName: string;
    extendDays: number;
  }) {
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      throw ApiError.internal('Razorpay not configured');
    }

    const amountPaise = Math.round(data.amount * 100);

    // Create Razorpay order via API
    const auth = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount:   amountPaise,
        currency: 'INR',
        receipt:  `rcpt_${Date.now()}`,
        notes: {
          gymId,
          memberId:  data.memberId,
          planName:  data.planName,
          extendDays: data.extendDays,
        },
      }),
    });

    const order: any = await response.json();
    if (!response.ok) throw ApiError.internal('Failed to create Razorpay order');

    // Create pending invoice
    const invoice = await this.createInvoice(gymId, {
      memberId:  data.memberId,
      subtotal:  data.amount,
      planName:  data.planName,
    });

    await Invoice.findByIdAndUpdate(invoice._id, {
      razorpayOrderId: order.id,
      status: 'sent',
    });

    return {
      orderId:   order.id,
      amount:    amountPaise,
      currency:  'INR',
      keyId:     env.RAZORPAY_KEY_ID,
      invoiceId: invoice._id,
      planName:  data.planName,
      memberId:  data.memberId,
    };
  },

  // ── Verify Razorpay payment ──
  async verifyRazorpayPayment(gymId: string, data: {
    razorpayOrderId:   string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    invoiceId:         string;
    extendDays:        number;
  }) {
    if (!env.RAZORPAY_KEY_SECRET) throw ApiError.internal('Razorpay not configured');

    // Verify signature
    const body      = `${data.razorpayOrderId}|${data.razorpayPaymentId}`;
    const expected  = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expected !== data.razorpaySignature) {
      throw ApiError.badRequest('Payment verification failed — invalid signature');
    }

    // Mark invoice paid
    const invoice = await Invoice.findOneAndUpdate(
      { _id: data.invoiceId, gymId },
      {
        status:            'paid',
        paymentMode:       'razorpay',
        paidAt:            new Date(),
        razorpayPaymentId: data.razorpayPaymentId,
      },
      { new: true }
    );
    if (!invoice) throw ApiError.notFound('Invoice not found');

    // Extend member plan — validate member belongs to same gym
    const member = await Member.findOne({ _id: invoice.memberId, gymId });
    if (member) {
      const base = member.planEndDate && member.planEndDate > new Date()
        ? member.planEndDate : new Date();
      const newEnd = new Date(base);
      newEnd.setDate(newEnd.getDate() + data.extendDays);
      await Member.findOneAndUpdate({ _id: invoice.memberId, gymId }, {
        status:      'active',
        planEndDate: newEnd,
        planName:    invoice.planName,
      });
    }

    return invoice;
  },

  // ── Get invoices for gym ──
  async getInvoices(gymId: string, params: { status?: string; page?: number; limit?: number }) {
    const { status, page = 1, limit = 20 } = params;
    const query: any = { gymId };
    if (status) query.status = status;

    const [items, total] = await Promise.all([
      Invoice.find(query)
        .populate('memberId', 'memberCode')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Invoice.countDocuments(query),
    ]);

    return { items, total, page, totalPages: Math.ceil(total / limit) };
  },

  // ── Get member's invoices (scoped to their gym) ──
  async getMemberInvoices(userId: string) {
    const member = await Member.findOne({ userId, isActive: true });
    if (!member) return [];
    return Invoice.find({ memberId: member._id, gymId: member.gymId }).sort({ createdAt: -1 }).limit(20);
  },

  // ── Revenue stats ──
  async getRevenueStats(gymId: string) {
    const now       = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const [totalRevenue, thisMonthRevenue, lastMonthRevenue, totalInvoices, paidInvoices] =
      await Promise.all([
        Invoice.aggregate([{ $match: { gymId: member_id_obj(gymId), status: 'paid' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
        Invoice.aggregate([{ $match: { gymId: member_id_obj(gymId), status: 'paid', paidAt: { $gte: thisMonth } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
        Invoice.aggregate([{ $match: { gymId: member_id_obj(gymId), status: 'paid', paidAt: { $gte: lastMonth, $lte: lastMonthEnd } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
        Invoice.countDocuments({ gymId }),
        Invoice.countDocuments({ gymId, status: 'paid' }),
      ]);

    return {
      totalRevenue:      totalRevenue[0]?.total ?? 0,
      thisMonthRevenue:  thisMonthRevenue[0]?.total ?? 0,
      lastMonthRevenue:  lastMonthRevenue[0]?.total ?? 0,
      totalInvoices,
      paidInvoices,
      collectionRate:    totalInvoices ? Math.round((paidInvoices / totalInvoices) * 100) : 0,
    };
  },
};

import mongoose from 'mongoose';
const member_id_obj = (id: string) => new mongoose.Types.ObjectId(id);