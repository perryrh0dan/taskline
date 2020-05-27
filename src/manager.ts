import { IStorage, StorageStatus } from './storage/storage';
import { Config, StorageModule } from './config';
import { Renderer } from './renderer';
import { Item } from './item';
import { createPromptModule } from 'inquirer';
import { readdirSync } from 'fs';
import { resolve } from 'path';

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

    const storages = await Promise.all(promises.map(p => p.catch(e => {
      console.log(e);
      return e;
    })));
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

  public getModules(): Array<string> {
    const dir = resolve(__dirname, 'storage');
    let files = readdirSync(dir);
    let modules = files.filter(value => {
      if (value !== 'storage.js' && value !==  'storage.js.map') {
        return true;
      }
      return false;
    });
    modules = files.map(value => value.replace(/(\.js)/, ''));
    modules = files.map(value => value.replace(/(\.map)/, ''));
    return [...new Set(modules)];
  }

  public setStorage(name: string): void {
    if (this.storages.has(name)) {
      Config.instance.setValue('activeStorageModule', name);
    } else {
      Renderer.instance.invalidStorageModule(name);
    }
  }

  public async addStorage(name: string): Promise<void> {
    const config = Config.instance.get();
    if (config.storageModules.filter(s => s.name === name).length > 0) {
      return;
    }

    const modules = this.getModules();

    var prompt = createPromptModule();
    const result = await prompt({
      type: 'list',
      name: 'type',
      message: 'Which storage module would you like to use',
      choices: modules
    });

    try {
      const storage = await import('./storage/' + result['type']);
      const storageConfig  = await storage.add();
      const storageModule: StorageModule = {
        name: name,
        type: result['type'],
        config: storageConfig
      };

      config.storageModules.push(storageModule);
      Config.instance.set(config);

    } catch (error) {
      console.log(error);
      return;
    }
  }

  public async removeStorage(name: string): Promise<void> {
    const config = Config.instance.get();

    config.storageModules = config.storageModules.filter(storage => {
      if (storage.name === name) {
        return false;
      }
      return true;
    });

    Config.instance.set(config);
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

  public listStorages(): void {
    const names: Array<{name: string, status: StorageStatus}> = [];
    this.storages.forEach((value, key) => {
      names.push({
        name: key,
        status: value.getStatus(),
      });
    });
    Renderer.instance.displayStorages(names);
  }
}
