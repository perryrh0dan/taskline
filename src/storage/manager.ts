import { Storage } from './storage';
import { Config } from '../config';
import { Renderer } from '../renderer';

export class StorageManager {
  private storages: Map<string, Storage> = new Map<string, Storage>();

  public constructor() {}

  public async init(): Promise<void> {
    const { storageModules } = Config.instance.get();

    let promises: Array<Promise<Storage>> = new Array<Promise<any>>();
    storageModules.forEach(config => {
      let promise: Promise<Storage> = import('./modules/' + config.type).then(module => {
        return module.create(config.name, config.config);
      });
      promises.push(promise);
    });

    let storages = await Promise.all(promises);
    storages.forEach(storage => {
      this.storages.set(storage.name, storage);
    });
  }

  public get(): Storage {
    const { activeStorageModule } = Config.instance.get();
    const storage = this.storages.get(activeStorageModule);
    if (!storage) {
      Renderer.instance.invalidStorageModule();
      throw('Not found');
    }

    return storage;
  }

  public set(name: string): void {
    Config.instance.setValue('activeStorageModule', name);
  }
}
