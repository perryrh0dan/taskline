import * as fs from 'fs';
import * as path from 'path';

import { Config } from '../src/config';
import { Storage } from '../src/storage';
import { LocalStorage } from '../src/local';
import { Item } from '../src/item';
import { FirestoreStorage } from '../src/firestore';

const contentPath = path.resolve(__dirname, './config.json');
const sampleContentPath = path.resolve(__dirname, './sample.config.json');

export class Helper {
  private storage: Storage;
  private originalConfig: any;

  constructor() {
    this.setConfig();
    const { storageModule } = Config.instance.get();
    if (storageModule === 'firestore') {
      this.storage = FirestoreStorage.instance;
    } else if (storageModule === 'local') {
      this.storage = LocalStorage.instance;
    }
  }

  setConfig(): void {
    this.originalConfig = Config.instance.get();
    let content;
    if (fs.existsSync(contentPath)) {
      content = fs.readFileSync(contentPath, 'utf8');
    } else if (fs.existsSync(sampleContentPath)) {
      content = fs.readFileSync(sampleContentPath, 'utf8');
    } else {
      throw new Error('No config file for unit tests');
    }

    const unitTestConfig = JSON.parse(content);
    Config.instance.set(unitTestConfig);
  }

  resetConfig(): void {
    Config.instance.set(this.originalConfig);
  }

  getData(ids?: Array<number>): Promise<Array<Item>> {
    return this.storage.get(ids);
  }

  getArchive(ids?: Array<number>): Promise<Array<Item>> {
    return this.storage.getArchive(ids);
  }

  setData(data: Array<Item>): Promise<void> {
    return this.storage.set(data);
  }

  setArchive(data: Array<Item>): Promise<void> {
    return this.storage.setArchive(data);
  }

  clearStorage() {
    return this.storage.set(new Array<Item>()).then(() => {
      return this.storage.setArchive(new Array<Item>());
    });
  }

  changeConfig(key: string, value: any) {
    const keys = key.split('.');
    let localConfig = Config.instance.get();
    let temp = localConfig;
    while (keys.length > 1) {
      let n = keys.shift();
      if (!n) return
      temp = temp[n];
    }
    temp[keys[0]] = value;
    Config.instance.set(localConfig);
  }
}
