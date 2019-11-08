import { join } from 'path';
import * as os from 'os';
import * as fs from 'fs';
import pkg = require('../package.json');

const defaultConfig = pkg.configuration.default;

export type ITheme = {
  colors: {
    pale: string,
    error: string,
    task: {
      priority: {
        medium: string,
        high: string
      }
    },
    icons: {
      note: string,
      success: string,
      star: string,
      progress: string,
      pending: string,
      canceled: string
    }
  }
}

export interface IConfig {
  language: string,
  tasklineDirectory: string,
  displayCompleteTasks: boolean,
  displayProgressOverview: boolean,
  storageModule: string,
  firestoreConfig: {
    storageName: string,
    archiveName: string,
    type: string,
    project_id: string,
    private_key_id: string,
    private_key: string,
    client_email: string,
    client_id: string,
    auth_uri: string,
    token_uri: string,
    auth_provider_x509_cert_url: string,
    client_x509_cert_url: string,
    databaseURL: string
  },
  dateformat: string,
  theme: ITheme
}

export class Config {
  private static _instance: Config
  private config: any;
  private configFile: string;

  public static get instance(): Config {
    if (!this._instance) {
      this._instance = new Config();
    }

    return this._instance;
  }

  private constructor() {
    this.configFile = join(os.homedir(), '.taskline.json');

    this.ensureConfigFile();
  }

  private ensureConfigFile(): void {
    if (fs.existsSync(this.configFile)) {
      return;
    }

    const data = JSON.stringify(defaultConfig, null, 4);
    fs.writeFileSync(this.configFile, data, 'utf8');
  }

  private formatTasklineDir(path: string): string {
    return join(os.homedir(), path.replace(/^~/g, ''));
  }

  public get(): any {
    if (!this.config) {
      const content = fs.readFileSync(this.configFile, 'utf8');
      this.config = JSON.parse(content);

      if (this.config.tasklineDirectory.startsWith('~')) {
        this.config.tasklineDirectory = this.formatTasklineDir(
          this.config.tasklineDirectory
        );
      }
    }

    return Object.assign({}, defaultConfig, this.config);
  }

  public set(config: any): void {
    const data = JSON.stringify(config, null, 4);
    fs.writeFileSync(this.configFile, data, 'utf8');
    this.config = null;
  }

  public getDefault(): any {
    return defaultConfig;
  }

  public getConfigPath(): string {
    return this.configFile;
  }
}
