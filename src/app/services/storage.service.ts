import { EventEmitter, Injectable, Output } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'iRC2hjVv6tIXECHGu';
  private readonly storeName = 'iYl8QKGrsKO';
  private readonly dbVersion = 1;
  private user_id="";

  //event for initializing the storage service
  @Output() storageServiceInitialized = new EventEmitter<boolean>();

  constructor() {
    this.openDB();
  }

  setUserId(user_id:string){
    this.user_id=user_id;
  }

  hasDB() {
    return this.db !== null;
  }

  private toByte(obj: any): Uint8Array {
    if (typeof obj === 'string') {
      return new TextEncoder().encode(obj);
    }
    const str = JSON.stringify(obj);
    return new TextEncoder().encode(str);
  }

  private fromByte(bytes: Uint8Array): any {
    const str = new TextDecoder().decode(bytes);
    try {
      return JSON.parse(str);
    } catch (e) {
      return str;
    }
  }


  /**
   * Opens (or creates) the IndexedDB database and object store.
   */
  private openDB(): void {
    const request = indexedDB.open(this.dbName, this.dbVersion);

    // Create or upgrade the database.
    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(this.storeName)) {
        // Create an object store with "key" as the keyPath.
        const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
        // Optionally, create an index on the key for faster lookups.
        store.createIndex('key', 'key', { unique: true });
      }
    };

    request.onsuccess = (event: Event) => {
      this.db = (event.target as IDBOpenDBRequest).result;
      this.storageServiceInitialized.emit(true);
      console.log('IndexedDB opened successfully');
    };

    request.onerror = (event: Event) => {
      console.error('Error opening IndexedDB', event);
    };
  }

  /**
   * Saves an item to the store. If an item with the same key exists, it will be updated.
   * @param item An object containing at least a unique 'key' property.
   * @returns A promise that resolves when the operation completes.
   */
  public put(key:string,data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        return reject('Database not initialized');
      }
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      // 'put' will add or update the record.
      const item = { key:`${key}_${this.user_id}`, data: this.toByte(data) };
      const request = store.put(item);

      request.onsuccess = (event) => {
        resolve((event.target as IDBRequest).result);
      };

      request.onerror = (event) => {
        console.error('Error saving item', event);
        reject('Error saving item');
      };
    });
  }

  /**
   * Fetches an item from the store by its unique key.
   * @param key The unique key of the item.
   * @returns A promise that resolves with the item, or undefined if not found.
   */
  public get(key: string): Promise<any> {


    return new Promise((resolve, reject) => {
      if (!this.db) {
        return reject('Database not initialized');
      }
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      key=`${key}_${this.user_id}`;
      const request = store.get(key);

      request.onsuccess = (event) => {
        resolve(
          (event.target as IDBRequest).result
            ? this.fromByte((event.target as IDBRequest).result.data)
            : undefined
        );
      };

      request.onerror = (event) => {
        console.error('Error fetching item', event);
        reject('Error fetching item');
      };
    });
  }

  /**
   * Deletes an item from the store by its unique key.
   * @param key The unique key of the item to delete.
   * @returns A promise that resolves when the deletion is complete.
   */
  public delete(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        return reject('Database not initialized');
      }
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      key=`${key}_${this.user_id}`;

      const request = store.delete(key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        console.error('Error deleting item', event);
        reject('Error deleting item');
      };
    });
  }


}
