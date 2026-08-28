import { IAuthRepository } from './interfaces/IAuthRepository';
import { IArtisanProfileRepository } from './interfaces/IArtisanProfileRepository';
import { IProductRepository } from './interfaces/IProductRepository';
import { IProductPhotoStorage } from './interfaces/IProductPhotoStorage';
import { IPassportRepository } from './interfaces/IPassportRepository';
import { IEnquiryRepository } from './interfaces/IEnquiryRepository';
import { ICoordinatorRepository } from './interfaces/ICoordinatorRepository';

import { FirebaseAuthRepository } from './firebase/FirebaseAuthRepository';
import { FirestoreArtisanProfileRepository } from './firebase/FirestoreArtisanProfileRepository';
import { FirestoreProductRepository } from './firebase/FirestoreProductRepository';
import { FirebaseProductPhotoStorage } from './firebase/FirebaseProductPhotoStorage';
import { FirestorePassportRepository } from './firebase/FirestorePassportRepository';
import { FirestoreEnquiryRepository } from './firebase/FirestoreEnquiryRepository';
import { FirestoreCoordinatorRepository } from './firebase/FirestoreCoordinatorRepository';

import { MockAuthRepository } from './mock/MockAuthRepository';
import { MockArtisanProfileRepository } from './mock/MockArtisanProfileRepository';
import { MockProductRepository } from './mock/MockProductRepository';
import { MockProductPhotoStorage } from './mock/MockProductPhotoStorage';
import { MockPassportRepository } from './mock/MockPassportRepository';
import { MockEnquiryRepository } from './mock/MockEnquiryRepository';
import { MockCoordinatorRepository } from './mock/MockCoordinatorRepository';

import { logger } from '@/services/logging/logger';

const isMockMode = import.meta.env.VITE_REPOSITORY_MODE === 'mock';

export const authRepository: IAuthRepository = isMockMode
  ? new MockAuthRepository()
  : new FirebaseAuthRepository();

export const artisanProfileRepository: IArtisanProfileRepository = isMockMode
  ? new MockArtisanProfileRepository()
  : new FirestoreArtisanProfileRepository();

export const productRepository: IProductRepository = isMockMode
  ? new MockProductRepository()
  : new FirestoreProductRepository();

export const productPhotoStorage: IProductPhotoStorage = isMockMode
  ? new MockProductPhotoStorage()
  : new FirebaseProductPhotoStorage();

export const passportRepository: IPassportRepository = isMockMode
  ? new MockPassportRepository()
  : new FirestorePassportRepository();

export const enquiryRepository: IEnquiryRepository = isMockMode
  ? new MockEnquiryRepository()
  : new FirestoreEnquiryRepository();

export const coordinatorRepository: ICoordinatorRepository = isMockMode
  ? new MockCoordinatorRepository()
  : new FirestoreCoordinatorRepository();

logger.info('SYSTEM', `Repositories initialized in ${isMockMode ? 'MOCK' : 'FIREBASE'} mode`);

export * from './interfaces';

