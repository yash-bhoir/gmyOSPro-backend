import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiError } from '../utils/ApiError';

export const validate = (schema: Joi.ObjectSchema, context?: object) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      context,
    });
    if (error) {
      const errors = error.details.map((d) => d.message);
      return next(ApiError.badRequest('Validation failed', errors));
    }
    next();
  };