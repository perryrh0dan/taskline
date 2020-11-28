import { Storage } from './storage';
import { Config } from './config';
import { Item } from './item';
import { Task } from './task';
import { Note } from './note';
import { Renderer } from './renderer';
import * as firebase from 'firebase-admin';
import logger from './utils/logger';

export class FirestoreStorage implements Storage {
  private static _instance: FirestoreStorage;
  private _db: FirebaseFirestore.Firestore;
  private _storageName: string = '';
  private _archiveName: string = '';
  private _data: Array<Item> = new Array<Item>();
  private _archive: Array<Item> = new Array<Item>();

  public static get instance(): FirestoreStorage {
    if (!this._instance) {
      this._instance = new FirestoreStorage();
      this._instance.init();
    }

    return this._instance;
  }

  private init(): void {
    const { firestoreConfig } = Config.instance.get();

    this._storageName = firestoreConfig.storageName;
    this._archiveName = firestoreConfig.archiveName;

    firebase.initializeApp({
      credential: firebase.credential.cert(firestoreConfig),
    });

    this._db = firebase.firestore();
  }

  private async updateCollection(
    path: string,
    data: Array<Item>,
  ): Promise<void> {
    const self = this;
    const batch = this._db.batch();

    try {
      await self.deleteCollection(path);

      data.forEach((item: Item) => {
        // Create a ref
        const elementRef = self._db.collection(path).doc(item.id.toString());
        batch.set(elementRef, item.toJSON());
      });

      await batch.commit();
    } catch (error) {
      Renderer.instance.stopLoading();
      throw new Error('Cant connect to Firestore');
    }
  }

  private async getCollection(path: string): Promise<Array<Item>> {
    const self = this;

    try {
      const content = await self._db.collection(path).get();
      const data = content.docs.map((doc: any) => doc.data());
      const items: Array<Item> = new Array<Item>();
      data.forEach((item: any) => {
        if (item.isTask) {
          items.push(new Task(item as any));
        } else if (item.isTask === false) {
          items.push(new Note(item as any));
        }

        // to support old storage format
        if (item._isTask) {
          items.push(
            new Task({
              id: item._id,
              date: item._date,
              timestamp: item._timestamp,
              description: item.description,
              isStarred: item.isStarred,
              boards: item.boards,
              priority: item.priority,
              inProgress: item.inProgress,
              isCanceled: item.isCanceled,
              isComplete: item.isComplete,
              dueDate: item.dueDate,
            }),
          );
        } else if (item._isTask === false) {
          items.push(
            new Note({
              id: item._id,
              date: item._date,
              timestamp: item._timestamp,
              description: item.description,
              isStarred: item.isStarred,
              boards: item.boards,
            }),
          );
        }
      });
      return items;
    } catch (error) {
      Renderer.instance.stopLoading();
      throw new Error('Cant connect to Firestore');
    }
  }

  private async deleteCollection(path: string): Promise<void> {
    // Get a new write batch
    try {
      const batch = this._db.batch();

      const data = await firebase.firestore().collection(path).listDocuments();

      data.forEach((item) => {
        batch.delete(item);
      });

      await batch.commit();
    } catch (error) {
      throw new Error();
    }
  }

  public async set(data: Array<Item>): Promise<void> {
    try {
      await this.updateCollection(this._storageName, data);
      this._data = [];
    } catch (error) {
      Renderer.instance.invalidFirestoreConfig();
      logger.debug(error);
      process.exit(1);
    }
  }

  public async setArchive(data: Array<Item>): Promise<void> {
    try {
      await this.updateCollection(this._archiveName, data);
      this._archive = [];
    } catch (error) {
      Renderer.instance.invalidFirestoreConfig();
      logger.debug(error);
      process.exit(1);
    }
  }

  public async get(ids?: Array<number>): Promise<Array<Item>> {
    if (this._data.length === 0) {
      try {
        this._data = await this.getCollection(this._storageName);
      } catch (error) {
        Renderer.instance.invalidFirestoreConfig();
        logger.debug(error);
        process.exit(1);
      }
    }

    if (ids) {
      return this.filterByID(this._data, ids);
    }

    return this._data;
  }

  public async getArchive(ids?: Array<number>): Promise<Array<Item>> {
    if (this._archive.length === 0) {
      try {
        this._archive = await this.getCollection(this._archiveName);
      } catch (error) {
        Renderer.instance.invalidFirestoreConfig();
        logger.debug(error);
        process.exit(1);
      }
    }

    if (ids) {
      return this.filterByID(this._archive, ids);
    }

    return this._archive;
  }

  private filterByID(data: Array<Item>, ids: Array<number>): Array<Item> {
    if (ids) {
      return data.filter((item) => {
        return ids.indexOf(item.id) != -1;
      });
    }
    return data;
  }
}
