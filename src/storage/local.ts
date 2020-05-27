import { join, basename } from 'path';
import { homedir } from 'os';
import { randomBytes } from 'crypto';
import * as fs from 'fs';
import { createPromptModule } from 'inquirer';

import { IStorage, StorageStatus } from './storage';
import { Item } from '../item';
import { Task } from '../task';
import { Note } from '../note';
import { filterByID } from '../utils/utils';

export interface ILocalStorageConfig {
  directory: string;
}

export const create = (name: string, config: ILocalStorageConfig): Storage => {
  return new Storage(name, config);
};

export class Storage implements IStorage {
  private _name: string;
  private _mainStorageDir: string = '';
  private _storageDir: string = '';
  private _archiveDir: string = '';
  private _tempDir: string = '';
  private _archiveFile: string = '';
  private _mainStorageFile: string = '';
  private _status: StorageStatus;

  public constructor(name: string, config: ILocalStorageConfig) {
    this._name = name;
    this._mainStorageDir = this.getDirecotry(config);
    this._storageDir = join(this._mainStorageDir, 'storage');
    this._archiveDir = join(this._mainStorageDir, 'archive');
    this._tempDir = join(this._mainStorageDir, '.temp');
    this._archiveFile = join(this._archiveDir, 'archive.json');
    this._mainStorageFile = join(this._storageDir, 'storage.json');

    this.ensureDirectories();
    this._status = StorageStatus.Online;
  }

  private getDirecotry(config: ILocalStorageConfig): string {
    if (config.directory.startsWith('~')) {
      return this.formatDir(config.directory);
    } else {
      return config.directory;
    }
  }

  private formatDir(path: string): string {
    return join(homedir(), path.replace(/^~/g, ''));
  }

  private ensureStorageDir(): void {
    if (!fs.existsSync(this._storageDir)) {
      // break node 8 support
      fs.mkdirSync(this._storageDir, { recursive: true });
    }
  }

  private ensureTempDir(): void {
    if (!fs.existsSync(this._tempDir)) {
      // break node 8 support
      fs.mkdirSync(this._tempDir, { recursive: true });
    }
  }

  private ensureArchiveDir(): void {
    if (!fs.existsSync(this._archiveDir)) {
      fs.mkdirSync(this._archiveDir);
    }
  }

  private cleanTempDir(): void {
    const tempFiles: Array<string> = fs
      .readdirSync(this._tempDir)
      .map((x: string) => join(this._tempDir, x));

    if (tempFiles.length !== 0) {
      tempFiles.forEach((tempFile: string) => fs.unlinkSync(tempFile));
    }
  }

  private ensureDirectories(): void {
    this.ensureStorageDir();
    this.ensureArchiveDir();
    this.ensureTempDir();
    this.cleanTempDir();
  }

  private getRandomHexString(length: number = 8): string {
    return randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
  }

  private getTempFile(filePath: string): string {
    const randomString: string = this.getRandomHexString();
    const tempFilename: string = basename(filePath)
      .split('.')
      .join(`.TEMP-${randomString}.`);
    return join(this._tempDir, tempFilename);
  }

  private parseJson(data: any): Array<Item> {
    const items: Array<Item> = new Array<Item>();

    Object.keys(data).forEach((id: string) => {
      if (data[id].isTask) {
        items.push(new Task(data[id]));
      } else if (data[id].isTask === false) {
        items.push(new Note(data[id]));
      }

      // to support old storage format
      if (data[id]._isTask) {
        items.push(
          new Task({
            id: data[id]._id,
            date: data[id]._date,
            timestamp: data[id]._timestamp,
            description: data[id].description,
            isStarred: data[id].isStarred,
            boards: data[id].boards,
            priority: data[id].priority,
            inProgress: data[id].inProgress,
            isCanceled: data[id].isCanceled,
            isComplete: data[id].isComplete,
            dueDate: data[id].dueDate
          })
        );
      } else if (data[id]._isTask === false) {
        items.push(
          new Note({
            id: data[id]._id,
            date: data[id]._date,
            timestamp: data[id]._timestamp,
            description: data[id].description,
            isStarred: data[id].isStarred,
            boards: data[id].boards
          })
        );
      }
    });

    return items;
  }

  public get name(): string {
    return this._name;
  }

  public async get(ids?: Array<number>): Promise<Array<Item>> {
    let data: Array<Item> = new Array<Item>();

    if (fs.existsSync(this._mainStorageFile)) {
      const content: string = fs.readFileSync(this._mainStorageFile, 'utf8');
      const jsonData: string = JSON.parse(content);
      data = this.parseJson(jsonData);
    }

    if (ids) {
      return filterByID(data, ids);
    }

    return data;
  }

  public async getArchive(ids?: Array<number>): Promise<Array<Item>> {
    let archive: Array<Item> = new Array<Item>();

    if (fs.existsSync(this._archiveFile)) {
      const content: string = fs.readFileSync(this._archiveFile, 'utf8');
      const jsonArchive: string = JSON.parse(content);
      archive = this.parseJson(jsonArchive);
    }

    if (ids) {
      return filterByID(archive, ids);
    }

    return archive;
  }

  public async set(data: Array<Item>): Promise<void> {
    try {
      const jsonData: string = JSON.stringify(
        data.map((item: Item) => item.toJSON()),
        null,
        4
      );
      const tempStorageFile: string = this.getTempFile(this._mainStorageFile);

      fs.writeFileSync(tempStorageFile, jsonData, 'utf8');
      fs.renameSync(tempStorageFile, this._mainStorageFile);

      Promise.resolve();
    } catch (error) {
      Promise.reject(error);
    }
  }

  public async setArchive(archive: Array<Item>): Promise<void> {
    try {
      const jsonArchive: string = JSON.stringify(
        archive.map((item: Item) => item.toJSON()),
        null,
        4
      );
      const tempArchiveFile: string = this.getTempFile(this._archiveFile);

      fs.writeFileSync(tempArchiveFile, jsonArchive, 'utf8');
      fs.renameSync(tempArchiveFile, this._archiveFile);

      Promise.resolve();
    } catch (error) {
      Promise.reject(error);
    }
  }

  public getStatus(): StorageStatus {
    return this._status;
  }
}

export async function add(): Promise<ILocalStorageConfig> {
  var prompt = createPromptModule();
  const result = await prompt({
    type: 'input',
    name: 'directory',
    message: 'Enter storage directory'
  });

  return {
    directory: result['directory']
  };
}
