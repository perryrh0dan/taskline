import { join, basename } from 'path';
import { randomBytes } from 'crypto';
import * as os from 'os';
import * as fs from 'fs';
import simpleGit, { SimpleGit } from 'simple-git';

import { Storage } from './storage';
import { Config } from './config';
import { Item } from './item';
import { Task } from './task';
import { Note } from './note';
import { Renderer } from './renderer';

export class GitStorage implements Storage {
  private static _instance: GitStorage;
  private storageDir: string = '';
  private archiveDir: string = '';
  private tempDir: string = '';
  private archiveFile: string = '';
  private mainStorageFile: string = '';
  private git: SimpleGit;
  private repoDir: string = '';

  public static get instance(): GitStorage {
    if (!this._instance) {
      this._instance = new GitStorage();
      this._instance.init();
    }
    return this._instance;
  }

  private init(): void {
    this.repoDir = this.getRepoDir();
    this.storageDir = join(this.repoDir, 'storage');
    this.archiveDir = join(this.repoDir, 'archive');
    this.tempDir = join(this.repoDir, '.temp');
    this.archiveFile = join(this.archiveDir, 'archive.json');
    this.mainStorageFile = join(this.storageDir, 'storage.json');

    this.ensureDirectories();

    this.git = simpleGit(this.repoDir);

    // pull latest on init
    this.git.pull().catch(() => {});
  }

  private getRepoDir(): string {
    let { tasklineDirectory } = Config.instance.get();
    if (tasklineDirectory.startsWith('~')) {
      tasklineDirectory = join(os.homedir(), tasklineDirectory.slice(1));
    }

    if(!tasklineDirectory) {
      tasklineDirectory = os.homedir();
    }
    const repoDir = join(tasklineDirectory, '.taskline-git');
    if (!fs.existsSync(tasklineDirectory)) {
      Renderer.instance.invalidCustomAppDir(tasklineDirectory);
      process.exit(1);
    }
    return repoDir;
    
  }

  private ensureDirectories(): void {
    [this.repoDir, this.storageDir, this.archiveDir, this.tempDir].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
    this.cleanTempDir();
    // Initialize git repo if not already
    if (!fs.existsSync(join(this.repoDir, '.git'))) {
      simpleGit(this.repoDir).init();
    }
  }

  private cleanTempDir(): void {
    if (!fs.existsSync(this.tempDir)) return;
    const tempFiles: Array<string> = fs
      .readdirSync(this.tempDir)
      .map((x: string) => join(this.tempDir, x));
    tempFiles.forEach((tempFile: string) => fs.unlinkSync(tempFile));
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
    const items: Array<Item> = [];
    Object.keys(data).forEach((id: string) => {
      if (data[id].isTask) {
        items.push(new Task(data[id]));
      } else if (data[id].isTask === false) {
        items.push(new Note(data[id]));
      }
      // Support old storage format
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

  public async get(ids?: Array<number>): Promise<Array<Item>> {
    await this.git.pull().catch(() => {});
    let data: Array<Item> = [];
    if (fs.existsSync(this.mainStorageFile)) {
      const content: string = fs.readFileSync(this.mainStorageFile, 'utf8');
      const jsonData: any = JSON.parse(content);
      data = this.parseJson(jsonData);
    }
    if (ids) {
      return this.filterByID(data, ids);
    }
    return data;
  }

  public async getArchive(ids?: Array<number>): Promise<Array<Item>> {
    await this.git.pull().catch(() => {});
    let archive: Array<Item> = [];
    if (fs.existsSync(this.archiveFile)) {
      const content: string = fs.readFileSync(this.archiveFile, 'utf8');
      const jsonArchive: any = JSON.parse(content);
      archive = this.parseJson(jsonArchive);
    }
    if (ids) {
      return this.filterByID(archive, ids);
    }
    return archive;
  }

  private async getRemoteBranchName(): Promise<string | null> {
    const remotes = await this.git.getRemotes(true);
    const hasRemote = remotes && remotes.length > 0;
    if (!hasRemote) return null;

    const branchSummary = await this.git.branch(['-r']);
    if (branchSummary.branches['origin/main']) {
      return 'origin/main';
    } else if (branchSummary.branches['origin/master']) {
      return 'origin/master';
    }
    return null;
  }

  public async set(data: Array<Item>): Promise<void> {
    try {
      const branchName = await this.getRemoteBranchName();

      if (!branchName) {
        Renderer.instance.gitLocalOnly();
      } else if (branchName) {
      // Force sync to latest remote state
        try {
          await this.git.fetch();
          await this.git.reset(['--hard', branchName]);
        } catch (err) {
          Renderer.instance.gitFetchResetError();
        }
      }

      const jsonData: string = JSON.stringify(data.map((item: Item) => item.toJSON()), null, 4);
      const tempStorageFile: string = this.getTempFile(this.mainStorageFile);
      fs.writeFileSync(tempStorageFile, jsonData, 'utf8');
      fs.renameSync(tempStorageFile, this.mainStorageFile);

      // Stage and commit
      await this.git.add(this.mainStorageFile);
      try {
        await this.git.commit('Update storage.json');
      } catch (err) {
        if (err instanceof Error && !err.message.toLowerCase().includes('nothing to commit')) {
          Renderer.instance.gitCommitError(err.message);
        } else {
          Renderer.instance.gitCommitError(String(err));
        }
      }
      // Push
      try {
        await this.git.push();
      } catch (err) {
        if (
          err instanceof Error &&
          (err.message.includes('No configured push destination') || err.message.includes('No remote configured'))
        ) {
          Renderer.instance.gitRemoteSetup();
        } else if (err instanceof Error) {
          Renderer.instance.gitPushError(err.message);
        } else {
          Renderer.instance.gitPushError(String(err));
        }
      }
    } catch (error) {
      return Promise.reject(error);
    }
  }


  public async setArchive(archive: Array<Item>): Promise<void> {
    try {     
      // Force sync to latest remote state
      const branchName = await this.getRemoteBranchName();

    if (branchName) {
      try {
        await this.git.fetch();
        await this.git.reset(['--hard', branchName]);
      } catch (err) {
        // Errors are intentionally suppressed here to avoid duplicate warnings.
        // All user-facing git errors are handled in `set`, which is always called together with `setArchive`.
        // Suppressed
      }
    }

    const jsonArchive: string = JSON.stringify(archive.map((item: Item) => item.toJSON()), null, 4);
    const tempArchiveFile: string = this.getTempFile(this.archiveFile);
    fs.writeFileSync(tempArchiveFile, jsonArchive, 'utf8');
    fs.renameSync(tempArchiveFile, this.archiveFile);

    // Stage and commit
    await this.git.add(this.archiveFile);
    try {
      await this.git.commit('Update archive.json');
    } catch (err) {
      // do nothing
    }
    // Push
    try {
      await this.git.push();
    } catch (err) {
        // do nothing
      }
    } catch (error) {
      return Promise.reject(error);
    }
  }

  private filterByID(data: Array<Item>, ids: Array<number>): Array<Item> {
    if (ids) {
      return data.filter(item => ids.indexOf(item.id) !== -1);
    }
    return data;
  }
}
