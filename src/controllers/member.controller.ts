import { Request, Response } from 'express';
import { memberService } from '../services/member.service';
import { ApiResponse } from '../utils/ApiResponse';

// ==================== Safe Query Helpers ====================
const getQueryString = (value: unknown): string | undefined => {
  if (Array.isArray(value)) {
    return value[0]?.toString().trim() || undefined;
  }
  return value?.toString().trim() || undefined;
};

const getQueryNumber = (value: unknown, defaultValue: number = 1): number => {
  const str = getQueryString(value);
  if (!str) return defaultValue;

  const num = parseInt(str, 10);
  return isNaN(num) || num < 1 ? defaultValue : num;
};

// ==================== Type Definitions ====================
interface GetMembersQuery {
  status?: string | string[];
  page?: string | string[];
  limit?: string | string[];
  search?: string | string[];
}

interface CheckinBody {
  method?: 'qr' | 'manual';   // ← Fixed typing here
}

// ==================== Controller ====================
export const memberController = {

  getAll: async (req: Request<{ gymId: string }, any, any, GetMembersQuery>, res: Response) => {
    const { gymId } = req.params;
    const { status, page, limit, search } = req.query;

    const result = await memberService.getAll(gymId, {
      status: getQueryString(status),
      page: getQueryNumber(page, 1),
      limit: getQueryNumber(limit, 20),
      search: getQueryString(search),
    });

    new ApiResponse(200, 'Members fetched', result).send(res);
  },

  getById: async (req: Request<{ gymId: string; memberId: string }>, res: Response) => {
    const member = await memberService.getById(req.params.gymId, req.params.memberId);
    new ApiResponse(200, 'Member fetched', member).send(res);
  },

  create: async (req: Request<{ gymId: string }>, res: Response) => {
    const member = await memberService.create(req.params.gymId, req.body);
    new ApiResponse(201, 'Member added successfully', member).send(res);
  },

  update: async (req: Request<{ gymId: string; memberId: string }>, res: Response) => {
    const member = await memberService.update(req.params.gymId, req.params.memberId, req.body);
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

  checkin: async (req: Request<{ gymId: string; memberId: string }, any, CheckinBody>, res: Response) => {
    const { gymId, memberId } = req.params;

    // Safe way to handle method with proper literal type
    const method: 'qr' | 'manual' = req.body.method === 'qr' ? 'qr' : 'manual';

    const result = await memberService.checkin(gymId, memberId, method);

    new ApiResponse(
      200,
      result.result === 'success' ? 'Check-in successful' : 'Check-in denied',
      result
    ).send(res);
  },

  getDashboardStats: async (req: Request<{ gymId: string }>, res: Response) => {
    const stats = await memberService.getDashboardStats(req.params.gymId);
    new ApiResponse(200, 'Stats fetched', stats).send(res);
  },
};