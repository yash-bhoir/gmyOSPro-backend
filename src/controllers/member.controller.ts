import { Request, Response } from 'express';
import { memberService } from '../services/member.service';
import { ApiResponse } from '../utils/ApiResponse';

// ── Safe query helpers ──
const qs = (value: unknown): string | undefined => {
  if (Array.isArray(value)) return value[0]?.toString().trim() || undefined;
  return value?.toString().trim() || undefined;
};

const qn = (value: unknown, def = 1): number => {
  const s = qs(value);
  if (!s) return def;
  const n = parseInt(s, 10);
  return isNaN(n) || n < 1 ? def : n;
};

export const memberController = {

  getAll: async (req: Request, res: Response) => {
    const result = await memberService.getAll(req.params.gymId as string, {
      status: qs(req.query.status),
      page:   qn(req.query.page, 1),
      limit:  qn(req.query.limit, 20),
      search: qs(req.query.search),
    });
    new ApiResponse(200, 'Members fetched', result).send(res);
  },

  getById: async (req: Request, res: Response) => {
    const member = await memberService.getById(
      req.params.gymId as string,
      req.params.memberId as string
    );
    new ApiResponse(200, 'Member fetched', member).send(res);
  },

  create: async (req: Request, res: Response) => {
    const member = await memberService.create(req.params.gymId as string, req.body);
    new ApiResponse(201, 'Member added successfully', member).send(res);
  },

  update: async (req: Request, res: Response) => {
    const member = await memberService.update(
      req.params.gymId as string,
      req.params.memberId as string,
      req.body
    );
    new ApiResponse(200, 'Member updated', member).send(res);
  },

  getMyProfile: async (req: Request, res: Response) => {
    const member = await memberService.getMyProfile(req.user._id.toString());
    new ApiResponse(200, 'Profile fetched', member).send(res);
  },

  getQrToken: async (req: Request, res: Response) => {
    const result = await memberService.getQrToken(req.user._id.toString());
    new ApiResponse(200, 'QR token generated', result).send(res);
  },

  getAttendance: async (req: Request, res: Response) => {
    const data = await memberService.getAttendance(req.user._id.toString());
    new ApiResponse(200, 'Attendance fetched', data).send(res);
  },

  checkin: async (req: Request, res: Response) => {
    const method: 'qr' | 'manual' = req.body.method === 'qr' ? 'qr' : 'manual';
    const result = await memberService.checkin(
      req.params.gymId as string,
      req.params.memberId as string,
      method
    );
    new ApiResponse(
      200,
      result.result === 'success' ? 'Check-in successful' : 'Check-in denied',
      result
    ).send(res);
  },

  getDashboardStats: async (req: Request, res: Response) => {
    const stats = await memberService.getDashboardStats(req.params.gymId as string);
    new ApiResponse(200, 'Stats fetched', stats).send(res);
  },
};