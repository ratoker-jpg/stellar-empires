import type { SaveEnvelope, SaveRepository } from './types';

const DATABASE_NAME = 'stellar-empires';
const DATABASE_VERSION = 1;
const STORE_NAME = 'saves';

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });
}

function transactionToPromise(transaction: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('IndexedDB transaction was aborted.'));
  });
}

export class IndexedDbSaveRepository implements SaveRepository {
  readonly #databasePromise: Promise<IDBDatabase>;

  constructor(databaseName = DATABASE_NAME) {
    this.#databasePromise = this.#open(databaseName);
  }

  async put(save: SaveEnvelope): Promise<void> {
    const database = await this.#databasePromise;
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(save);
    await transactionToPromise(transaction);
  }

  async get(slotId: string): Promise<SaveEnvelope | undefined> {
    const database = await this.#databasePromise;
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get(slotId) as IDBRequest<
      SaveEnvelope | undefined
    >;
    const result = await requestToPromise(request);
    await transactionToPromise(transaction);
    return result;
  }

  async list(): Promise<readonly SaveEnvelope[]> {
    const database = await this.#databasePromise;
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).getAll() as IDBRequest<SaveEnvelope[]>;
    const result = await requestToPromise(request);
    await transactionToPromise(transaction);
    return result.sort((left, right) => left.slotId.localeCompare(right.slotId));
  }

  async delete(slotId: string): Promise<void> {
    const database = await this.#databasePromise;
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(slotId);
    await transactionToPromise(transaction);
  }

  #open(databaseName: string): Promise<IDBDatabase> {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(databaseName, DATABASE_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;

        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: 'slotId' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(request.error ?? new Error('Failed to open IndexedDB database.'));
    });
  }
}
