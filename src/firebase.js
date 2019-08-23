#!/usr/bin/env node

'use strict';

const firebase = require('firebase-admin');
const Storage = require('./storage');
const config  = require('./config')

class FirebaseStorage extends Storage {
  constructor() {
    super();
    const { firestoreConfig } = config.get();
    firebase.initializeApp({
      credential: firebase.credential.cert(firestoreConfig),
      databaseURL: 'https://test-23cfc.firebaseio.com'
    });
    this.db = firebase.firestore();
  }

  _parse(data) {
    const result = [];

    for (let key in data) {
      if (!data.hasOwnProperty(key)) {
        continue;
      }
      var obj = data[key];
      result.push(Object.assign({}, obj));
    }

    return result;
  }

  set(data) {
    let pureData = this._parse(data);

    this._updateCollection('storage', pureData);
  }

  setArchive(data) {
    let pureData = this._parse(data);

    this._updateCollection('archive', pureData);
  }

  async get() {
    if (!this.data) {
      this.data = await this._getCollection('storage')
    }
    return this.data;
  }

  async getArchive() {
    if (!this.archive) {
      this.archive = await this._getCollection('archive')
    }
    return this.archive;
  }

  _updateCollection(path, dataArray) {
    let self = this;
    let batch = this.db.batch();

    return self._deleteCollection(path).then(() => {
      return new Promise(function (resolve, reject) {
        dataArray.forEach(element => {
          // Create a ref
          var elementRef = self.db.collection(path).doc(element._id.toString());
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
    })
  }

  _getCollection(path) {
    let self = this;

    return new Promise(function (resolve, reject) {
      self.db
        .collection(path)
        .get()
        .then(content => {
          let data = content.docs.map(doc => doc.data());
          let result = {};
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
    let batch = this.db.batch();

    return new Promise(function (resolve, reject) {
      firebase
        .firestore()
        .collection(path)
        .listDocuments()
        .then(val => {
          val.map(val => {
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
}

module.exports = FirebaseStorage;
