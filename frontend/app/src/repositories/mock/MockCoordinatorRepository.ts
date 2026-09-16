import { ICoordinatorRepository } from '@/repositories/interfaces/ICoordinatorRepository';
import { CoordinatorAssignment, CoordinatorArtisanProjection } from '@/types';
import { DEMO_COORDINATOR_ASSIGNMENTS } from '@/services/demo/demoDataService';

export class MockCoordinatorRepository implements ICoordinatorRepository {
  private assignments: Map<string, CoordinatorAssignment> = new Map();
  private projections: Map<string, CoordinatorArtisanProjection> = new Map();

  constructor() {
    DEMO_COORDINATOR_ASSIGNMENTS.forEach((s) => {
      this.assignments.set(s.id, s);
    });
  }

  async getAssignment(coordinatorUid: string, artisanUid: string): Promise<CoordinatorAssignment | null> {
    const list = Array.from(this.assignments.values());
    const found = list.find((a) => a.coordinatorUid === coordinatorUid && a.artisanUid === artisanUid);
    if (!found || !found.active) return null;
    if (found.expiresAt && new Date(found.expiresAt).getTime() <= Date.now()) return null;
    return { ...found };
  }

  async listCoordinatorAssignments(coordinatorUid: string): Promise<CoordinatorAssignment[]> {
    return Array.from(this.assignments.values()).filter((a) => {
      if (a.coordinatorUid !== coordinatorUid || !a.active) return false;
      if (a.expiresAt && new Date(a.expiresAt).getTime() <= Date.now()) return false;
      return true;
    });
  }

  async createAssignment(assignment: CoordinatorAssignment): Promise<CoordinatorAssignment> {
    const id = assignment.id || `coord_${assignment.coordinatorUid}_${assignment.artisanUid}`;
    const record = { ...assignment, id };
    this.assignments.set(id, record);
    return record;
  }

  async revokeAssignment(assignmentId: string): Promise<void> {
    const item = this.assignments.get(assignmentId);
    if (item) {
      item.active = false;
      this.assignments.set(assignmentId, item);
    }
  }

  async getArtisanProjection(artisanUid: string): Promise<CoordinatorArtisanProjection | null> {
    const item = this.projections.get(artisanUid);
    return item ? { ...item } : null;
  }

  async saveArtisanProjection(projection: CoordinatorArtisanProjection): Promise<void> {
    this.projections.set(projection.artisanUid, { ...projection });
  }
}
