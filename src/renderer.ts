import { Signale, SignaleConstructorOptions } from '@perryrh0dan/signale';
import { Ora } from 'ora';
import { addWeeks, isBefore, endOfDay, toDate } from 'date-fns';
import * as figures from 'figures';

const chalk = require('chalk');

import { Config } from './config';
import { Localization } from './localization';
import ora = require('ora');
import { Item } from './item';
import { TaskPriority, Task } from './task';

const { underline } = chalk;
const local = Localization.instance;

type Theme = {
  colors: {
    pale: string,
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

export class Renderer {
  private static _instance: Renderer;
  private spinner: Ora;
  private signale: any;
  private theme: Theme;

  public static get instance(): Renderer {
    if (!this._instance) {
      this._instance = new Renderer();
    }

    return this._instance;
  }

  private constructor() {
    this.spinner = ora();
    this.loadTheme();
    this.configureSignale();
  }

  private loadTheme(): void {
    this.theme = this.configuration.theme;
  }

  private configureSignale(): void {
    const signaleOptions: SignaleConstructorOptions = {
      config: {
        displayLabel: false
      },
      types: {
        note: {
          badge: figures.bullet,
          color: this.getColorValue('icons.note'),
          label: 'note'
        },
        success: {
          badge: figures.tick,
          color: this.getColorValue('icons.success'),
          label: 'success'
        },
        star: {
          badge: figures.star,
          color: this.getColorValue('icons.star'),
          label: 'star'
        },
        await: {
          badge: figures.ellipsis,
          color: this.getColorValue('icons.progress'),
          label: 'awaiting'
        },
        pending: {
          badge: figures.checkboxOff,
          color: this.getColorValue('icons.pending'),
          label: 'pending'
        },
        fatal: {
          badge: figures.cross,
          color: this.getColorValue('icons.canceled'),
          label: 'error'
        }
      }
    };

    this.signale = new Signale(signaleOptions);
  }

  private getColorType(color: string): string {
    if (color.includes('rgb')) {
      return 'rgb';
    } else if (color.includes('#')) {
      return 'hex';
    } else {
      return 'keyword';
    }
  }

  private getColorValue(type: string): string {
    const configValue = type.split('.').reduce((p: any, prop: any) => { return p[prop]; }, this.theme.colors);
    const defaultValue = type.split('.').reduce((p: any, prop: any) => { return p[prop]; }, Config.instance.getDefault().theme.colors);
    switch (this.getColorType(configValue)) {
      case 'rgb':
        return configValue;
      case 'hex':
        return configValue;
      case 'keyword':
        if (typeof chalk[configValue] === 'function') {
          return configValue;
        }
        break;
    }
    return defaultValue;
  }

  private getColorMethod(type: string): Function {
    const color = this.getColorValue(type);
    let result;
    switch (this.getColorType(color)) {
      case 'rgb':
        result = /rgb\((\d*),(\d*),(\d*)\)/.exec(color);
        if (!result) break;
        const red = result[1];
        const green = result[2];
        const blue = result[3];
        return chalk.rgb(red, green, blue);
      case 'hex':
        result = /#(\w{6})/.exec(color);
        if (!result) break;
        const hex = result[0];
        return chalk.hex(hex);
    }
    return chalk[color];
  }

  private printColor(type: string, value: string): string {
    return this.getColorMethod(type)(value);
  }

  private get configuration(): any {
    return Config.instance.get();
  }

  private colorBoards(boards: any): any {
    return boards.map((x: any) => this.printColor('pale', x)).join(' ');
  }

  private isBoardComplete(items: Array<Item>): boolean {
    const { tasks, complete, notes } = this.getItemStats(items);
    return tasks === complete && notes === 0;
  }

  private getAge(birthday: number): string {
    const daytime: number = 24 * 60 * 60 * 1000;
    const age: number = Math.round(Math.abs(birthday - Date.now()) / daytime);
    return age === 0 ? '' : this.printColor('pale', `${age}d`);
  }

  private getRelativeHumanizedDate(dueDate: Date, now?: Date): string {
    if (!now) now = new Date();

    // get date diff
    const diffTime: number = dueDate.getTime() - now.getTime();
    const diffSeconds: number = Math.ceil(diffTime / 1000);
    let unit = '';
    let value = 0;

    if (Math.abs(diffSeconds) < 60) {
      value = diffSeconds;
      unit = 'seconds';
    } else if (Math.abs(diffSeconds) < 60 * 60) {
      value = Math.round(diffSeconds / 60);
      unit = 'minutes';
    } else if (Math.abs(diffSeconds) < 60 * 60 * 24) {
      value = Math.round(diffSeconds / (60 * 60));
      unit = 'hours';
    } else if (Math.abs(diffSeconds) < 60 * 60 * 24 * 7) {
      value = Math.round(diffSeconds / (60 * 60 * 24));
      unit = 'days';
    } else if (Math.abs(diffSeconds) < 60 * 60 * 24 * 30) {
      value = Math.round(diffSeconds / (60 * 60 * 24 * 7));
      unit = 'weeks';
    } else {
      value = Math.round(diffSeconds / (60 * 60 * 24 * 30));
      unit = 'months';
    }

    const absValue = Math.abs(value);
    unit = absValue === 1 ? unit.slice(0, unit.length - 1) : unit;
    const humanizedDate = value >= 1 ? `in ${value} ${unit}` : `${absValue} ${unit} ago`;
    return humanizedDate;
  }

  private getDueDate(dueTimestamp: number): string {
    const now = new Date();
    const dueDate = toDate(dueTimestamp);

    const humanizedDate = this.getRelativeHumanizedDate(dueDate);
    const text = `(Due ${humanizedDate})`;

    const isSoon = isBefore(dueDate, addWeeks(now, 1));
    const isUrgent = isBefore(dueDate, endOfDay(now));

    if (isUrgent) {
      return this.printColor('task.priority.high', underline(text));
    }

    if (isSoon) {
      return this.printColor('task.priority.medium', text);
    }

    return this.printColor('pale', text);
  }

  private getCorrelation(items: Array<Item>): string {
    const { tasks, complete } = this.getItemStats(items);
    return this.printColor('pale', `[${complete}/${tasks}]`);
  }

  private getItemStats(items: Array<Item>): any {
    let [tasks, complete, notes] = [0, 0, 0];

    items.forEach((item: Item) => {
      if (item.isTask) {
        tasks++;
        if (item instanceof Task && item.isComplete) {
          return complete++;
        }
      }

      return notes++;
    });

    return {
      tasks,
      complete,
      notes
    };
  }

  private getStar(item: Item): string {
    return item.isStarred ? this.printColor('icons.star', '★') : '';
  }

  private buildTitle(key: string, items: Array<Item>): any {
    const title =
      key === new Date().toDateString() ? `${underline(key)} ${this.printColor('pale', '[Today]')}` : underline(key);
    const correlation = this.getCorrelation(items);
    return {
      title,
      correlation
    };
  }

  private buildPrefix(item: Item): string {
    const prefix: Array<string> = [];

    prefix.push(' '.repeat(4 - String(item.id).length));
    prefix.push(this.printColor('pale', `${item.id}.`));

    return prefix.join(' ');
  }

  private getTaskColorMethod(task: Task): any {
    if (task.priority === 2) {
      return this.getColorMethod('task.priority.medium');
    } else {
      return this.getColorMethod('task.priority.high');
    }
  }

  private buildMessage(item: Item): string {
    const message: Array<string> = [];

    if (item instanceof Task) {
      if (!item.isComplete && item.priority > 1) {
        message.push(this.getTaskColorMethod(item).underline(item.description));
      } else {
        message.push(item.isComplete ? this.printColor('pale', item.description) : item.isCanceled ? this.printColor('pale', item.description) : item.description);
      }

      if (!item.isComplete && item.priority > 1) {
        message.push(item.priority === 2 ? this.printColor('task.priority.medium', '(!)') : this.printColor('task.priority.high', '(!!)'));
      }
    } else {
      message.push(item.description);
    }

    return message.join(' ');
  }

  private displayTitle(board: string, items: Array<Item>): void {
    const { title: message, correlation: suffix } = this.buildTitle(
      board,
      items
    );
    const titleObj = {
      prefix: '\n ',
      message,
      suffix
    };

    return this.signale.log(titleObj);
  }

  private displayItemByBoard(item: Item): void {
    const age = this.getAge(item.timestamp);
    let dueDate;
    if (item instanceof Task && item.dueDate !== 0 && !item.isComplete) {
      dueDate = this.getDueDate(item.dueDate);
    }

    const star = this.getStar(item);

    const prefix = this.buildPrefix(item);
    const message = this.buildMessage(item);
    let suffix;
    if (dueDate) {
      suffix = `${dueDate} ${star}`;
    } else {
      suffix = age.length === 0 ? star : `${age} ${star}`;
    }

    const msgObj = {
      prefix,
      message,
      suffix
    };

    if (item instanceof Task) {
      return item.isComplete ? this.signale.success(msgObj) : item.inProgress ? this.signale.await(msgObj) : item.isCanceled ? this.signale.fatal(msgObj) : this.signale.pending(msgObj);
    }

    return this.signale.note(msgObj);
  }

  private displayItemByDate(item: Item): void {
    const boards = item.boards.filter((x: string) => x !== 'My Board');
    const star = this.getStar(item);

    const prefix = this.buildPrefix(item);
    const message = this.buildMessage(item);
    const suffix = `${this.colorBoards(boards)} ${star}`;

    const msgObj = {
      prefix,
      message,
      suffix
    };

    if (item instanceof Task) {
      return item.isComplete ? this.signale.success(msgObj) : item.inProgress ? this.signale.await(msgObj) : item.isCanceled ? this.signale.fatal(msgObj) : this.signale.pending(msgObj);
    }

    return this.signale.note(msgObj);
  }

  private format(source: string, params: Array<any>): string {
    params.forEach((value, index) => {
      const re = new RegExp('\\{' + index + '\\}', 'g');
      source = source.replace(re, value);
    });

    return source;
  }

  public startLoading(): void {
    this.spinner.start();
  }

  public stopLoading(): void {
    this.spinner.stop();
  }

  public displayByBoard(data: any): void {
    this.stopLoading();
    Object.keys(data).forEach((board: string) => {
      if (
        this.isBoardComplete(data[board]) &&
        !this.configuration.displayCompleteTasks
      ) {
        return;
      }

      this.displayTitle(board, data[board]);
      data[board].forEach((item: Item) => {
        if (item instanceof Task && item.isComplete && !Config.instance.get().displayCompleteTasks) {
          return;
        }

        this.displayItemByBoard(item);
      });
    });
  }

  public displayByDate(data: any): void {
    this.stopLoading();
    Object.keys(data).forEach((date: string) => {
      if (
        this.isBoardComplete(data[date]) &&
        !Config.instance.get().displayCompleteTasks
      ) {
        return;
      }

      this.displayTitle(date, data[date]);
      data[date].forEach((item: Item) => {
        if (
          item instanceof Task &&
          item.isTask &&
          item.isComplete &&
          !Config.instance.get().displayCompleteTasks
        ) {
          return;
        }

        this.displayItemByDate(item);
      });
    });
  }

  public displayStats(percent: number, complete: number, canceled: number, inProgress: number, pending: number, notes: number): void {
    if (!Config.instance.get().displayProgressOverview) {
      return;
    }

    const percentText = percent >= 75 ? this.printColor('icons.success', `${percent}%`) : percent >= 50 ? this.printColor('task.priority.medium', `${percent}%`) : `${percent}%`;

    const status: Array<string> = [
      `${this.printColor('icons.success', complete.toString())} ${this.printColor('pale', local.get('stats.done'))}`,
      `${this.printColor('icons.canceled', canceled.toString())} ${this.printColor('pale', local.get('stats.canceled'))}`,
      `${this.printColor('icons.progress', inProgress.toString())} ${this.printColor('pale', local.get('stats.progress'))}`,
      `${this.printColor('icons.pending', pending.toString())} ${this.printColor('pale', local.get('stats.pending'))}`,
      `${this.printColor('icons.note', notes.toString())} ${this.printColor('pale', local.get('stats.note', notes === 1 ? 0 : 1))}`
    ];

    if (complete !== 0 && inProgress === 0 && pending === 0 && notes === 0) {
      this.signale.log({
        prefix: '\n ',
        message: local.get('stats.allDone'),
        suffix: this.printColor('icons.star', '★')
      });
    }

    if (pending + inProgress + complete + notes === 0) {
      this.signale.log({
        prefix: '\n ',
        message: local.get('help'),
        suffix: this.printColor('icons.star', '★')
      });
    }

    this.signale.log({
      prefix: '\n ',
      message: this.printColor('pale', this.format(local.get('stats.percentage'), [percentText]))
    });

    this.signale.log({
      prefix: ' ',
      message: status.join(this.printColor('pale', ' · ')),
      suffix: '\n'
    });
  }

  public displayConfig(config: any, path: string): void {
    this.signale.log({
      prefix: ' ',
      message: chalk.green(this.format(local.get('config.path'), [path]))
    });

    this.signale.log({
      prefix: ' ',
      message: `#### ${local.get('config.title')} ####`
    });

    this.iterateObject(config, 0);
  }

  private iterateObject(obj: any, depth: number): void {
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] !== 'object') {
        // check for private key
        let text: string = obj[key].toString() ? obj[key].toString() : '';
        if (text.includes('PRIVATE KEY')) {
          text = text.slice(0, 50).replace('\n', ' ').concat('...');
        }
        this.signale.log({
          prefix: ' ',
          message: `${key}: ${text}`
        });
      } else {
        this.iterateObject(obj[key], depth++);
      }
    });
  }

  public markComplete(ids: Array<number>): void {
    this.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const [prefix, suffix] = ['\n', this.printColor('pale', ids.join(', '))];
    const message: string = local.get('success.check', ids.length > 1 ? 1 : 0);

    this.signale.success({
      prefix,
      message,
      suffix
    });
  }

  public markInComplete(ids: Array<number>): void {
    this.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const [prefix, suffix] = ['\n', this.printColor('pale', ids.join(', '))];
    const message: string = local.get('success.uncheck', ids.length > 1 ? 1 : 0);

    this.signale.success({
      prefix,
      message,
      suffix
    });
  }

  public markStarted(ids: Array<number>): void {
    this.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const [prefix, suffix] = ['\n', this.printColor('pale', ids.join(', '))];
    const message = local.get('success.start', ids.length > 1 ? 1 : 0);

    this.signale.success({
      prefix,
      message,
      suffix
    });
  }

  public markPaused(ids: Array<number>): void {
    this.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const [prefix, suffix] = ['\n', this.printColor('pale', ids.join(', '))];
    const message = local.get('success.pause', ids.length > 1 ? 1 : 0);

    this.signale.success({
      prefix,
      message,
      suffix
    });
  }

  public markCanceled(ids: Array<number>): void {
    this.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const [prefix, suffix] = ['\n', this.printColor('pale', ids.join(', '))];
    const message = local.get('success.cancel', ids.length > 1 ? 1 : 0);

    this.signale.success({
      prefix,
      message,
      suffix
    });
  }

  public markRevived(ids: Array<number>): void {
    this.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const [prefix, suffix] = ['\n', this.printColor('pale', ids.join(', '))];
    const message = local.get('revive', ids.length > 1 ? 1 : 0);

    this.signale.success({
      prefix,
      message,
      suffix
    });
  }

  public markStarred(ids: Array<number>): void {
    this.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const [prefix, suffix] = ['\n', this.printColor('pale', ids.join(', '))];
    const message = local.get('success.star', ids.length > 1 ? 1 : 0);

    this.signale.success({
      prefix,
      message,
      suffix
    });
  }

  public markUnstarred(ids: Array<number>): void {
    this.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const [prefix, suffix] = ['\n', this.printColor('pale', ids.join(', '))];
    const message = local.get('success.unstar', ids.length > 1 ? 1 : 0);

    this.signale.success({
      prefix,
      message,
      suffix
    });
  }

  public invalidCustomAppDir(path: string): void {
    this.stopLoading();

    const [prefix, suffix] = ['\n', this.printColor('error', path)];
    const message = local.get('warning.appDir');

    this.signale.error({
      prefix,
      message,
      suffix
    });
  }

  public invalidFirestoreConfig(): void {
    this.stopLoading();

    const [prefix, suffix] = ['\n', ''];
    const message = local.get('warning.firestoreConfig');

    this.signale.error({
      prefix,
      message,
      suffix
    });
  }

  public invalidID(id: number): void {
    this.stopLoading();

    const [prefix, suffix] = ['\n', this.printColor('pale', id.toString())];
    const message = local.get('warning.id');

    this.signale.error({
      prefix,
      message,
      suffix
    });
  }

  public invalidIDRange(range: string): void {
    this.stopLoading();

    const [prefix, suffix] = ['\n', this.printColor('pale', range)];
    const message = local.get('warning.idRange');

    this.signale.error({
      prefix,
      message,
      suffix
    });
  }

  public invalidPriority(): void {
    this.stopLoading();

    const prefix = '\n';
    const message = local.get('warning.priority');

    this.signale.error({
      prefix,
      message
    });
  }

  public invalidDateFormat(date: string): void {
    this.stopLoading();

    const [prefix, suffix] = ['\n', this.printColor('pale', date)];
    const message = local.get('warning.dateFormat');

    this.signale.error({
      prefix,
      message,
      suffix
    });
  }

  public successCreate(item: Item): void {
    this.stopLoading();

    const [prefix, suffix] = ['\n', this.printColor('pale', item.id.toString())];
    const message = local.get('success.create', item.isTask ? 0 : 1);

    this.signale.success({
      prefix,
      message,
      suffix
    });
  }

  public successEdit(id: number): void {
    this.stopLoading();

    const [prefix, suffix] = ['\n', this.printColor('pale', id.toString())];
    const message = local.get('success.edit');

    this.signale.success({
      prefix,
      message,
      suffix
    });
  }

  public successDelete(ids: Array<number>): void {
    this.stopLoading();

    const [prefix, suffix] = ['\n', this.printColor('pale', ids.join(', '))];
    const message: string = local.get('success.delete', ids.length > 1 ? 1 : 0);

    this.signale.success({
      prefix,
      message,
      suffix
    });
  }

  public successMove(ids: Array<number>, boards: Array<string>): void {
    this.stopLoading();

    const [prefix, suffix] = ['\n', this.printColor('pale', boards.join(', '))];
    const text = local.get('success.move', ids.length > 1 ? 1 : 0);
    const message = this.format(text, [this.printColor('pale', ids.join(', '))]);

    this.signale.success({
      prefix,
      message,
      suffix
    });
  }

  public successPriority(ids: Array<number>, priority: TaskPriority): void {
    this.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const prefix: string = '\n';
    const text = local.get('success.priority', ids.length > 1 ? 1 : 0);
    const message = this.format(text, [this.printColor('pale', ids.join(', '))]);
    const suffix = priority === 3 ? this.printColor('task.priority.high', TaskPriority[priority]) : priority === 2 ? this.printColor('task.priority.medium', TaskPriority[priority]) : this.printColor('icons.success', TaskPriority[priority]);

    this.signale.success({
      prefix,
      message,
      suffix
    });
  }

  public successDueDate(ids: Array<number>, dueDate: Date): void {
    this.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const prefix = '\n';
    const text = local.get('success.duedate', ids.length > 1 ? 1 : 0);
    const message = this.format(text, [this.printColor('pale', ids.join(', '))]);

    const suffix = dueDate;
    this.signale.success({
      prefix,
      message,
      suffix
    });
  }

  public successRestore(ids: Array<number>): void {
    this.stopLoading();

    const [prefix, suffix] = ['\n', this.printColor('pale', ids.join(', '))];
    const message = local.get('success.restore', ids.length > 1 ? 1 : 0);

    this.signale.success({
      prefix,
      message,
      suffix
    });
  }

  public successCopyToClipboard(ids: Array<number>): void {
    this.stopLoading();

    const [prefix, suffix] = ['\n', this.printColor('pale', ids.join(', '))];
    const message = local.get('success.clipboard', ids.length > 1 ? 1 : 0);

    this.signale.success({
      prefix,
      message,
      suffix
    });
  }

  public successRearrangeIDs(): void {
    this.stopLoading();

    const prefix = '\n';
    const message = local.get('success.rearrange');

    this.signale.success({
      prefix,
      message
    });
  }
}
