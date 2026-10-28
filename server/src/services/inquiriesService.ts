import { storageService } from './storageService.js';
import { prisma, isDbConnected } from '../config/database.js';

let inMemoryCorporateInquiries: any[] = [];
let inMemoryConsultations: any[] = [];
let inMemoryCustomGiftBoxes: any[] = [];

function formatInquiryFromPrisma(i: any) {
  let notesText = i.notes || '';
  let occasion: string | undefined = undefined;
  let customizationTypes: string[] | undefined = undefined;

  if (notesText && notesText.startsWith('{') && notesText.endsWith('}')) {
    try {
      const parsed = JSON.parse(notesText);
      notesText = parsed.notes || parsed.description || '';
      occasion = parsed.occasion;
      customizationTypes = parsed.customizationTypes;
    } catch {}
  }

  const idVal = i.inquiryNumber || i.id;
  return {
    id: idVal,
    inquiryNumber: idVal,
    companyName: i.companyName || '',
    contactName: i.contactName || '',
    phone: i.phone || '',
    email: i.email || undefined,
    estimatedQuantity: i.estimatedQuantity || 'نامشخص',
    budgetPerBox: i.budgetPerBox || 'نامشخص',
    deliveryDate: i.deliveryDeadline || undefined,
    occasion,
    customizationTypes,
    notes: notesText,
    voiceRecording: i.voiceRecordingUrl
      ? {
          dataUrl: i.voiceRecordingUrl,
          url: i.voiceRecordingUrl,
          duration: i.voiceDuration || 0,
        }
      : undefined,
    status: (i.status ? i.status.toLowerCase() : 'new'),
    adminNotes: i.adminNotes || undefined,
    createdAt: i.createdAt ? new Date(i.createdAt).toISOString() : new Date().toISOString(),
    createdAtFa: new Intl.DateTimeFormat('fa-IR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(i.createdAt ? new Date(i.createdAt) : new Date()),
  };
}

function formatConsultationFromPrisma(c: any) {
  let descriptionText = c.notes || '';
  let topic: string = 'box_selection';
  let companyName = c.recipientType || undefined;
  let quantityNeeded: string | undefined = undefined;
  let targetDate: string | undefined = undefined;
  let assignedConsultant: string | undefined = undefined;

  if (descriptionText && descriptionText.startsWith('{') && descriptionText.endsWith('}')) {
    try {
      const parsed = JSON.parse(descriptionText);
      descriptionText = parsed.description || parsed.notes || '';
      if (parsed.topic) topic = parsed.topic;
      if (parsed.companyName) companyName = parsed.companyName;
      if (parsed.quantityNeeded) quantityNeeded = parsed.quantityNeeded;
      if (parsed.targetDate) targetDate = parsed.targetDate;
      if (parsed.assignedConsultant) assignedConsultant = parsed.assignedConsultant;
    } catch {}
  }

  return {
    id: c.id,
    fullName: c.name || '',
    phone: c.phone || '',
    email: c.email || undefined,
    customerType: (c.inquiryType === 'corporate' ? 'corporate' : 'personal'),
    companyName,
    topic,
    approxBudget: c.budget || undefined,
    quantityNeeded,
    occasion: c.occasion || undefined,
    targetDate,
    description: descriptionText,
    voiceRecording: c.voiceRecordingUrl
      ? {
          dataUrl: c.voiceRecordingUrl,
          url: c.voiceRecordingUrl,
          duration: c.voiceDuration || 0,
        }
      : undefined,
    preferredContactMethod: c.preferredContact || 'phone',
    status: (c.status ? c.status.toLowerCase() : 'new'),
    adminNotes: c.adminNotes || undefined,
    assignedConsultant,
    createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
    createdAtFa: new Intl.DateTimeFormat('fa-IR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(c.createdAt ? new Date(c.createdAt) : new Date()),
  };
}

export class InquiriesService {
  // Corporate inquiries
  async createCorporateInquiry(data: any) {
    let voiceUrl = data.voiceRecordingUrl || data.voiceRecording?.dataUrl;
    if (data.voiceRecording?.dataUrl) {
      voiceUrl = await storageService.saveVoiceRecording(
        data.voiceRecording.dataUrl,
        data.voiceRecording.mimeType
      );
    }

    const inqNum = `CR-INQ-${Date.now().toString().slice(-4)}`;

    if (isDbConnected()) {
      try {
        const phone = data.phoneNumber || data.phone || '';
        const company = data.companyName || data.organizationName || '';

        // Prevent rapid duplicate submissions within 60 seconds
        if (phone && company) {
          const recent = await prisma.corporateInquiry.findFirst({
            where: {
              phone,
              companyName: company,
              createdAt: {
                gte: new Date(Date.now() - 60 * 1000),
              },
            },
          });
          if (recent) {
            return formatInquiryFromPrisma(recent);
          }
        }

        const notesPayload = JSON.stringify({
          notes: data.notes || data.description || '',
          occasion: data.occasion,
          customizationTypes: data.customizationTypes,
        });

        const created = await prisma.corporateInquiry.create({
          data: {
            id: inqNum,
            inquiryNumber: inqNum,
            companyName: company || 'سازمان / شرکت',
            contactName: data.contactName || data.contactPerson || data.fullName || 'مسئول خرید',
            phone,
            email: data.email || null,
            budgetPerBox: data.budgetPerBox ? String(data.budgetPerBox) : data.estimatedBudget ? String(data.estimatedBudget) : null,
            estimatedQuantity: data.estimatedQuantity ? String(data.estimatedQuantity) : null,
            deliveryDeadline: data.deliveryDate ? String(data.deliveryDate) : data.preferredDeliveryDate ? String(data.preferredDeliveryDate) : null,
            notes: notesPayload,
            voiceRecordingUrl: voiceUrl || null,
            voiceDuration: data.voiceDuration || data.voiceRecording?.duration ? Number(data.voiceDuration || data.voiceRecording?.duration) : null,
            status: 'new',
            adminNotes: data.adminNotes || null,
          },
        });
        return formatInquiryFromPrisma(created);
      } catch (err) {
        console.warn('Prisma createCorporateInquiry fallback:', err);
      }
    }

    const now = new Date();
    const newInquiry = {
      ...data,
      id: inqNum,
      status: 'new',
      createdAt: now.toISOString(),
      createdAtFa: new Intl.DateTimeFormat('fa-IR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(now),
    };

    inMemoryCorporateInquiries.unshift(newInquiry);
    return newInquiry;
  }

  async getCorporateInquiries() {
    if (isDbConnected()) {
      try {
        const items = await prisma.corporateInquiry.findMany({
          orderBy: { createdAt: 'desc' },
        });
        return items.map(formatInquiryFromPrisma);
      } catch (err) {
        console.warn('Prisma getCorporateInquiries fallback:', err);
      }
    }
    return inMemoryCorporateInquiries;
  }

  async getCorporateInquiryById(id: string) {
    if (isDbConnected()) {
      try {
        const item = await prisma.corporateInquiry.findFirst({
          where: {
            OR: [{ id }, { inquiryNumber: id }],
          },
        });
        if (item) return formatInquiryFromPrisma(item);
      } catch (err) {
        console.warn('Prisma getCorporateInquiryById fallback:', err);
      }
    }
    const item = inMemoryCorporateInquiries.find((i) => i.id === id || i.inquiryNumber === id);
    if (!item) throw new Error('درخواست سازمانی یافت نشد.');
    return item;
  }

  async updateCorporateInquiry(id: string, data: { status?: string; adminNotes?: string }) {
    if (isDbConnected()) {
      try {
        const target = await prisma.corporateInquiry.findFirst({
          where: {
            OR: [{ id }, { inquiryNumber: id }],
          },
        });
        if (target) {
          const updated = await prisma.corporateInquiry.update({
            where: { id: target.id },
            data: {
              status: data.status ? String(data.status).toLowerCase() : undefined,
              adminNotes: data.adminNotes !== undefined ? data.adminNotes : undefined,
            },
          });
          return formatInquiryFromPrisma(updated);
        }
      } catch (err) {
        console.warn('Prisma updateCorporateInquiry fallback:', err);
      }
    }

    const item = inMemoryCorporateInquiries.find((i) => i.id === id || i.inquiryNumber === id);
    if (!item) throw new Error('درخواست سازمانی یافت نشد.');
    if (data.status) item.status = data.status;
    if (data.adminNotes !== undefined) item.adminNotes = data.adminNotes;
    return item;
  }

  async deleteCorporateInquiry(id: string) {
    if (isDbConnected()) {
      try {
        await prisma.corporateInquiry.deleteMany({
          where: {
            OR: [{ id }, { inquiryNumber: id }],
          },
        });
        return { success: true };
      } catch (err) {
        console.warn('Prisma deleteCorporateInquiry fallback:', err);
      }
    }
    inMemoryCorporateInquiries = inMemoryCorporateInquiries.filter(
      (i) => i.id !== id && i.inquiryNumber !== id
    );
    return { success: true };
  }

  // Consultations
  async createConsultation(data: any) {
    let voiceUrl = data.voiceRecordingUrl || data.voiceRecording?.dataUrl;
    if (data.voiceRecording?.dataUrl) {
      voiceUrl = await storageService.saveVoiceRecording(
        data.voiceRecording.dataUrl,
        data.voiceRecording.mimeType
      );
    }

    const cnsId = `CNS-${Date.now().toString().slice(-4)}`;

    if (isDbConnected()) {
      try {
        const phone = data.phoneNumber || data.phone || '';
        const fullName = data.fullName || data.name || data.contactPerson || '';

        // Prevent rapid duplicate submissions within 60 seconds
        if (phone && fullName) {
          const recent = await prisma.consultation.findFirst({
            where: {
              phone,
              name: fullName,
              createdAt: {
                gte: new Date(Date.now() - 60 * 1000),
              },
            },
          });
          if (recent) {
            return formatConsultationFromPrisma(recent);
          }
        }

        const notesPayload = JSON.stringify({
          description: data.description || data.notes || '',
          topic: data.topic || 'box_selection',
          companyName: data.companyName || null,
          quantityNeeded: data.quantityNeeded || null,
          targetDate: data.targetDate || null,
        });

        const created = await prisma.consultation.create({
          data: {
            id: cnsId,
            name: fullName || 'کاربر گرامی',
            phone,
            email: data.email || null,
            inquiryType: data.customerType || data.inquiryType || 'personal',
            budget: data.approxBudget ? String(data.approxBudget) : data.budget ? String(data.budget) : null,
            occasion: data.occasion || null,
            recipientType: data.companyName || null,
            preferredContact: data.preferredContactMethod || data.preferredContact || 'phone',
            notes: notesPayload,
            voiceRecordingUrl: voiceUrl || null,
            voiceDuration: data.voiceDuration || data.voiceRecording?.duration ? Number(data.voiceDuration || data.voiceRecording?.duration) : null,
            status: 'new',
            adminNotes: data.adminNotes || null,
          },
        });
        return formatConsultationFromPrisma(created);
      } catch (err) {
        console.warn('Prisma createConsultation fallback:', err);
      }
    }

    const now = new Date();
    const newConsultation = {
      ...data,
      id: cnsId,
      status: 'new',
      createdAt: now.toISOString(),
      createdAtFa: new Intl.DateTimeFormat('fa-IR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(now),
    };

    inMemoryConsultations.unshift(newConsultation);
    return newConsultation;
  }

  async getConsultations() {
    if (isDbConnected()) {
      try {
        const items = await prisma.consultation.findMany({
          where: {
            inquiryType: {
              not: 'custom_box',
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        return items.map(formatConsultationFromPrisma);
      } catch (err) {
        console.warn('Prisma getConsultations fallback:', err);
      }
    }
    return inMemoryConsultations;
  }

  async updateConsultation(
    id: string,
    data: { status?: string; adminNotes?: string; assignedConsultant?: string }
  ) {
    if (isDbConnected()) {
      try {
        const existing = await prisma.consultation.findUnique({ where: { id } });
        let updatedNotes = existing?.notes;
        if (data.assignedConsultant !== undefined) {
          try {
            const parsed = existing?.notes && existing.notes.startsWith('{')
              ? JSON.parse(existing.notes)
              : { description: existing?.notes || '' };
            parsed.assignedConsultant = data.assignedConsultant;
            updatedNotes = JSON.stringify(parsed);
          } catch {}
        }

        const updated = await prisma.consultation.update({
          where: { id },
          data: {
            status: data.status ? String(data.status).toLowerCase() : undefined,
            adminNotes: data.adminNotes !== undefined ? data.adminNotes : undefined,
            notes: updatedNotes !== undefined ? updatedNotes : undefined,
          },
        });
        return formatConsultationFromPrisma(updated);
      } catch (err) {
        console.warn('Prisma updateConsultation fallback:', err);
      }
    }

    const item = inMemoryConsultations.find((i) => i.id === id);
    if (!item) throw new Error('درخواست مشاوره یافت نشد.');
    if (data.status) item.status = data.status;
    if (data.adminNotes !== undefined) item.adminNotes = data.adminNotes;
    if (data.assignedConsultant !== undefined)
      item.assignedConsultant = data.assignedConsultant;
    return item;
  }

  async deleteConsultation(id: string) {
    if (isDbConnected()) {
      try {
        await prisma.consultation.deleteMany({
          where: { id },
        });
        return { success: true };
      } catch (err) {
        console.warn('Prisma deleteConsultation fallback:', err);
      }
    }
    inMemoryConsultations = inMemoryConsultations.filter((c) => c.id !== id);
    return { success: true };
  }

  // Custom Gift Boxes
  async createCustomGiftBox(data: any) {
    let voiceUrl = data.voiceRecordingUrl || data.voiceRecording?.dataUrl;
    if (data.voiceRecording?.dataUrl) {
      voiceUrl = await storageService.saveVoiceRecording(
        data.voiceRecording.dataUrl,
        data.voiceRecording.mimeType
      );
    }

    const cboxId = `CBOX-${Date.now().toString().slice(-4)}`;

    if (isDbConnected()) {
      try {
        const phone = data.phoneNumber || data.phone || '';
        // Prevent rapid duplicate submissions within 60 seconds
        if (phone) {
          const recent = await prisma.consultation.findFirst({
            where: {
              inquiryType: 'custom_box',
              phone,
              createdAt: {
                gte: new Date(Date.now() - 60 * 1000),
              },
            },
          });
          if (recent) {
            return formatConsultationFromPrisma(recent);
          }
        }

        const created = await prisma.consultation.create({
          data: {
            id: cboxId,
            name: data.fullName || data.contactPerson || data.name || 'درخواست باکس اختصاصی',
            phone,
            email: data.email || null,
            inquiryType: 'custom_box',
            budget: data.totalPrice ? String(data.totalPrice) : null,
            notes: JSON.stringify(data),
            voiceRecordingUrl: voiceUrl || null,
            voiceDuration: data.voiceDuration || data.voiceRecording?.duration ? Number(data.voiceDuration || data.voiceRecording?.duration) : null,
            status: 'new',
          },
        });
        return formatConsultationFromPrisma(created);
      } catch (err) {
        console.warn('Prisma createCustomGiftBox fallback:', err);
      }
    }

    const now = new Date();
    const newBox = {
      ...data,
      id: cboxId,
      createdAt: now.toISOString(),
      createdAtFa: new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(now),
    };

    inMemoryCustomGiftBoxes.unshift(newBox);
    return newBox;
  }

  async getCustomGiftBoxes() {
    if (isDbConnected()) {
      try {
        const items = await prisma.consultation.findMany({
          where: { inquiryType: 'custom_box' },
          orderBy: { createdAt: 'desc' },
        });
        if (items.length > 0) {
          return items.map(formatConsultationFromPrisma);
        }
      } catch (err) {
        console.warn('Prisma getCustomGiftBoxes fallback:', err);
      }
    }
    return inMemoryCustomGiftBoxes;
  }

  async deleteCustomGiftBox(id: string) {
    if (isDbConnected()) {
      try {
        await prisma.consultation.deleteMany({
          where: { id },
        });
        return { success: true };
      } catch (err) {
        console.warn('Prisma deleteCustomGiftBox fallback:', err);
      }
    }
    inMemoryCustomGiftBoxes = inMemoryCustomGiftBoxes.filter((b) => b.id !== id);
    return { success: true };
  }

  async getCustomItemOptions() {
    return this.getCustomItems();
  }

  async getCustomItems() {
    if (isDbConnected()) {
      try {
        return await prisma.customItemOption.findMany({
          where: { inStock: true },
          orderBy: { createdAt: 'desc' },
        });
      } catch (err) {
        console.warn('Prisma getCustomItems fallback:', err);
      }
    }
    return inMemoryCustomGiftBoxes;
  }

  async getCustomItemsAdmin() {
    if (isDbConnected()) {
      try {
        return await prisma.customItemOption.findMany({
          orderBy: { createdAt: 'desc' },
        });
      } catch (err) {
        console.warn('Prisma getCustomItemsAdmin fallback:', err);
      }
    }
    return inMemoryCustomGiftBoxes;
  }

  async createCustomItemAdmin(data: any) {
    const id = data.id || `custom-item-${Date.now()}`;
    const payload = {
      id,
      nameFa: String(data.nameFa || '').trim(),
      category: String(data.category || 'saffron').trim(),
      price: Number(data.price) || 0,
      image: String(data.image || '').trim(),
      weightGrams: Number(data.weightGrams) || 50,
      description: String(data.description || '').trim(),
      inStock: data.inStock !== false,
    };
    if (isDbConnected()) {
      return await prisma.customItemOption.create({
        data: payload,
      });
    }
    return payload;
  }

  async updateCustomItemAdmin(id: string, data: any) {
    const updateData: any = {};
    if (data.nameFa !== undefined) updateData.nameFa = String(data.nameFa).trim();
    if (data.category !== undefined) updateData.category = String(data.category).trim();
    if (data.price !== undefined) updateData.price = Number(data.price);
    if (data.image !== undefined) updateData.image = String(data.image).trim();
    if (data.weightGrams !== undefined) updateData.weightGrams = Number(data.weightGrams);
    if (data.description !== undefined) updateData.description = String(data.description).trim();
    if (data.inStock !== undefined) updateData.inStock = Boolean(data.inStock);

    if (isDbConnected()) {
      return await prisma.customItemOption.update({
        where: { id },
        data: updateData,
      });
    }
    return { id, ...updateData };
  }

  async deleteCustomItemAdmin(id: string) {
    if (isDbConnected()) {
      await prisma.customItemOption.delete({
        where: { id },
      });
      return { success: true };
    }
    return { success: true };
  }
}

export const inquiriesService = new InquiriesService();
