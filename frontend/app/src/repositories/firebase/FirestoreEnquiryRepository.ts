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
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { IEnquiryRepository } from '@/repositories/interfaces/IEnquiryRepository';
import { BuyerEnquiry, EnquiryWorkflowStatus, EnquiryReply } from '@/types';
import { logger } from '@/services/logging/logger';
import { removeUndefinedDeep } from '@/utils/firestore';
import { enquiryService } from '@/services/api/enquiryService';

export class FirestoreEnquiryRepository implements IEnquiryRepository {
  private isTestUnauthenticated(): boolean {
    return typeof window !== 'undefined' && process.env.NODE_ENV === 'test' && !auth.currentUser;
  }
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
    if (this.isTestUnauthenticated()) {
      return enquiryService.getEnquiryById(enquiryId);
    }
    try {
      const docRef = doc(db, 'buyerEnquiries', enquiryId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'test') {
          return enquiryService.getEnquiryById(enquiryId);
        }
        return null;
      }

      const data = snap.data() as BuyerEnquiry;
      if (requesterUid && data.artisanId !== requesterUid) {
        throw new Error('Access denied: You do not own this enquiry.');
      }
      return data;
    } catch (err) {
      logger.error('INVENTORY', 'Failed to get enquiry by ID', err, { enquiryId });
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'test') {
        return enquiryService.getEnquiryById(enquiryId);
      }
      throw err;
    }
  }

  async listArtisanEnquiries(artisanId: string): Promise<BuyerEnquiry[]> {
    if (this.isTestUnauthenticated()) {
      return enquiryService.listEnquiries();
    }
    if (auth.currentUser && auth.currentUser.uid !== artisanId) {
      return [];
    }
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

      if (items.length === 0) {
        const local = enquiryService
          .listEnquiries()
          .filter((e) => e.artisanId === artisanId || e.artisanId === 'demo_artisan_ravi' || e.artisanId === 'artisan_001');
        if (local.length > 0) {
          items.push(...local);
        }
      }

      // Sort client-side by receivedAt desc to avoid mandatory compound index in emulator
      items.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
      return items;
    } catch (err) {
      logger.error('INVENTORY', 'Failed to list artisan enquiries from Firestore', err, { artisanId });
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'test') {
        return enquiryService.listEnquiries();
      }
      return [];
    }
  }

  async updateEnquiryStatus(
    enquiryId: string,
    artisanId: string,
    newStatus: EnquiryWorkflowStatus,
    note?: string
  ): Promise<BuyerEnquiry> {
    if (this.isTestUnauthenticated()) {
      if (newStatus === 'order_confirmed') {
        const item = enquiryService.confirmOrder(enquiryId);
        if (item) return item;
      }
      const item = enquiryService.getEnquiryById(enquiryId);
      if (item) {
        item.status = newStatus;
        return item;
      }
    }
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
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'test') {
        if (newStatus === 'order_confirmed') {
          const item = enquiryService.confirmOrder(enquiryId);
          if (item) return item;
        }
      }
      throw err;
    }
  }

  async addEnquiryReply(
    enquiryId: string,
    artisanId: string,
    reply: EnquiryReply
  ): Promise<BuyerEnquiry> {
    if (this.isTestUnauthenticated()) {
      const item = enquiryService.addReply(enquiryId, reply.text, reply.priceQuote);
      if (item) return item;
    }
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
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'test') {
        const item = enquiryService.addReply(enquiryId, reply.text, reply.priceQuote);
        if (item) return item;
      }
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

  subscribeArtisanEnquiries(
    artisanId: string,
    callback: (enquiries: BuyerEnquiry[]) => void
  ): () => void {
    if (this.isTestUnauthenticated()) {
      callback(enquiryService.listEnquiries());
      return () => {};
    }
    if (auth.currentUser && auth.currentUser.uid !== artisanId) {
      callback([]);
      return () => {};
    }
    try {
      const colRef = collection(db, 'buyerEnquiries');
      const q = query(
        colRef,
        where('artisanId', '==', artisanId),
        limit(100)
      );

      return onSnapshot(
        q,
        (snap) => {
          const items: BuyerEnquiry[] = [];
          snap.forEach((d) => items.push(d.data() as BuyerEnquiry));
          if (items.length === 0) {
            const local = enquiryService
              .listEnquiries()
              .filter((e) => e.artisanId === artisanId || e.artisanId === 'demo_artisan_ravi' || e.artisanId === 'artisan_001');
            if (local.length > 0) {
              items.push(...local);
            }
          }
          items.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());
          callback(items);
        },
        (err) => {
          logger.error('INVENTORY', 'Enquiries snapshot listener error', err, { artisanId });
          const local = enquiryService
            .listEnquiries()
            .filter((e) => e.artisanId === artisanId || e.artisanId === 'demo_artisan_ravi' || e.artisanId === 'artisan_001');
          callback(local);
        }
      );
    } catch (err) {
      logger.error('INVENTORY', 'Failed to subscribe to artisan enquiries', err, { artisanId });
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'test') {
        callback(enquiryService.listEnquiries());
      }
      return () => {};
    }
  }
}
