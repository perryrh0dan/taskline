import { join, basename } from 'path';
import { randomBytes } from 'crypto';
import * as os from 'os';
import * as fs from 'fs';

import { Storage } from '../storage';
import { Config } from '../../config';
import { Item } from '../../item';
import { Task } from '../../task';
import { Note } from '../../note';
import { Renderer } from '../../renderer';

export const create = (name: string, config: any): LocalStorage => {
  return new LocalStorage(name);
};

export class LocalStorage implements Storage {
  private _name: string;
  private storageDir: string = '';
  private archiveDir: string = '';
  private tempDir: string = '';
  private archiveFile: string = '';
  private mainStorageFile: string = '';

  public constructor(name: string) {
    this._name = name;
    this.storageDir = join(this.mainAppDir, 'storage');
    this.archiveDir = join(this.mainAppDir, 'archive');
    this.tempDir = join(this.mainAppDir, '.temp');
    this.archiveFile = join(this.archiveDir, 'archive.json');
    this.mainStorageFile = join(this.storageDir, 'storage.json');

    this.ensureDirectories();
  }

  private get mainAppDir(): string {
    const {
      tasklineDirectory
    } = Config.instance.get();
    const defaultAppDirectory: string = join(os.homedir(), '.taskline');

    if (!tasklineDirectory) {
      return defaultAppDirectory;
    }

    if (!fs.existsSync(tasklineDirectory)) {
      Renderer.instance.invalidCustomAppDir(tasklineDirectory);
      process.exit(1);
    }

    return join(tasklineDirectory, '.taskline');
  }

  private ensureMainAppDir(): void {
    if (!fs.existsSync(this.mainAppDir)) {
      fs.mkdirSync(this.mainAppDir);
    }
  }

  private ensureStorageDir(): void {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir);
    }
  }

  private ensureTempDir(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir);
    }
  }

  private ensureArchiveDir(): void {
    if (!fs.existsSync(this.archiveDir)) {
      fs.mkdirSync(this.archiveDir);
    }
  }

  private cleanTempDir(): void {
    const tempFiles: Array<string> = fs
      .readdirSync(this.tempDir)
      .map((x: string) => join(this.tempDir, x));

    if (tempFiles.length !== 0) {
      tempFiles.forEach((tempFile: string) => fs.unlinkSync(tempFile));
    }
  }

  private ensureDirectories(): void {
    this.ensureMainAppDir();
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
    return join(this.tempDir, tempFilename);
  }

  private parseJson(data: any): Array<Item> {
    const items: Array<Item> = new Array<Item>();

    Object.keys(data).forEach((id: string) => {
      if (data[id].isTask) {
        items.push(new Task(data[id]));
      } else if (data[id].isTask === false){
        items.push(new Note(data[id]));
      }

      // to support old storage format
      if (data[id]._isTask) {
        items.push(new Task({
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
        }));
      } else if (data[id]._isTask === false) {
        items.push(new Note({
          id: data[id]._id,
          date: data[id]._date,
          timestamp: data[id]._timestamp,
          description: data[id].description,
          isStarred: data[id].isStarred,
          boards: data[id].boards
        }));
      }
    });

    return items;
  }

  public get name(): string {
    return this._name;
  }

  public async get(ids?: Array<number>): Promise<Array<Item>> {
    let data: Array<Item> = new Array<Item>();

    if (fs.existsSync(this.mainStorageFile)) {
      const content: string = fs.readFileSync(this.mainStorageFile, 'utf8');
      const jsonData: string = JSON.parse(content);
      data = this.parseJson(jsonData);
    }

    if (ids) {
      return this.filterByID(data, ids);
    }

    return data;
  }

  public async getArchive(ids?: Array<number>): Promise<Array<Item>> {
    let archive: Array<Item> = new Array<Item>();

    if (fs.existsSync(this.archiveFile)) {
      const content: string = fs.readFileSync(this.archiveFile, 'utf8');
      const jsonArchive: string = JSON.parse(content);
      archive = this.parseJson(jsonArchive);
    }

    if (ids) {
      return this.filterByID(archive, ids);
    }

    return archive;
  }

  public async set(data: Array<Item>): Promise<void> {
    try {
      const jsonData: string = JSON.stringify(data.map((item: Item) => item.toJSON()), null, 4);
      const tempStorageFile: string = this.getTempFile(this.mainStorageFile);

      fs.writeFileSync(tempStorageFile, jsonData, 'utf8');
      fs.renameSync(tempStorageFile, this.mainStorageFile);

      Promise.resolve();
    } catch (error) {
      Promise.reject(error);
    }
  }

  public async setArchive(archive: Array<Item>): Promise<void> {
    try {
      const jsonArchive: string = JSON.stringify(archive.map((item: Item) => item.toJSON()), null, 4);
      const tempArchiveFile: string = this.getTempFile(this.archiveFile);

      fs.writeFileSync(tempArchiveFile, jsonArchive, 'utf8');
      fs.renameSync(tempArchiveFile, this.archiveFile);

      Promise.resolve();
    } catch (error) {
      Promise.reject(error);
    }
  }

  private filterByID(data: Array<Item>, ids: Array<number>): Array<Item> {
    if (ids) {
      return data.filter(item => { return ids.indexOf(item.id) != -1; });
    }
    return data;
  }
}
