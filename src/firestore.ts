import { Storage } from './storage';
import { Config } from './config';
import { Item } from './item';
import { Task } from './task';
import { Note } from './note';
import { Renderer } from './renderer';
import * as firebase from 'firebase-admin';

export class FirestoreStorage extends Storage {
  private static _instance: FirestoreStorage;
  private _db: FirebaseFirestore.Firestore;
  private _storageName: string = '';
  private _archiveName: string = '';
  private _data: Array<Item>;
  private _archive: Array<Item>;

  public static get Instance(): FirestoreStorage {
    if (!this._instance) {
      this._instance = new FirestoreStorage();
      this._instance.init();
    }

    return this._instance;
  }

  private constructor() {
    super();
  }

  private init() {
    const { firestoreConfig } = Config.instance.get();

    this._storageName = firestoreConfig.storageName;
    this._archiveName = firestoreConfig.archiveName;

    firebase.initializeApp({
      credential: firebase.credential.cert(firestoreConfig),
      databaseURL: firestoreConfig.databaseURL
    });

    this._db = firebase.firestore();
  }

  private updateCollection(path: string, data: Array<Item>) {
    const self = this;
    const batch = this._db.batch();

    return self.deleteCollection(path).then(() => {
      return new Promise((resolve, reject) => {
        data.forEach((item: Item) => {
          // Create a ref
          const elementRef = self._db.collection(path).doc(item.id.toString());
          batch.set(elementRef, item);
        });

        batch
          .commit()
          .then(() => {
            resolve();
          })
          .catch(error => {
            reject(error);
          });
      });
    });
  }

  private getCollection(path: string): Promise<Array<Item>> {
    const self = this;

    return new Promise((resolve, reject) => {
      self._db
        .collection(path)
        .get()
        .then(content => {
          const data = content.docs.map(doc => doc.data());
          const items: Array<Item> = [];
          data.forEach(item => {
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
                  dueDate: item.dueDate
                })
              );
            } else if (item._isTask === false) {
              items.push(
                new Note({
                  id: item._id,
                  date: item._date,
                  timestamp: item._timestamp,
                  description: item.description,
                  isStarred: item.isStarred,
                  boards: item.boards
                })
              );
            }
          });
          resolve(items);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  private deleteCollection(path: string) {
    // Get a new write batch
    const batch = this._db.batch();

    return new Promise((resolve, reject) => {
      firebase
        .firestore()
        .collection(path)
        .listDocuments()
        .then(val => {
          val.forEach(val => {
            batch.delete(val);
          });

          batch.commit().then(() => {
            resolve();
          });
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  async set(data: Array<Item>) {
    // const pureData = this._parse(data);

    await this.updateCollection(this._storageName, data)
      .then(() => {
        this._data = [];
      })
      .catch(() => {
        Renderer.instance.invalidFirestoreConfig();
        process.exit(1);
      });
  }

  async setArchive(data: Array<Item>) {
    // const pureData = this._parse(data);

    await this.updateCollection(this._archiveName, data)
      .then(() => {
        this._archive = [];
      })
      .catch(() => {
        Renderer.instance.invalidFirestoreConfig();
        process.exit(1);
      });
  }

  async get() {
    if (!this._data) {
      try {
        this._data = await this.getCollection(this._storageName);
      } catch (error) {
        Renderer.instance.invalidFirestoreConfig();
        process.exit(1);
      }
    }

    return this._data;
  }

  async getArchive() {
    if (!this._archive) {
      try {
        this._archive = await this.getCollection(this._archiveName);
      } catch (error) {
        Renderer.instance.invalidFirestoreConfig();
        process.exit(1);
      }
    }

    return this._archive;
  }
}
