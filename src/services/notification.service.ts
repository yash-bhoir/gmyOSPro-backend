import { Member } from '../models/Member.model';
import { User } from '../models/User.model';
import { logger } from '../config/logger';
import mongoose from 'mongoose';

const oid = (id: string) => new mongoose.Types.ObjectId(id);

// Send push notification via Expo Push API (free, no setup needed)
const sendExpoPush = async (tokens: string[], title: string, body: string, data?: any) => {
  if (!tokens.length) return;

  const messages = tokens.map(token => ({
    to: token,
    sound: 'default',
    title,
    body,
    data: data || {},
  }));

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept':       'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
    const result = await response.json();
    logger.info(`Push sent to ${tokens.length} devices`, result);
  } catch (err) {
    logger.error('Push notification failed:', err);
  }
};

export const notificationService = {

  // ── Send to specific user ──
  async sendToUser(userId: string, title: string, body: string, data?: any) {
    const user = await User.findById(userId);
    if (!user?.fcmToken) return;
    await sendExpoPush([user.fcmToken], title, body, data);
  },

  // ── Send to all active members of a gym ──
  async sendToAllMembers(gymId: string, title: string, body: string) {
    const members = await Member.find({ gymId: oid(gymId), status: 'active' })
      .populate<{ userId: any }>('userId', 'fcmToken');

    const tokens = members
      .map((m: any) => m.userId?.fcmToken)
      .filter((t: string | undefined): t is string => !!t && t.startsWith('ExponentPushToken'));

    if (!tokens.length) {
      logger.info('No push tokens found for gym members');
      return { sent: 0 };
    }

    await sendExpoPush(tokens, title, body);
    return { sent: tokens.length };
  },

  // ── Notify expiring members (run daily) ──
  async notifyExpiringMembers(gymId: string) {
    const now = new Date();

    // 7 days warning
    const in7  = new Date(now); in7.setDate(in7.getDate() + 7);
    const in7s = new Date(now); in7s.setDate(in7s.getDate() + 6);

    // 1 day warning
    const in1  = new Date(now); in1.setDate(in1.getDate() + 1);
    const in1s = new Date(now);

    const [week, day] = await Promise.all([
      Member.find({ gymId: oid(gymId), status: 'active', planEndDate: { $gte: in7s, $lte: in7 } })
        .populate<{ userId: any }>('userId', 'fcmToken fullName'),
      Member.find({ gymId: oid(gymId), status: 'active', planEndDate: { $gte: in1s, $lte: in1 } })
        .populate<{ userId: any }>('userId', 'fcmToken fullName'),
    ]);

    // 7-day reminders
    for (const m of week) {
      const token = (m.userId as any)?.fcmToken;
      if (token) {
        await sendExpoPush(
          [token],
          'Membership expiring soon 📅',
          'Your membership expires in 7 days. Renew now to continue access.',
          { type: 'expiry_reminder', days: 7 }
        );
      }
    }

    // 1-day reminders
    for (const m of day) {
      const token = (m.userId as any)?.fcmToken;
      if (token) {
        await sendExpoPush(
          [token],
          'Membership expires tomorrow! ⚠️',
          'Your membership expires tomorrow. Renew today to avoid interruption.',
          { type: 'expiry_reminder', days: 1 }
        );
      }
    }

    logger.info(`Expiry notifications: ${week.length} (7-day) + ${day.length} (1-day) sent`);
    return { week: week.length, day: day.length };
  },

  // ── Check-in notification ──
  async notifyCheckin(userId: string, gymName: string) {
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    await this.sendToUser(
      userId,
      `✓ Checked in at ${gymName}`,
      `Welcome! Check-in recorded at ${time}`,
      { type: 'checkin' }
    );
  },

  // ── Broadcast announcement ──
  async broadcast(gymId: string, title: string, message: string) {
    return this.sendToAllMembers(gymId, title, message);
  },
};