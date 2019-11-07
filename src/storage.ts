import { Item } from './item';

export abstract class Storage {
  abstract async get(ids?: Array<number>): Promise<Array<Item>>;

  abstract async getArchive(ids?: Array<number>): Promise<Array<Item>>;

  abstract async set(data: Array<Item>): Promise<void>;

  abstract async setArchive(archive: Array<Item>): Promise<void>;

  protected filterByID(data: Array<Item>, ids: Array<number>): Array<Item> {
    if (ids) {
      return data.filter(item => { return ids.indexOf(item.id) != -1; });
    }
    return data;
  }
}
