import { IEnquiryRepository } from '@/repositories/interfaces/IEnquiryRepository';
import { BuyerEnquiry, EnquiryWorkflowStatus, EnquiryReply } from '@/types';

const DEFAULT_MOCK_ENQUIRIES: BuyerEnquiry[] = [
  {
    id: 'enq_101',
    productId: 'draft_default_01',
    productTitle: 'Indigo & Terracotta Silk Jamdani Saree',
    productImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop&q=80',
    artisanId: 'demo_artisan_ravi',
    buyerName: 'Ananya Deshmukh',
    destinationCity: 'Mumbai, Maharashtra',
    buyerPhone: '+91 98201 54321',
    buyerContact: '+91 98201 54321',
    initialMessage: 'Namaste Ravi ji! I saw your verified Craft Passport for the Jamdani Saree. Can you deliver 2 sarees with matching blouse pieces by next month?',
    message: 'Namaste Ravi ji! I saw your verified Craft Passport for the Jamdani Saree. Can you deliver 2 sarees with matching blouse pieces by next month?',
    quantityRequested: 2,
    preferredContactMethod: 'whatsapp',
    consentToBeContacted: true,
    status: 'new',
    receivedAt: '2026-08-28T10:30:00Z',
    createdAt: '2026-08-28T10:30:00Z',
    updatedAt: '2026-08-28T10:30:00Z',
    replies: [],
    schemaVersion: 1,
  },
  {
    id: 'enq_102',
    productId: 'draft_default_01',
    productTitle: 'Natural Fiber Handwoven Basket Set',
    productImage: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&auto=format&fit=crop&q=80',
    artisanId: 'demo_artisan_ravi',
    buyerName: 'CraftBazaar Boutique (Kiran Sen)',
    destinationCity: 'Bengaluru, Karnataka',
    buyerPhone: '+91 98450 11223',
    buyerContact: '+91 98450 11223',
    initialMessage: 'Interested in wholesale bulk order of 25 basket sets for our upcoming Diwali handicraft exhibition. Could you provide a wholesale quote?',
    message: 'Interested in wholesale bulk order of 25 basket sets for our upcoming Diwali handicraft exhibition. Could you provide a wholesale quote?',
    quantityRequested: 25,
    preferredContactMethod: 'whatsapp',
    consentToBeContacted: true,
    status: 'acknowledged',
    receivedAt: '2026-08-27T14:00:00Z',
    createdAt: '2026-08-27T14:00:00Z',
    updatedAt: '2026-08-27T14:00:00Z',
    replies: [
      {
        id: 'rep_1',
        sender: 'artisan',
        text: 'Namaste Kiran ji, thank you for supporting traditional artisans. For 25 sets, we can offer ₹1,850 per set with verified Craft Tags.',
        timestamp: 'Yesterday at 4:15 PM',
        priceQuote: 1850,
      },
    ],
    schemaVersion: 1,
  },
];

export class MockEnquiryRepository implements IEnquiryRepository {
  private enquiries: Map<string, BuyerEnquiry> = new Map();

  constructor() {
    DEFAULT_MOCK_ENQUIRIES.forEach((e) => {
      this.enquiries.set(e.id, { ...e });
    });
  }

  async createEnquiry(enquiry: BuyerEnquiry): Promise<BuyerEnquiry> {
    this.enquiries.set(enquiry.id, { ...enquiry });
    this.notify(enquiry.artisanId);
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
    this.notify(artisanId);
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
    this.notify(artisanId);
    return item;
  }

  async countNewEnquiries(artisanId: string): Promise<number> {
    return Array.from(this.enquiries.values()).filter(
      (e) => e.artisanId === artisanId && e.status === 'new'
    ).length;
  }

  private listeners: Map<string, Set<(enquiries: BuyerEnquiry[]) => void>> = new Map();

  subscribeArtisanEnquiries(
    artisanId: string,
    callback: (enquiries: BuyerEnquiry[]) => void
  ): () => void {
    if (!this.listeners.has(artisanId)) {
      this.listeners.set(artisanId, new Set());
    }
    const set = this.listeners.get(artisanId)!;
    set.add(callback);
    this.listArtisanEnquiries(artisanId).then((res) => callback(res));
    return () => {
      set.delete(callback);
    };
  }

  private notify(artisanId: string) {
    const set = this.listeners.get(artisanId);
    if (set) {
      this.listArtisanEnquiries(artisanId).then((res) => {
        set.forEach((cb) => cb(res));
      });
    }
  }
}
