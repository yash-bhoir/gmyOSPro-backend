import { Class } from '../models/Class.model';
import { Member } from '../models/Member.model';
import { ApiError } from '../utils/ApiError';
import mongoose from 'mongoose';

const oid = (id: string) => new mongoose.Types.ObjectId(id);

export const classService = {

  async getAll(gymId: string) {
    return Class.find({ gymId: oid(gymId), status: 'active' })
      .populate('trainerId', 'fullName photoUrl')
      .sort({ startTime: 1 });
  },

  async getById(gymId: string, classId: string) {
    const cls = await Class.findOne({ _id: classId, gymId: oid(gymId) })
      .populate('trainerId', 'fullName photoUrl')
      .populate('enrolled', 'fullName phone photoUrl');
    if (!cls) throw ApiError.notFound('Class not found');
    return cls;
  },

  async create(gymId: string, createdBy: string, data: {
    title: string;
    description?: string;
    trainer: string;
    trainerId?: string;
    startTime: string;
    endTime: string;
    days?: string[];
    isRecurring?: boolean;
    capacity?: number;
    location?: string;
    color?: string;
  }) {
    return Class.create({
      gymId:       oid(gymId),
      createdBy:   oid(createdBy),
      title:       data.title,
      description: data.description,
      trainer:     data.trainer,
      trainerId:   data.trainerId ? oid(data.trainerId) : undefined,
      startTime:   new Date(data.startTime),
      endTime:     new Date(data.endTime),
      days:        data.days || [],
      isRecurring: data.isRecurring || false,
      capacity:    data.capacity || 20,
      location:    data.location,
      color:       data.color || '#6366F1',
    });
  },

  async update(gymId: string, classId: string, data: any) {
    const cls = await Class.findOneAndUpdate(
      { _id: classId, gymId: oid(gymId) },
      { $set: data },
      { new: true }
    );
    if (!cls) throw ApiError.notFound('Class not found');
    return cls;
  },

  async cancel(gymId: string, classId: string) {
    const cls = await Class.findOneAndUpdate(
      { _id: classId, gymId: oid(gymId) },
      { status: 'cancelled' },
      { new: true }
    );
    if (!cls) throw ApiError.notFound('Class not found');
    return cls;
  },

  async enroll(gymId: string, classId: string, userId: string) {
    const cls = await Class.findOne({ _id: classId, gymId: oid(gymId), status: 'active' });
    if (!cls) throw ApiError.notFound('Class not found');

    const alreadyEnrolled = cls.enrolled.some(id => id.toString() === userId);
    if (alreadyEnrolled) throw ApiError.badRequest('Already enrolled in this class');

    if (cls.enrolled.length >= cls.capacity) {
      throw ApiError.badRequest('Class is full');
    }

    cls.enrolled.push(oid(userId));
    await cls.save();
    return cls;
  },

  async unenroll(gymId: string, classId: string, userId: string) {
    const cls = await Class.findOne({ _id: classId, gymId: oid(gymId) });
    if (!cls) throw ApiError.notFound('Class not found');

    cls.enrolled = cls.enrolled.filter(id => id.toString() !== userId) as any;
    await cls.save();
    return cls;
  },

  async getMyClasses(userId: string) {
    const member = await Member.findOne({ userId, isActive: true });
    const query: any = { enrolled: oid(userId), status: 'active' };
    if (member) query.gymId = member.gymId;
    return Class.find(query).sort({ startTime: 1 });
  },
};