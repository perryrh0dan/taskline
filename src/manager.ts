import { IStorage } from './storage/storage';
import { Config } from './config';
import { Renderer } from './renderer';
import { Item } from './item';

export class StorageManager {
  private storages: Map<string, IStorage> = new Map<string, IStorage>();

  public constructor() {}

  public async init(): Promise<void> {
    const { storageModules } = Config.instance.get();

    let promises: Array<Promise<IStorage>> = new Array<Promise<any>>();
    storageModules.forEach(config => {
      try {
        let promise: Promise<IStorage> = import('./storage/' + config.type).then(module => {
          return new module.Storage(config.name, config.config);
        });
        promises.push(promise);
      } catch (error) {
        return;
      }
    });

    const storages = await Promise.all(promises.map(p => p.catch(e => e)));
    const validStorages = storages.filter(storage => !(storage instanceof Error));
    validStorages.forEach(storage => {
      this.storages.set(storage.name, storage);
    });
  }

  public getStorage(): IStorage {
    const { activeStorageModule } = Config.instance.get();
    const storage = this.storages.get(activeStorageModule);
    if (!storage) {
      Renderer.instance.invalidStorageModule(activeStorageModule);
      throw('Not found');
    }

    return storage;
  }

  public setStorage(name: string): void {
    if (this.storages.has(name)) {
      Config.instance.setValue('activeStorageModule', name);
    } else {
      Renderer.instance.invalidStorageModule(name);
    }
  }

  public getData(ids?: Array<number>): Promise<Array<Item>> {
    const storage = this.getStorage();
    return storage.get(ids);
  }

  public getArchive(ids?: Array<number>): Promise<Array<Item>> {
    const storage = this.getStorage();
    return storage.getArchive(ids);
  }

  public setData(data: Array<Item>): Promise<void> {
    const storage = this.getStorage();
    return storage.set(data);
  }

  public setArchive(archive: Array<Item>): Promise<void> {
    const storage = this.getStorage();
    return storage.setArchive(archive);
  }
}
