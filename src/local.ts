import { join, basename } from 'path';
import { randomBytes } from 'crypto'
import * as os from 'os';
import * as fs from 'fs';

import { Storage } from './storage';
import { Config } from './config';
import { Item } from './item';
import { Task } from './task';
import { Note } from './note';

// const render = require('./render')

export class LocalStorage extends Storage {
  static instance: LocalStorage;
  private storageDir: string;
  private archiveDir: string;
  private tempDir: string;
  private archiveFile: string;
  private mainStorageFile: string;

  private constructor() {
    super();
  };

  public static getInstance() {
    if (!this.instance) {
      this.instance = new LocalStorage();
      this.instance.init();
    }

    return this.instance;
  }

  init() {
    this.storageDir = join(this.mainAppDir, 'storage');
    this.archiveDir = join(this.mainAppDir, 'archive');
    this.tempDir = join(this.mainAppDir, '.temp');
    this.archiveFile = join(this.archiveDir, 'archive.json');
    this.mainStorageFile = join(this.storageDir, 'storage.json');

    this.ensureDirectories();
  }

  private get mainAppDir() {
    const {
      tasklineDirectory
    } = Config.getInstance().get();
    const defaultAppDirectory = join(os.homedir(), '.taskline');

    if (!tasklineDirectory) {
      return defaultAppDirectory;
    }

    if (!fs.existsSync(tasklineDirectory)) {
      // render.invalidCustomAppDir(tasklineDirectory);
      process.exit(1);
    }

    return join(tasklineDirectory, '.taskline');
  }

  private ensureMainAppDir() {
    if (!fs.existsSync(this.mainAppDir)) {
      fs.mkdirSync(this.mainAppDir);
    }
  }

  private ensureStorageDir() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir);
    }
  }

  private ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir);
    }
  }

  private ensureArchiveDir() {
    if (!fs.existsSync(this.archiveDir)) {
      fs.mkdirSync(this.archiveDir);
    }
  }

  private cleanTempDir() {
    const tempFiles = fs
      .readdirSync(this.tempDir)
      .map(x => join(this.tempDir, x));

    if (tempFiles.length !== 0) {
      tempFiles.forEach(tempFile => fs.unlinkSync(tempFile));
    }
  }

  private ensureDirectories() {
    this.ensureMainAppDir();
    this.ensureStorageDir();
    this.ensureArchiveDir();
    this.ensureTempDir();
    this.cleanTempDir();
  }

  private getRandomHexString(length = 8) {
    return randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
  }

  private getTempFile(filePath) {
    const randomString = this.getRandomHexString();
    const tempFilename = basename(filePath)
      .split('.')
      .join(`.TEMP-${randomString}.`);
    return join(this.tempDir, tempFilename);
  }

  private parseJson(data): Array<Item> {
    const items = new Array<Item>();
    
    Object.keys(data).forEach(id => {
      if (data[id].isTask) {
        items.push(new Task(data[id]));
      } else {
        items.push(new Note(data[id]));
      }
    });

    return items;
  }

  public async get(): Promise<Array<Item>> {
    let data: Array<Item>;
    if (fs.existsSync(this.mainStorageFile)) {
      const content = fs.readFileSync(this.mainStorageFile, 'utf8');
      const jsonData = JSON.parse(content);
      data = this.parseJson(jsonData);
    }

    return data;
  }

  public async getArchive(): Promise<Array<Item>> {
    let archive: Array<Item>;

    if (fs.existsSync(this.archiveFile)) {
      const content = fs.readFileSync(this.archiveFile, 'utf8');
      const jsonArchive = JSON.parse(content);
      archive = this.parseJson(jsonArchive);
    }

    return archive;
  }

  public async set(data: Array<Item>) {
    try {
      const jsonData = JSON.stringify(data, null, 4);
      const tempStorageFile = this.getTempFile(this.mainStorageFile);

      fs.writeFileSync(tempStorageFile, jsonData, 'utf8');
      fs.renameSync(tempStorageFile, this.mainStorageFile);

      Promise.resolve();
    } catch (error) {
      Promise.reject(error);
    }
  }

  public async setArchive(archive: Array<Item>) {
    try {
      const jsonArchive = JSON.stringify(archive, null, 4);
      const tempArchiveFile = this.getTempFile(this.archiveFile);

      fs.writeFileSync(tempArchiveFile, jsonArchive, 'utf8');
      fs.renameSync(tempArchiveFile, this.archiveFile);

      Promise.resolve();
    } catch (error) {
      Promise.reject(error);
    }
  }
}