import { Request, Response } from 'express';
import { notificationService } from '../services/notification.service';
import { ApiResponse } from '../utils/ApiResponse';

export const notificationController = {

  broadcast: async (req: Request, res: Response) => {
    const { title, message } = req.body;
    const result = await notificationService.broadcast(
      req.params.gymId as string, title, message
    );
    new ApiResponse(200, `Notification sent to ${result?.sent ?? 0} members`, result).send(res);
  },

  notifyExpiring: async (req: Request, res: Response) => {
    const result = await notificationService.notifyExpiringMembers(req.params.gymId as string);
    new ApiResponse(200, 'Expiry notifications sent', result).send(res);
  },
};