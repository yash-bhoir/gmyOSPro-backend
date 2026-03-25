import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';
import { ApiResponse } from '../utils/ApiResponse';

export const paymentController = {

  createInvoice: async (req: Request, res: Response) => {
    const invoice = await paymentService.createInvoice(req.params.gymId as string, req.body);
    new ApiResponse(201, 'Invoice created', invoice).send(res);
  },

  recordPayment: async (req: Request, res: Response) => {
    const invoice = await paymentService.recordPayment(
      req.params.gymId as string,
      req.params.invoiceId as string,
      req.body
    );
    new ApiResponse(200, 'Payment recorded', invoice).send(res);
  },

  createRazorpayOrder: async (req: Request, res: Response) => {
    const order = await paymentService.createRazorpayOrder(req.params.gymId as string, req.body);
    new ApiResponse(201, 'Order created', order).send(res);
  },

  verifyPayment: async (req: Request, res: Response) => {
    const invoice = await paymentService.verifyRazorpayPayment(req.params.gymId as string, req.body);
    new ApiResponse(200, 'Payment verified', invoice).send(res);
  },

  getInvoices: async (req: Request, res: Response) => {
    const { status, page, limit } = req.query;
    const result = await paymentService.getInvoices(req.params.gymId as string, {
      status: status as string,
      page:   page  ? parseInt(page  as string) : 1,
      limit:  limit ? parseInt(limit as string) : 20,
    });
    new ApiResponse(200, 'Invoices fetched', result).send(res);
  },

  getMyInvoices: async (req: Request, res: Response) => {
    const invoices = await paymentService.getMemberInvoices(req.user._id.toString());
    new ApiResponse(200, 'Invoices fetched', invoices).send(res);
  },

  getRevenueStats: async (req: Request, res: Response) => {
    const stats = await paymentService.getRevenueStats(req.params.gymId as string);
    new ApiResponse(200, 'Revenue stats fetched', stats).send(res);
  },
};