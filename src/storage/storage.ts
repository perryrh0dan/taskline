import { Item } from '../item';

export enum StorageStatus {
  Online = 1,
  Ofline = 2
}

export interface IStorage {
  name: string

  get(ids?: Array<number>): Promise<Array<Item>>;

  getArchive(ids?: Array<number>): Promise<Array<Item>>;

  set(data: Array<Item>): Promise<void>;

  setArchive(archive: Array<Item>): Promise<void>;

  getStatus(): StorageStatus
}
