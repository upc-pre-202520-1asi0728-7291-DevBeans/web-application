// lib/services/offline.service.ts

import { CoffeeLot } from './coffee-lot.service';
import { ClassificationSession } from './classification.service';

const DB_NAME = 'BeanDetectOfflineDB';
const DB_VERSION = 1;

// Tipos de operaciones pendientes
export enum OperationType {
    CREATE_LOT = 'CREATE_LOT',
    UPDATE_LOT = 'UPDATE_LOT',
    DELETE_LOT = 'DELETE_LOT',
    CREATE_CLASSIFICATION = 'CREATE_CLASSIFICATION',
}

export interface PendingOperation {
    id?: number;
    type: OperationType;
    data: any;
    timestamp: number;
    retryCount: number;
    error?: string;
}

class OfflineService {
    private db: IDBDatabase | null = null;

    async initDB(): Promise<IDBDatabase> {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(request.result);
            };

            request.onupgradeneeded = (event: any) => {
                const db = event.target.result;

                // Store para lotes de café
                if (!db.objectStoreNames.contains('coffeeLots')) {
                    const lotStore = db.createObjectStore('coffeeLots', { keyPath: 'id' });
                    lotStore.createIndex('lot_number', 'lot_number', { unique: false });
                    lotStore.createIndex('status', 'status', { unique: false });
                }

                // Store para sesiones de clasificación
                if (!db.objectStoreNames.contains('classificationSessions')) {
                    const sessionStore = db.createObjectStore('classificationSessions', { keyPath: 'id' });
                    sessionStore.createIndex('coffee_lot_id', 'coffee_lot_id', { unique: false });
                    sessionStore.createIndex('status', 'status', { unique: false });
                }

                // Store para operaciones pendientes
                if (!db.objectStoreNames.contains('pendingOperations')) {
                    const opStore = db.createObjectStore('pendingOperations', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    opStore.createIndex('type', 'type', { unique: false });
                    opStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // Store para datos del perfil de usuario
                if (!db.objectStoreNames.contains('userProfile')) {
                    db.createObjectStore('userProfile', { keyPath: 'user_id' });
                }
            };
        });
    }

    // ============ COFFEE LOTS ============

    async saveLotLocally(lot: CoffeeLot): Promise<void> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['coffeeLots'], 'readwrite');
            const store = transaction.objectStore('coffeeLots');
            const request = store.put(lot);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getLotsLocally(): Promise<CoffeeLot[]> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['coffeeLots'], 'readonly');
            const store = transaction.objectStore('coffeeLots');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getLotByIdLocally(lotId: number): Promise<CoffeeLot | null> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['coffeeLots'], 'readonly');
            const store = transaction.objectStore('coffeeLots');
            const request = store.get(lotId);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteLotLocally(lotId: number): Promise<void> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['coffeeLots'], 'readwrite');
            const store = transaction.objectStore('coffeeLots');
            const request = store.delete(lotId);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // ============ CLASSIFICATION SESSIONS ============

    async saveSessionLocally(session: ClassificationSession): Promise<void> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['classificationSessions'], 'readwrite');
            const store = transaction.objectStore('classificationSessions');
            const request = store.put(session);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getSessionsLocally(): Promise<ClassificationSession[]> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['classificationSessions'], 'readonly');
            const store = transaction.objectStore('classificationSessions');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getSessionsByCoffeeLotLocally(coffeeLotId: number): Promise<ClassificationSession[]> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['classificationSessions'], 'readonly');
            const store = transaction.objectStore('classificationSessions');
            const index = store.index('coffee_lot_id');
            const request = index.getAll(coffeeLotId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // ============ PENDING OPERATIONS ============

    async addPendingOperation(operation: Omit<PendingOperation, 'id'>): Promise<void> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['pendingOperations'], 'readwrite');
            const store = transaction.objectStore('pendingOperations');
            const request = store.add(operation);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getPendingOperations(): Promise<PendingOperation[]> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['pendingOperations'], 'readonly');
            const store = transaction.objectStore('pendingOperations');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deletePendingOperation(operationId: number): Promise<void> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['pendingOperations'], 'readwrite');
            const store = transaction.objectStore('pendingOperations');
            const request = store.delete(operationId);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async updatePendingOperation(operation: PendingOperation): Promise<void> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['pendingOperations'], 'readwrite');
            const store = transaction.objectStore('pendingOperations');
            const request = store.put(operation);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clearPendingOperations(): Promise<void> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['pendingOperations'], 'readwrite');
            const store = transaction.objectStore('pendingOperations');
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // ============ USER PROFILE ============

    async saveUserProfileLocally(profile: any): Promise<void> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['userProfile'], 'readwrite');
            const store = transaction.objectStore('userProfile');
            const request = store.put(profile);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getUserProfileLocally(userId: number): Promise<any | null> {
        const db = await this.initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['userProfile'], 'readonly');
            const store = transaction.objectStore('userProfile');
            const request = store.get(userId);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    // ============ UTILITIES ============

    async clearAllData(): Promise<void> {
        const db = await this.initDB();
        const stores = ['coffeeLots', 'classificationSessions', 'pendingOperations', 'userProfile'];

        for (const storeName of stores) {
            await new Promise<void>((resolve, reject) => {
                const transaction = db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.clear();

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
    }
}

export const offlineService = new OfflineService();