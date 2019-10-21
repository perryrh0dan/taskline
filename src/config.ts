import { join } from "path";
import * as os from 'os';
import * as fs from 'fs';
import pkg = require('../package.json');

const defaultConfig = pkg.configuration.default;

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
    this.configFile = join(os.homedir(), '.taskline.json')

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