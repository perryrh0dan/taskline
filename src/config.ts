import { join } from "path";
import * as os from 'os';
import * as fs from 'fs';
import pkg = require('../package.json');

const defaultConfig = pkg.configuration.default;

export class Config {
  static instance: Config
  config: any;
  configFile: string;

  public static getInstance() {
    if (!this.instance) {
      this.instance = new Config();
    }

    return this.instance;
  }

  private constructor() {
    this.configFile = join(os.homedir(), '.taskline.json')

    this.ensureConfigFile();
  }

  private ensureConfigFile() {
    if (fs.existsSync(this.configFile)) {
      return;
    }

    const data = JSON.stringify(defaultConfig, null, 4);
    fs.writeFileSync(this.configFile, data, 'utf8');
  }

  private formatTasklineDir(path: string) {
    return join(os.homedir(), path.replace(/^~/g, ''));
  }

  get() {
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

  set(config) {
    const data = JSON.stringify(config, null, 4);
    fs.writeFileSync(this.configFile, data, 'utf8');
    this.config = null;
  }
}