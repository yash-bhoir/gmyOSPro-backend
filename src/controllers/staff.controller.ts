import { Request, Response } from 'express';
import { staffService } from '../services/staff.service';
import { ApiResponse } from '../utils/ApiResponse';

export const staffController = {

  getAll: async (req: Request, res: Response) => {
    const staff = await staffService.getAll(req.params.gymId as string);
    new ApiResponse(200, 'Staff fetched', staff).send(res);
  },

  invite: async (req: Request, res: Response) => {
    const staff = await staffService.invite(
      req.params.gymId as string,
      req.user._id.toString(),
      req.body
    );
    new ApiResponse(201, 'Staff invited successfully', staff).send(res);
  },

  updateRole: async (req: Request, res: Response) => {
    const staff = await staffService.updateRole(
      req.params.gymId as string,
      req.params.staffId as string,
      req.body.role
    );
    new ApiResponse(200, 'Role updated', staff).send(res);
  },

  remove: async (req: Request, res: Response) => {
    await staffService.remove(req.params.gymId as string, req.params.staffId as string);
    new ApiResponse(200, 'Staff member removed').send(res);
  },

  getMyProfile: async (req: Request, res: Response) => {
    const profile = await staffService.getMyStaffProfile(req.user._id.toString());
    new ApiResponse(200, 'Staff profile fetched', profile).send(res);
  },
};