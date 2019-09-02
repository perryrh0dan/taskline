#!/usr/bin/env node

'use strict';

const firebase = require('firebase-admin');
const render = require('./render');
const Storage = require('./storage');
const config = require('./config');

class FirestoreStorage extends Storage {
  static getInstance() {
    if (!this.instance) {
      this.instance = new FirestoreStorage();
      this.instance.init();
    }

    return this.instance;
  }

  init() {
    const { firestoreConfig } = config.get();

    this._storageName = firestoreConfig.storageName;
    this._archiveName = firestoreConfig.archiveName;

    firebase.initializeApp({
      credential: firebase.credential.cert(firestoreConfig),
      databaseURL: firestoreConfig.databaseURL
    });

    this.db = firebase.firestore();
  }

  _parse(data) {
    const result = [];

    for (const key in data) {
      if (!Object.prototype.hasOwnProperty.call(data, key)) {
        continue;
      }

      const obj = data[key];
      result.push(Object.assign({}, obj));
    }

    return result;
  }

  _updateCollection(path, dataArray) {
    const self = this;
    const batch = this.db.batch();

    return self._deleteCollection(path).then(() => {
      return new Promise((resolve, reject) => {
        dataArray.forEach(element => {
          // Create a ref
          const elementRef = self.db
            .collection(path)
            .doc(element._id.toString());
          batch.set(elementRef, element);
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

  _getCollection(path) {
    const self = this;

    return new Promise((resolve, reject) => {
      self.db
        .collection(path)
        .get()
        .then(content => {
          const data = content.docs.map(doc => doc.data());
          const result = {};
          for (let i = 0; i < data.length; i++) {
            result[data[i]._id] = data[i];
          }

          resolve(result);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  _deleteCollection(path) {
    // Get a new write batch
    const batch = this.db.batch();

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

  async set(data) {
    const pureData = this._parse(data);

    await this._updateCollection(this._storageName, pureData)
      .then(() => {
        this.data = null;
      })
      .catch(() => {
        render.invalidFirestoreConfig();
        process.exit(1);
      });
  }

  async setArchive(data) {
    const pureData = this._parse(data);

    await this._updateCollection(this._archiveName, pureData)
      .then(() => {
        this.archive = null;
      })
      .catch(() => {
        render.invalidFirestoreConfig();
        process.exit(1);
      });
  }

  async get() {
    if (!this.data) {
      this.data = await this._getCollection(this._storageName).catch(() => {
        render.invalidFirestoreConfig();
        process.exit(1);
      });
    }

    return this.data;
  }

  async getArchive() {
    if (!this.archive) {
      this.archive = await this._getCollection(this._archiveName).catch(() => {
        render.invalidFirestoreConfig();
        process.exit(1);
      });
    }

    return this.archive;
  }
}

module.exports = FirestoreStorage;
