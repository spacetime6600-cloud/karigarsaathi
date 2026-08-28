import { BuyerEnquiry, EnquiryReply } from '@/types';
import { storage } from '../storage/localStorage';

const SEED_ENQUIRIES: BuyerEnquiry[] = [
  {
    id: 'enq_101',
    productId: 'draft_default_01',
    productTitle: 'Indigo & Terracotta Silk Jamdani Saree',
    productImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&auto=format&fit=crop&q=80',
    artisanId: 'artisan_001',
    buyerName: 'Ananya Deshmukh',
    buyerLocation: 'Mumbai, Maharashtra',
    buyerPhone: '+91 98201 54321',
    buyerContact: '+91 98201 54321',
    buyerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    initialMessage: 'Namaste Ravi ji! I saw your verified Craft Passport for the Jamdani Saree. Can you deliver 2 sarees with matching blouse pieces by next month?',
    message: 'Namaste Ravi ji! I saw your verified Craft Passport for the Jamdani Saree. Can you deliver 2 sarees with matching blouse pieces by next month?',
    quantityRequested: 2,
    preferredContactMethod: 'whatsapp',
    consentToBeContacted: true,
    status: 'new',
    receivedAt: 'Today at 10:30 AM',
    createdAt: '2026-08-27T10:30:00Z',
    replies: [],
    schemaVersion: 1,
  },
  {
    id: 'enq_102',
    productId: 'draft_default_01',
    productTitle: 'Natural Fiber Handwoven Basket Set',
    productImage: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&auto=format&fit=crop&q=80',
    artisanId: 'artisan_001',
    buyerName: 'CraftBazaar Boutique (Kiran Sen)',
    buyerLocation: 'Bengaluru, Karnataka',
    buyerPhone: '+91 98450 11223',
    buyerContact: '+91 98450 11223',
    buyerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    initialMessage: 'Interested in wholesale bulk order of 25 basket sets for our upcoming Diwali handicraft exhibition. Could you provide a wholesale quote?',
    message: 'Interested in wholesale bulk order of 25 basket sets for our upcoming Diwali handicraft exhibition. Could you provide a wholesale quote?',
    quantityRequested: 25,
    preferredContactMethod: 'whatsapp',
    consentToBeContacted: true,
    status: 'replied',
    receivedAt: 'Yesterday',
    createdAt: '2026-08-26T14:00:00Z',
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

export const enquiryService = {
  listEnquiries(): BuyerEnquiry[] {
    return storage.get<BuyerEnquiry[]>('buyerEnquiries', SEED_ENQUIRIES);
  },

  getEnquiryById(id: string): BuyerEnquiry | null {
    const list = this.listEnquiries();
    return list.find((e) => e.id === id) || null;
  },

  addReply(enquiryId: string, replyText: string, priceQuote?: number): BuyerEnquiry | null {
    const list = this.listEnquiries();
    const item = list.find((e) => e.id === enquiryId);
    if (!item) return null;

    const newReply: EnquiryReply = {
      id: `rep_${Date.now()}`,
      sender: 'artisan',
      text: replyText,
      timestamp: 'Just now',
      priceQuote,
    };

    item.replies.push(newReply);
    item.status = 'replied';
    storage.set('buyerEnquiries', list);
    return item;
  },

  confirmOrder(enquiryId: string): BuyerEnquiry | null {
    const list = this.listEnquiries();
    const item = list.find((e) => e.id === enquiryId);
    if (!item) return null;

    item.status = 'order_confirmed';
    storage.set('buyerEnquiries', list);
    return item;
  },
};
