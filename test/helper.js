const fs = require('fs');
const path = require('path');

const config = require('../src/config');
const LocalStorage = require('../src/local');
// const FirestoreStorage = require('../src/firestore');

const contentPath = path.resolve(__dirname, './config.json');
const sampleContentPath = path.resolve(__dirname, './sample.config.json');

class Helper {
  setConfig() {
    this._originalConfig = config.get();
    let content;
    if (fs.existsSync(contentPath)) {
      content = fs.readFileSync(contentPath, 'utf8');
    } else if (fs.existsSync(sampleContentPath)) {
      content = fs.readFileSync(sampleContentPath, 'utf8');
    } else {
      throw new Error('No config file for unit tests');
    }

    const unitTestConfig = JSON.parse(content);
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
        // this._storage = FirestoreStorage.getInstance();
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

  changeConfig(key, value) {
    const localConfig = config.get();
    localConfig[key] = value;
    config.set(localConfig);
  }
}

module.exports = new Helper();
