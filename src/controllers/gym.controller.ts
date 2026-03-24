import { Request, Response } from 'express';
import { gymService } from '../services/gym.service';
import { ApiResponse } from '../utils/ApiResponse';

// Safe query/param helpers
const getParamString = (value: unknown): string => {
  if (Array.isArray(value)) return value[0]?.toString().trim() || '';
  return value?.toString().trim() || '';
};

export const gymController = {

  createGym: async (req: Request, res: Response) => {
    const gym = await gymService.createGym(req.user._id.toString(), req.body);
    new ApiResponse(201, 'Gym created successfully', gym).send(res);
  },

  getMyGym: async (req: Request, res: Response) => {
    const gym = await gymService.getMyGym(req.user._id.toString());
    new ApiResponse(200, 'Gym fetched', gym).send(res);
  },

  // Fixed: Proper typing + safe param extraction
  updateGym: async (req: Request<{ gymId: string | string[] }>, res: Response) => {
    const gymId = getParamString(req.params.gymId);
    const gym = await gymService.updateGym(gymId, req.body);
    new ApiResponse(200, 'Gym updated', gym).send(res);
  },

  completeSetup: async (req: Request<{ gymId: string | string[] }>, res: Response) => {
    const gymId = getParamString(req.params.gymId);
    const gym = await gymService.completeSetup(gymId);
    new ApiResponse(200, 'Setup complete', gym).send(res);
  },

  getPlans: async (req: Request<{ gymId: string | string[] }>, res: Response) => {
    const gymId = getParamString(req.params.gymId);
    const plans = await gymService.getAllPlans(gymId);
    new ApiResponse(200, 'Plans fetched', plans).send(res);
  },

  createPlan: async (req: Request<{ gymId: string | string[] }>, res: Response) => {
    const gymId = getParamString(req.params.gymId);
    const plan = await gymService.createPlan(gymId, req.body);
    new ApiResponse(201, 'Plan created', plan).send(res);
  },

  updatePlan: async (req: Request<{ gymId: string | string[]; planId: string | string[] }>, res: Response) => {
    const gymId = getParamString(req.params.gymId);
    const planId = getParamString(req.params.planId);
    const plan = await gymService.updatePlan(gymId, planId, req.body);
    new ApiResponse(200, 'Plan updated', plan).send(res);
  },

  deletePlan: async (req: Request<{ gymId: string | string[]; planId: string | string[] }>, res: Response) => {
    const gymId = getParamString(req.params.gymId);
    const planId = getParamString(req.params.planId);
    await gymService.deletePlan(gymId, planId);
    new ApiResponse(200, 'Plan removed').send(res);
  },

  seedDefaultPlans: async (req: Request<{ gymId: string | string[] }>, res: Response) => {
    const gymId = getParamString(req.params.gymId);
    await gymService.seedDefaultPlans(gymId);
    const plans = await gymService.getAllPlans(gymId);
    new ApiResponse(200, 'Default plans added', plans).send(res);
  },
};