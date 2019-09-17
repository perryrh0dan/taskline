import { Item } from './item';

export abstract class Storage {
  getInstance() { };

  abstract init(): void;

  abstract async get(ids?: Array<number>): Promise<Array<Item>>;

  abstract async getArchive(ids?: Array<number>): Promise<Array<Item>>;

  abstract async set(data: Array<Item>): Promise<any>;

  abstract async setArchive(archive: Array<Item>): Promise<any>;
}