import { Member } from '../models/Member.model';
import { CheckIn } from '../models/CheckIn.model';
import { Invoice } from '../models/Invoice.model';
import mongoose from 'mongoose';

const oid = (id: string) => new mongoose.Types.ObjectId(id);

export const analyticsService = {

  // ── Revenue by month (last 6 months) ──
  async revenueByMonth(gymId: string) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const data = await Invoice.aggregate([
      {
        $match: {
          gymId:  oid(gymId),
          status: 'paid',
          paidAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year:  { $year:  '$paidAt' },
            month: { $month: '$paidAt' },
          },
          revenue: { $sum: '$totalAmount' },
          count:   { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Fill missing months with 0
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year  = d.getFullYear();
      const month = d.getMonth() + 1;
      const found = data.find(r => r._id.year === year && r._id.month === month);
      months.push({
        label:   d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
        revenue: found?.revenue ?? 0,
        count:   found?.count   ?? 0,
        month, year,
      });
    }
    return months;
  },

  // ── Member growth by month ──
  async memberGrowth(gymId: string) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const data = await Member.aggregate([
      { $match: { gymId: oid(gymId), createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year:  { $year:  '$createdAt' },
            month: { $month: '$createdAt' },
          },
          newMembers: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year  = d.getFullYear();
      const month = d.getMonth() + 1;
      const found = data.find(r => r._id.year === year && r._id.month === month);
      months.push({
        label:      d.toLocaleString('en-IN', { month: 'short', year: '2-digit' }),
        newMembers: found?.newMembers ?? 0,
        month, year,
      });
    }
    return months;
  },

  // ── Check-ins by day of week ──
  async checkinsByDayOfWeek(gymId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const data = await CheckIn.aggregate([
      {
        $match: {
          gymId:       oid(gymId),
          result:      'success',
          checkedInAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id:   { $dayOfWeek: '$checkedInAt' }, // 1=Sun, 2=Mon...
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    return days.map((label, i) => {
      const found = data.find(r => r._id === i + 1);
      return { label, count: found?.count ?? 0 };
    });
  },

  // ── Check-ins by hour of day ──
  async checkinsByHour(gymId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const data = await CheckIn.aggregate([
      {
        $match: {
          gymId:       oid(gymId),
          result:      'success',
          checkedInAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id:   { $hour: '$checkedInAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return Array.from({ length: 24 }, (_, h) => {
      const found = data.find(r => r._id === h);
      const label = h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;
      return { label, hour: h, count: found?.count ?? 0 };
    });
  },

  // ── Expiring members ──
  async expiringMembers(gymId: string, days = 30) {
    const future = new Date();
    future.setDate(future.getDate() + days);

    return Member.find({
      gymId:       oid(gymId),
      status:      'active',
      planEndDate: { $gte: new Date(), $lte: future },
    })
      .populate('userId', 'fullName phone email')
      .sort({ planEndDate: 1 })
      .limit(50);
  },

  // ── Top members by check-ins ──
  async topMembers(gymId: string) {
    return Member.find({ gymId: oid(gymId) })
      .populate('userId', 'fullName phone photoUrl')
      .sort({ totalCheckIns: -1 })
      .limit(10);
  },

  // ── Full dashboard summary ──
  async fullSummary(gymId: string) {
    const [
      revenueMonths,
      memberMonths,
      dayOfWeek,
      expiring7,
      expiring30,
      topMembers,
      totalActive,
      totalExpired,
      checkInsToday,
    ] = await Promise.all([
      this.revenueByMonth(gymId),
      this.memberGrowth(gymId),
      this.checkinsByDayOfWeek(gymId),
      this.expiringMembers(gymId, 7),
      this.expiringMembers(gymId, 30),
      this.topMembers(gymId),
      Member.countDocuments({ gymId: oid(gymId), status: 'active' }),
      Member.countDocuments({ gymId: oid(gymId), status: 'expired' }),
      CheckIn.countDocuments({
        gymId:       oid(gymId),
        result:      'success',
        checkedInAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
    ]);

    return {
      revenueMonths,
      memberMonths,
      dayOfWeek,
      expiring7:     expiring7.length,
      expiring30:    expiring30.length,
      expiringList:  expiring30,
      topMembers,
      totalActive,
      totalExpired,
      checkInsToday,
    };
  },
};