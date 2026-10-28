import { Request, Response, NextFunction } from 'express';
import { inquiriesService } from '../services/inquiriesService.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { corporateInquirySchema, consultationSchema } from '../validators/index.js';

export class InquiriesController {
  // Corporate inquiries
  async createCorporateInquiry(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = corporateInquirySchema.parse(req.body);
      const inquiry = await inquiriesService.createCorporateInquiry({
        ...validated,
        userId: req.user?.userId,
      });
      return sendSuccess(res, inquiry, 201);
    } catch (err: any) {
      next(err);
    }
  }

  async getCorporateInquiriesAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const list = await inquiriesService.getCorporateInquiries();
      return sendSuccess(res, list);
    } catch (err: any) {
      next(err);
    }
  }

  async updateCorporateInquiry(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await inquiriesService.updateCorporateInquiry(id, req.body);
      return sendSuccess(res, updated);
    } catch (err: any) {
      next(err);
    }
  }

  async deleteCorporateInquiry(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await inquiriesService.deleteCorporateInquiry(id);
      return sendSuccess(res, result);
    } catch (err: any) {
      next(err);
    }
  }

  // Consultation requests
  async createConsultation(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = consultationSchema.parse(req.body);
      const consultation = await inquiriesService.createConsultation({
        ...validated,
        userId: req.user?.userId,
      });
      return sendSuccess(res, consultation, 201);
    } catch (err: any) {
      next(err);
    }
  }

  async getConsultationsAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const list = await inquiriesService.getConsultations();
      return sendSuccess(res, list);
    } catch (err: any) {
      next(err);
    }
  }

  async updateConsultation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updated = await inquiriesService.updateConsultation(id, req.body);
      return sendSuccess(res, updated);
    } catch (err: any) {
      next(err);
    }
  }

  async deleteConsultation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await inquiriesService.deleteConsultation(id);
      return sendSuccess(res, result);
    } catch (err: any) {
      next(err);
    }
  }

  // Custom Gift Boxes
  async createCustomGiftBox(req: Request, res: Response, next: NextFunction) {
    try {
      const box = await inquiriesService.createCustomGiftBox({
        ...req.body,
        userId: req.user?.userId,
      });
      return sendSuccess(res, box, 201);
    } catch (err: any) {
      next(err);
    }
  }

  async getCustomGiftBoxesAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const list = await inquiriesService.getCustomGiftBoxes();
      return sendSuccess(res, list);
    } catch (err: any) {
      next(err);
    }
  }

  async deleteCustomGiftBox(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await inquiriesService.deleteCustomGiftBox(id);
      return sendSuccess(res, result);
    } catch (err: any) {
      next(err);
    }
  }

  // Custom Items / Box Options
  async getCustomItems(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await inquiriesService.getCustomItems();
      return sendSuccess(res, items);
    } catch (err: any) {
      next(err);
    }
  }

  async getCustomItemsAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await inquiriesService.getCustomItemsAdmin();
      return sendSuccess(res, items);
    } catch (err: any) {
      next(err);
    }
  }

  async createCustomItem(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await inquiriesService.createCustomItemAdmin(req.body);
      return sendSuccess(res, item, 201);
    } catch (err: any) {
      next(err);
    }
  }

  async updateCustomItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const item = await inquiriesService.updateCustomItemAdmin(id, req.body);
      return sendSuccess(res, item);
    } catch (err: any) {
      next(err);
    }
  }

  async deleteCustomItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await inquiriesService.deleteCustomItemAdmin(id);
      return sendSuccess(res, result);
    } catch (err: any) {
      next(err);
    }
  }
}

export const inquiriesController = new InquiriesController();
