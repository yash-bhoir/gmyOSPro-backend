import { Request, Response } from 'express';
import { adminService } from '../services/admin.service';
import { ApiResponse } from '../utils/ApiResponse';

export const adminController = {

  getStats: async (req: Request, res: Response) => {
    const stats = await adminService.getPlatformStats();
    new ApiResponse(200, 'Platform stats fetched', stats).send(res);
  },

  getAllGyms: async (req: Request, res: Response) => {
    const { status, page, limit, search } = req.query;
    const result = await adminService.getAllGyms({
      status: status as string,
      page:   page   ? parseInt(page   as string) : 1,
      limit:  limit  ? parseInt(limit  as string) : 20,
      search: search as string,
    });
    new ApiResponse(200, 'Gyms fetched', result).send(res);
  },

  getGymDetail: async (req: Request, res: Response) => {
    const detail = await adminService.getGymDetail(req.params.gymId as string);
    new ApiResponse(200, 'Gym detail fetched', detail).send(res);
  },

  updateGymStatus: async (req: Request, res: Response) => {
    const gym = await adminService.updateGymStatus(req.params.gymId as string, req.body.status);
    new ApiResponse(200, 'Gym status updated', gym).send(res);
  },

  updateGymPlan: async (req: Request, res: Response) => {
    const gym = await adminService.updateGymPlan(req.params.gymId as string, req.body.planTier);
    new ApiResponse(200, 'Gym plan updated', gym).send(res);
  },

  getRevenueByMonth: async (req: Request, res: Response) => {
    const data = await adminService.platformRevenueByMonth();
    new ApiResponse(200, 'Revenue data fetched', data).send(res);
  },

  getAllUsers: async (req: Request, res: Response) => {
    const { search, page, limit, role } = req.query;
    const result = await adminService.getAllUsers({
      search: search as string,
      page:   page  ? parseInt(page  as string) : 1,
      limit:  limit ? parseInt(limit as string) : 20,
      role:   role  as string,
    });
    new ApiResponse(200, 'Users fetched', result).send(res);
  },

  createUser: async (req: Request, res: Response) => {
    const user = await adminService.createUser(req.body);
    new ApiResponse(201, 'User created successfully', user).send(res);
  },

  updateUserRole: async (req: Request, res: Response) => {
    const { systemRole, isActive } = req.body;
    const user = await adminService.updateUserRole(
      req.params.userId as string,
      systemRole,
      isActive
    );
    new ApiResponse(200, 'User updated', user).send(res);
  },

  deleteUser: async (req: Request, res: Response) => {
    await adminService.deleteUser(req.params.userId as string);
    new ApiResponse(200, 'User deactivated').send(res);
  },

  createGymOwner: async (req: Request, res: Response) => {
    const result = await adminService.createGymOwner(req.body);
    new ApiResponse(201, 'Gym owner created successfully', result).send(res);
  },

  assignStaffRole: async (req: Request, res: Response) => {
    const result = await adminService.assignStaffRole(req.body);
    new ApiResponse(200, 'Role assigned successfully', result).send(res);
  },
};