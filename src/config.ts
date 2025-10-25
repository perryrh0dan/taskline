import { join } from 'path';
import { homedir } from 'os';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { ServiceAccount } from 'firebase-admin';

import pkg = require('../package.json');

const defaultConfig = pkg.configuration.default;

export interface ITheme {
  colors: {
    pale: string;
    error: string;
    task: {
      priority: {
        medium: string;
        high: string;
      };
    };
    icons: {
      note: string;
      success: string;
      star: string;
      progress: string;
      pending: string;
      canceled: string;
    };
  };
}

export interface IFirestoreConfig extends ServiceAccount {
  storageName: string;
  archiveName: string;
}

export interface IConfig {
  language: string;
  tasklineDirectory: string;
  displayCompleteTasks: boolean;
  displayProgressOverview: boolean;
  storageModule: string;
  firestoreConfig: IFirestoreConfig;
  dateformat: string;
  theme: ITheme;
  gitStorageDirectory?: string;
}

export class Config {
  private static _instance: Config;
  private config: any;
  private configFile: string;

  public static get instance(): Config {
    if (!this._instance) {
      this._instance = new Config();
    }

    return this._instance;
  }

  private constructor() {
    this.configFile = join(homedir(), '.taskline.json');

    this.ensureConfigFile();
  }

  private ensureConfigFile(): void {
    if (existsSync(this.configFile)) {
      return;
    }

    const data = JSON.stringify(defaultConfig, null, 4);
    writeFileSync(this.configFile, data, 'utf8');
  }

  private formatTasklineDir(path: string): string {
    return join(homedir(), path.replace(/^~/g, ''));
  }

  public get(): IConfig {
    if (!this.config) {
      const content = readFileSync(this.configFile, 'utf8');
      this.config = JSON.parse(content);

      if (this.config.tasklineDirectory.startsWith('~')) {
        this.config.tasklineDirectory = this.formatTasklineDir(
          this.config.tasklineDirectory,
        );
      }
    }

    return Object.assign({}, defaultConfig, this.config);
  }

  public set(config: any): void {
    const data = JSON.stringify(config, null, 4);
    writeFileSync(this.configFile, data, 'utf8');
    this.config = null;
  }

  public getDefault(): any {
    return defaultConfig;
  }

  public getConfigPath(): string {
    return this.configFile;
  }
}
