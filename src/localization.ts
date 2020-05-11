import { Config } from './config';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { Renderer } from './renderer';
import { merge } from './utils/utils';

export const format = function(source: string, params: Array<any>): string {
    params.forEach((value, index) => {
      const re = new RegExp('\\{' + index + '\\}', 'g');
      source = source.replace(re, value);
    });

    return source;
};

export class Localization {
  private static _instance: Localization
  private _locals: any;
  private default: any;

  public static get instance(): Localization {
    if (!this._instance) {
      this._instance = new Localization();
    }

    return this._instance;
  }

  private constructor() {
    const language = Config.instance.get().language;

    try {
      // load language
      if (language != 'en') {
        this.locals = this.load(language);
      }
      this.default = this.load('en');
    } catch (error) {
      Renderer.instance.invalidLanguageFile();
      process.exit(1);
    }
  }

  private get locals(): any {
    return merge({}, this.default, this._locals);
  }

  private set locals(locals: any) {
    this._locals = locals;
  }

  private load(language: string): void {
    const filePath = resolve(__dirname, '..', 'i18n', language + '.json');
    if (!existsSync(filePath)) throw new Error('unable to load language file');
    const content = readFileSync(filePath, 'utf8');
    return this.parse(JSON.parse(content));
  }

  private parse(o: any): void {
    const self = this;

    Object.keys(o).forEach(function(k: any) {
      if (o[k] !== null && typeof o[k] === 'object') {
        self.parse(o[k]);
        return;
      }
      if (typeof o[k] === 'string') {
        if (o[k].includes('|')) {
          // Split texts at | and remove leading and trailing whitespace
          o[k] = o[k].split('|').map((element: string) => element.trim());
        }
      }
    });

    return o;
  }

  public get(key: string, options?: {type: number}): string {
    const keys = key.split('.');
    let localConfig = this.locals;
    let temp = localConfig;
    while (keys.length > 1) {
      let n = keys.shift();
      if (!n) return '';
      temp = temp[n];
    }
    if (options && options.type != undefined) {
      return temp[keys[0]][options.type];
    }
    return temp[keys[0]];
  }

  public getf(key: string, options: { type?: number, params: Array<any> }): string {
    let text = '';
    if (options && options.type != undefined) {
      text = this.get(key, {type: options.type});
    } else {
      text = this.get(key);
    }
    return format(text, options.params);
  }
}
