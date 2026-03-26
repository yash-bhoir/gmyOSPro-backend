import { Request, Response } from 'express';
import { classService } from '../services/class.service';
import { ApiResponse } from '../utils/ApiResponse';

export const classController = {

  getAll: async (req: Request, res: Response) => {
    const classes = await classService.getAll(req.params.gymId as string);
    new ApiResponse(200, 'Classes fetched', classes).send(res);
  },

  getById: async (req: Request, res: Response) => {
    const cls = await classService.getById(req.params.gymId as string, req.params.classId as string);
    new ApiResponse(200, 'Class fetched', cls).send(res);
  },

  create: async (req: Request, res: Response) => {
    const cls = await classService.create(
      req.params.gymId as string,
      req.user._id.toString(),
      req.body
    );
    new ApiResponse(201, 'Class created', cls).send(res);
  },

  update: async (req: Request, res: Response) => {
    const cls = await classService.update(
      req.params.gymId as string,
      req.params.classId as string,
      req.body
    );
    new ApiResponse(200, 'Class updated', cls).send(res);
  },

  cancel: async (req: Request, res: Response) => {
    await classService.cancel(req.params.gymId as string, req.params.classId as string);
    new ApiResponse(200, 'Class cancelled').send(res);
  },

  enroll: async (req: Request, res: Response) => {
    const cls = await classService.enroll(
      req.params.gymId as string,
      req.params.classId as string,
      req.user._id.toString()
    );
    new ApiResponse(200, 'Enrolled successfully', cls).send(res);
  },

  unenroll: async (req: Request, res: Response) => {
    const cls = await classService.unenroll(
      req.params.gymId as string,
      req.params.classId as string,
      req.user._id.toString()
    );
    new ApiResponse(200, 'Unenrolled successfully', cls).send(res);
  },

  getMyClasses: async (req: Request, res: Response) => {
    const classes = await classService.getMyClasses(req.user._id.toString());
    new ApiResponse(200, 'My classes fetched', classes).send(res);
  },
};