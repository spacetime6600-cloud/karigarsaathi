import { IEnquiryRepository } from '@/repositories/interfaces/IEnquiryRepository';
import { BuyerEnquiry, EnquiryWorkflowStatus, EnquiryReply } from '@/types';

export class MockEnquiryRepository implements IEnquiryRepository {
  private enquiries: Map<string, BuyerEnquiry> = new Map();

  async createEnquiry(enquiry: BuyerEnquiry): Promise<BuyerEnquiry> {
    this.enquiries.set(enquiry.id, { ...enquiry });
    return enquiry;
  }

  async getEnquiryById(enquiryId: string, requesterUid?: string): Promise<BuyerEnquiry | null> {
    const item = this.enquiries.get(enquiryId);
    if (!item) return null;
    if (requesterUid && item.artisanId !== requesterUid) {
      throw new Error('Access denied: You do not own this enquiry.');
    }
    return { ...item };
  }

  async listArtisanEnquiries(artisanId: string): Promise<BuyerEnquiry[]> {
    return Array.from(this.enquiries.values())
      .filter((e) => e.artisanId === artisanId)
      .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
  }

  async updateEnquiryStatus(
    enquiryId: string,
    artisanId: string,
    newStatus: EnquiryWorkflowStatus,
    note?: string
  ): Promise<BuyerEnquiry> {
    const item = await this.getEnquiryById(enquiryId, artisanId);
    if (!item) throw new Error(`Enquiry ${enquiryId} not found.`);

    const now = new Date().toISOString();
    const statusHistory = item.statusHistory ? [...item.statusHistory] : [];
    statusHistory.push({
      status: newStatus,
      changedAt: now,
      changedBy: artisanId,
      note,
    });

    item.status = newStatus;
    item.statusHistory = statusHistory;
    item.updatedAt = now;
    this.enquiries.set(enquiryId, item);
    return item;
  }

  async addEnquiryReply(
    enquiryId: string,
    artisanId: string,
    reply: EnquiryReply
  ): Promise<BuyerEnquiry> {
    const item = await this.getEnquiryById(enquiryId, artisanId);
    if (!item) throw new Error(`Enquiry ${enquiryId} not found.`);

    const now = new Date().toISOString();
    item.replies = [...(item.replies || []), reply];
    if (item.status === 'new') item.status = 'acknowledged';
    item.updatedAt = now;
    this.enquiries.set(enquiryId, item);
    return item;
  }

  async countNewEnquiries(artisanId: string): Promise<number> {
    return Array.from(this.enquiries.values()).filter(
      (e) => e.artisanId === artisanId && e.status === 'new'
    ).length;
  }
}
