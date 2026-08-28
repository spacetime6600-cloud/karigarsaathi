import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { IEnquiryRepository } from '@/repositories/interfaces/IEnquiryRepository';
import { BuyerEnquiry, EnquiryWorkflowStatus, EnquiryReply } from '@/types';
import { logger } from '@/services/logging/logger';
import { removeUndefinedDeep } from '@/utils/firestore';

export class FirestoreEnquiryRepository implements IEnquiryRepository {
  async createEnquiry(enquiry: BuyerEnquiry): Promise<BuyerEnquiry> {
    try {
      const docRef = doc(db, 'buyerEnquiries', enquiry.id);
      const safeEnquiry = removeUndefinedDeep(enquiry);
      await setDoc(docRef, safeEnquiry);
      logger.info('INVENTORY', 'Enquiry persisted to Firestore', {
        enquiryId: enquiry.id,
        artisanId: enquiry.artisanId,
        productId: enquiry.productId,
      });
      return safeEnquiry;
    } catch (err) {
      logger.error('INVENTORY', 'Failed to create enquiry in Firestore', err, {
        enquiryId: enquiry.id,
      });
      throw err;
    }
  }

  async getEnquiryById(enquiryId: string, requesterUid?: string): Promise<BuyerEnquiry | null> {
    try {
      const docRef = doc(db, 'buyerEnquiries', enquiryId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;

      const data = snap.data() as BuyerEnquiry;
      if (requesterUid && data.artisanId !== requesterUid) {
        throw new Error('Access denied: You do not own this enquiry.');
      }
      return data;
    } catch (err) {
      logger.error('INVENTORY', 'Failed to get enquiry by ID', err, { enquiryId });
      throw err;
    }
  }

  async listArtisanEnquiries(artisanId: string): Promise<BuyerEnquiry[]> {
    try {
      const colRef = collection(db, 'buyerEnquiries');
      const q = query(
        colRef,
        where('artisanId', '==', artisanId),
        limit(100)
      );

      const snap = await getDocs(q);
      const items: BuyerEnquiry[] = [];
      snap.forEach((d) => items.push(d.data() as BuyerEnquiry));

      // Sort client-side by receivedAt desc to avoid mandatory compound index in emulator
      items.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
      return items;
    } catch (err) {
      logger.error('INVENTORY', 'Failed to list artisan enquiries from Firestore', err, { artisanId });
      throw err;
    }
  }

  async updateEnquiryStatus(
    enquiryId: string,
    artisanId: string,
    newStatus: EnquiryWorkflowStatus,
    note?: string
  ): Promise<BuyerEnquiry> {
    try {
      const enquiry = await this.getEnquiryById(enquiryId, artisanId);
      if (!enquiry) {
        throw new Error(`Enquiry ${enquiryId} not found.`);
      }

      const now = new Date().toISOString();
      const statusHistory = enquiry.statusHistory ? [...enquiry.statusHistory] : [];
      statusHistory.push({
        status: newStatus,
        changedAt: now,
        changedBy: artisanId,
        note,
      });

      const docRef = doc(db, 'buyerEnquiries', enquiryId);
      const updateData = removeUndefinedDeep({
        status: newStatus,
        statusHistory,
        updatedAt: now,
      });

      await updateDoc(docRef, updateData);
      return {
        ...enquiry,
        status: newStatus,
        statusHistory,
        updatedAt: now,
      };
    } catch (err) {
      logger.error('INVENTORY', 'Failed to update enquiry status', err, { enquiryId, artisanId, newStatus });
      throw err;
    }
  }

  async addEnquiryReply(
    enquiryId: string,
    artisanId: string,
    reply: EnquiryReply
  ): Promise<BuyerEnquiry> {
    try {
      const enquiry = await this.getEnquiryById(enquiryId, artisanId);
      if (!enquiry) {
        throw new Error(`Enquiry ${enquiryId} not found.`);
      }

      const now = new Date().toISOString();
      const updatedReplies = [...(enquiry.replies || []), reply];
      const newStatus: EnquiryWorkflowStatus = enquiry.status === 'new' ? 'acknowledged' : enquiry.status;

      const docRef = doc(db, 'buyerEnquiries', enquiryId);
      const updateData = removeUndefinedDeep({
        replies: updatedReplies,
        status: newStatus,
        updatedAt: now,
      });

      await updateDoc(docRef, updateData);
      return {
        ...enquiry,
        replies: updatedReplies,
        status: newStatus,
        updatedAt: now,
      };
    } catch (err) {
      logger.error('INVENTORY', 'Failed to add enquiry reply', err, { enquiryId, artisanId });
      throw err;
    }
  }

  async countNewEnquiries(artisanId: string): Promise<number> {
    try {
      const enquiries = await this.listArtisanEnquiries(artisanId);
      return enquiries.filter((e) => e.status === 'new').length;
    } catch {
      return 0;
    }
  }
}
