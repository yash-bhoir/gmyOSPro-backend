import { Request, Response } from 'express';
import { gymService } from '../services/gym.service';
import { ApiResponse } from '../utils/ApiResponse';

// Safe param extraction — handles string | string[] | undefined
const p = (value: unknown): string => {
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

  updateGym: async (req: Request, res: Response) => {
    const gym = await gymService.updateGym(p(req.params.gymId), req.body);
    new ApiResponse(200, 'Gym updated', gym).send(res);
  },

  completeSetup: async (req: Request, res: Response) => {
    const gym = await gymService.completeSetup(p(req.params.gymId));
    new ApiResponse(200, 'Setup complete', gym).send(res);
  },

  getPlans: async (req: Request, res: Response) => {
    const plans = await gymService.getAllPlans(p(req.params.gymId));
    new ApiResponse(200, 'Plans fetched', plans).send(res);
  },

  createPlan: async (req: Request, res: Response) => {
    const plan = await gymService.createPlan(p(req.params.gymId), req.body);
    new ApiResponse(201, 'Plan created', plan).send(res);
  },

  updatePlan: async (req: Request, res: Response) => {
    const plan = await gymService.updatePlan(p(req.params.gymId), p(req.params.planId), req.body);
    new ApiResponse(200, 'Plan updated', plan).send(res);
  },

  deletePlan: async (req: Request, res: Response) => {
    await gymService.deletePlan(p(req.params.gymId), p(req.params.planId));
    new ApiResponse(200, 'Plan removed').send(res);
  },

  seedDefaultPlans: async (req: Request, res: Response) => {
    await gymService.seedDefaultPlans(p(req.params.gymId));
    const plans = await gymService.getAllPlans(p(req.params.gymId));
    new ApiResponse(200, 'Default plans added', plans).send(res);
  },
};