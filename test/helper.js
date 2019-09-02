const fs = require('fs');
const path = require('path');

const config = require('../src/config');
const LocalStorage = require('../src/local');
const FirestoreStorage = require('../src/firestore');

const content = fs.readFileSync(path.resolve(__dirname, './config.json'), 'utf8');
const unitTestConfig = JSON.parse(content);

class Helper {
  setConfig() {
    this._originalConfig = config.get();
    config.set(unitTestConfig);
  }

  resetConfig() {
    config.set(this._originalConfig);
  }

  getStorage() {
    if (!this._storage) {
      const {
        storageModule
      } = config.get();
      if (storageModule === 'firestore') {
        this._storage = FirestoreStorage.getInstance();
      } else if (storageModule === 'local') {
        this._storage = LocalStorage.getInstance();
      }
    }

    return this._storage;
  }

  clearStorage() {
    return this._storage.set({}).then(() => {
      return this._storage.setArchive({});
    });
  }
}

module.exports = new Helper();
