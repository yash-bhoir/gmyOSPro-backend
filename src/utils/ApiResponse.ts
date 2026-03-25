import { Response } from 'express';

export class ApiResponse {
  success: boolean;
  message: string;
  data?: any;
  statusCode: number;

  constructor(statusCode: number, message: string, data?: any) {
    this.statusCode = statusCode;
    this.success    = statusCode < 400;
    this.message    = message;
    this.data       = data;
  }

  send(res: Response) {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      data:    this.data,
    });
  }
}