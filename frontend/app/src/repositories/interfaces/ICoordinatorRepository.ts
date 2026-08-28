import {
  CoordinatorAssignment,
  CoordinatorArtisanProjection,
} from '@/types';

export interface ICoordinatorRepository {
  getAssignment(coordinatorUid: string, artisanUid: string): Promise<CoordinatorAssignment | null>;
  listCoordinatorAssignments(coordinatorUid: string): Promise<CoordinatorAssignment[]>;
  createAssignment(assignment: CoordinatorAssignment): Promise<CoordinatorAssignment>;
  revokeAssignment(assignmentId: string): Promise<void>;
  getArtisanProjection(artisanUid: string): Promise<CoordinatorArtisanProjection | null>;
  saveArtisanProjection(projection: CoordinatorArtisanProjection): Promise<void>;
}
