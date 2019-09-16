import { Item } from './item';

export abstract class Storage {
  data: Array<Item>;
  archive: Array<Item>;

  getInstance() { };

  abstract init();

  abstract async get(): Promise<Array<Item>>;

  abstract async getArchive(): Promise<Array<Item>>;

  abstract async set(data: Array<Item>): Promise<any>;

  abstract async setArchive(archive: Array<Item>): Promise<any>;
}