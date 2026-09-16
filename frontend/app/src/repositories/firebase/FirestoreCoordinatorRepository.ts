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
import { ICoordinatorRepository } from '@/repositories/interfaces/ICoordinatorRepository';
import { CoordinatorAssignment, CoordinatorArtisanProjection } from '@/types';
import { logger } from '@/services/logging/logger';
import { removeUndefinedDeep } from '@/utils/firestore';
import { DEMO_COORDINATOR_ASSIGNMENTS } from '@/services/demo/demoDataService';

export class FirestoreCoordinatorRepository implements ICoordinatorRepository {
  async getAssignment(coordinatorUid: string, artisanUid: string): Promise<CoordinatorAssignment | null> {
    try {
      const assignmentId = `coord_${coordinatorUid}_${artisanUid}`;
      const docRef = doc(db, 'coordinatorAssignments', assignmentId);
      const snap = await getDoc(docRef);

      if (!snap.exists()) {
        // Also fallback to query if custom ID was used
        const q = query(
          collection(db, 'coordinatorAssignments'),
          where('coordinatorUid', '==', coordinatorUid),
          where('artisanUid', '==', artisanUid),
          limit(1)
        );
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          return qSnap.docs[0].data() as CoordinatorAssignment;
        }

        // Fallback for seed assignments in development
        const seedAssignments = await this.listCoordinatorAssignments(coordinatorUid);
        const seedFound = seedAssignments.find((a) => a.artisanUid === artisanUid);
        return seedFound || null;
      }

      return snap.data() as CoordinatorAssignment;
    } catch (err) {
      logger.error('COORDINATOR', 'Failed to read coordinator assignment', err, { coordinatorUid, artisanUid });
      const seedAssignments = await this.listCoordinatorAssignments(coordinatorUid);
      return seedAssignments.find((a) => a.artisanUid === artisanUid) || null;
    }
  }

  async listCoordinatorAssignments(coordinatorUid: string): Promise<CoordinatorAssignment[]> {
    try {
      const colRef = collection(db, 'coordinatorAssignments');
      const q = query(
        colRef,
        where('coordinatorUid', '==', coordinatorUid),
        limit(50)
      );

      const snap = await getDocs(q);
      const list: CoordinatorAssignment[] = [];
      snap.forEach((d) => {
        const item = d.data() as CoordinatorAssignment;
        if (item.active) {
          if (!item.expiresAt || new Date(item.expiresAt).getTime() > Date.now()) {
            list.push(item);
          }
        }
      });

      if (list.length === 0) {
        const matches = DEMO_COORDINATOR_ASSIGNMENTS.filter((a) => a.coordinatorUid === coordinatorUid);
        if (matches.length > 0) return matches;
        // Default to Priya's demo assignments if generic coordinator
        return DEMO_COORDINATOR_ASSIGNMENTS.filter((a) => a.coordinatorUid === 'demo_coord_priya');
      }

      return list;
    } catch (err) {
      logger.error('COORDINATOR', 'Failed to list coordinator assignments', err, { coordinatorUid });
      const matches = DEMO_COORDINATOR_ASSIGNMENTS.filter((a) => a.coordinatorUid === coordinatorUid);
      if (matches.length > 0) return matches;
      return DEMO_COORDINATOR_ASSIGNMENTS.filter((a) => a.coordinatorUid === 'demo_coord_priya');
    }
  }

  async createAssignment(assignment: CoordinatorAssignment): Promise<CoordinatorAssignment> {
    try {
      const assignmentId = assignment.id || `coord_${assignment.coordinatorUid}_${assignment.artisanUid}`;
      const docRef = doc(db, 'coordinatorAssignments', assignmentId);
      const safeRecord = removeUndefinedDeep({
        ...assignment,
        id: assignmentId,
      });
      await setDoc(docRef, safeRecord);
      logger.info('COORDINATOR', 'Created coordinator assignment in Firestore', { assignmentId });
      return safeRecord;
    } catch (err) {
      logger.error('COORDINATOR', 'Failed to create coordinator assignment', err, { assignment });
      throw err;
    }
  }

  async revokeAssignment(assignmentId: string): Promise<void> {
    try {
      const docRef = doc(db, 'coordinatorAssignments', assignmentId);
      const now = new Date().toISOString();
      await updateDoc(docRef, {
        active: false,
        updatedAt: now,
      });
      logger.info('COORDINATOR', 'Revoked coordinator assignment', { assignmentId });
    } catch (err) {
      logger.error('COORDINATOR', 'Failed to revoke coordinator assignment', err, { assignmentId });
      throw err;
    }
  }

  async getArtisanProjection(artisanUid: string): Promise<CoordinatorArtisanProjection | null> {
    try {
      const docRef = doc(db, 'coordinatorProjections', artisanUid);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return null;
      return snap.data() as CoordinatorArtisanProjection;
    } catch (err) {
      logger.error('COORDINATOR', 'Failed to get coordinator projection', err, { artisanUid });
      return null;
    }
  }

  async saveArtisanProjection(projection: CoordinatorArtisanProjection): Promise<void> {
    try {
      const docRef = doc(db, 'coordinatorProjections', projection.artisanUid);
      const safeRecord = removeUndefinedDeep(projection);
      await setDoc(docRef, safeRecord);
    } catch (err) {
      logger.error('COORDINATOR', 'Failed to save coordinator projection', err, { artisanUid: projection.artisanUid });
      throw err;
    }
  }
}
