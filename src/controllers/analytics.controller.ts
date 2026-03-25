import { Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';
import { ApiResponse } from '../utils/ApiResponse';

export const analyticsController = {

  fullSummary: async (req: Request, res: Response) => {
    const data = await analyticsService.fullSummary(req.params.gymId as string);
    new ApiResponse(200, 'Analytics fetched', data).send(res);
  },

  revenueByMonth: async (req: Request, res: Response) => {
    const data = await analyticsService.revenueByMonth(req.params.gymId as string);
    new ApiResponse(200, 'Revenue data fetched', data).send(res);
  },

  memberGrowth: async (req: Request, res: Response) => {
    const data = await analyticsService.memberGrowth(req.params.gymId as string);
    new ApiResponse(200, 'Member growth fetched', data).send(res);
  },

  checkinsByDay: async (req: Request, res: Response) => {
    const data = await analyticsService.checkinsByDayOfWeek(req.params.gymId as string);
    new ApiResponse(200, 'Check-in data fetched', data).send(res);
  },

  expiringMembers: async (req: Request, res: Response) => {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const data = await analyticsService.expiringMembers(req.params.gymId as string, days);
    new ApiResponse(200, 'Expiring members fetched', data).send(res);
  },

  topMembers: async (req: Request, res: Response) => {
    const data = await analyticsService.topMembers(req.params.gymId as string);
    new ApiResponse(200, 'Top members fetched', data).send(res);
  },
};