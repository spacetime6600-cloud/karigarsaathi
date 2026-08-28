import { BuyerEnquiry, EnquiryWorkflowStatus, EnquiryReply } from '@/types';

export interface IEnquiryRepository {
  createEnquiry(enquiry: BuyerEnquiry): Promise<BuyerEnquiry>;
  getEnquiryById(enquiryId: string, requesterUid?: string): Promise<BuyerEnquiry | null>;
  listArtisanEnquiries(artisanId: string): Promise<BuyerEnquiry[]>;
  updateEnquiryStatus(
    enquiryId: string,
    artisanId: string,
    newStatus: EnquiryWorkflowStatus,
    note?: string
  ): Promise<BuyerEnquiry>;
  addEnquiryReply(
    enquiryId: string,
    artisanId: string,
    reply: EnquiryReply
  ): Promise<BuyerEnquiry>;
  countNewEnquiries(artisanId: string): Promise<number>;
}
