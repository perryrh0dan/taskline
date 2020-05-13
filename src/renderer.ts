import { Signale, SignaleConstructorOptions } from '@perryrh0dan/signale';
import { addWeeks, isBefore, endOfDay, toDate } from 'date-fns';
import * as figures from 'figures';
import ora = require('ora');

const chalk = require('chalk');

import { Config } from './config';
import { Localization, format } from './localization';
import { Item } from './item';
import { TaskPriority, Task } from './task';
import { getRelativeHumanizedDate } from './libs/date';
import { Note } from './note';

const { underline } = chalk;

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
  private spinner: ora.Ora;
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

  private getDueDate(dueTimestamp: number): string {
    const now = new Date();
    const dueDate = toDate(dueTimestamp);

    const humanizedDate = getRelativeHumanizedDate(dueDate);
    const text = `(${humanizedDate})`;

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

  private getPassedTime(passedTime: number): string {
    const seconds = passedTime / 1000;
    const minutes = Math.floor((seconds / 60) % 60);
    const hours = Math.floor(seconds / 3600);

    return `${hours + Math.round(minutes/60 * 100) / 100} hours`;
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
      key === new Date().toDateString() ? `${underline(key)} ${this.printColor('pale', `[${Localization.instance.get('date.today')}]`)}` : underline(key);
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
    let message: string = '';

    if (item instanceof Task) {
      message = this.buildTaskMessage(item);
    } else if (item instanceof Note) {
      message = this.buildNoteMessage(item);
    }

    return message;
  }

  private buildNoteMessage(item: Note): string {
    return item.description;
  }

  private buildTaskMessage(item: Task): string {
    const message: Array<string> = [];

    if (!item.isComplete && !item.isCanceled && item.priority > 1) {
      message.push(this.getTaskColorMethod(item).underline(item.description));
    } else if (item.isComplete || item.isCanceled) {
      message.push(this.printColor('pale', item.description));
    } else {
      message.push(item.description);
    }

    if (!item.isComplete && !item.isCanceled && item.priority == 2) {
      message.push(this.printColor('task.priority.medium', '(!)'));
    } else if (!item.isComplete && !item.isCanceled && item.priority == 3) {
      message.push(this.printColor('task.priority.high', '(!!)'));
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

    let passedTime;
    if (item instanceof Task && item.passedTime > 0) {
      passedTime = this.getPassedTime(item.getRealPassedTime());
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

    if (passedTime) {
      suffix += ` (${passedTime})`;
    }

    suffix = suffix.replace('  ', ' ');

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
      `${this.printColor('icons.success', complete.toString())} ${this.printColor('pale', Localization.instance.get('stats.done'))}`,
      `${this.printColor('icons.canceled', canceled.toString())} ${this.printColor('pale', Localization.instance.get('stats.canceled'))}`,
      `${this.printColor('icons.progress', inProgress.toString())} ${this.printColor('pale', Localization.instance.get('stats.progress'))}`,
      `${this.printColor('icons.pending', pending.toString())} ${this.printColor('pale', Localization.instance.get('stats.pending'))}`,
      `${this.printColor('icons.note', notes.toString())} ${this.printColor('pale', Localization.instance.get('stats.note', { type: notes === 1 ? 0 : 1 }))}`
    ];

    if (complete !== 0 && inProgress === 0 && pending === 0 && notes === 0) {
      this.signale.log({
        prefix: '\n ',
        message: Localization.instance.get('stats.allDone'),
        suffix: this.printColor('icons.star', '★')
      });
    }

    if (pending + inProgress + canceled + complete + notes === 0) {
      return console.log(Localization.instance.get('help.default'));
    }

    this.signale.log({
      prefix: '\n ',
      message: this.printColor('pale', Localization.instance.getf('stats.percentage', { params: [percentText] }))
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
      message: chalk.green(Localization.instance.getf('config.path', { params: [path] }))
    });

    this.signale.log({
      prefix: ' ',
      message: `#### ${Localization.instance.get('config.title')} ####`
    });

    this.iterateObject(config, 0);
  }

  private iterateObject(obj: any, depth: number): void {
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] !== 'object') {
        // Dont show privat key
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

    const prefix = '\n';
    const message: string = Localization.instance.getf('success.check', { type: ids.length > 1 ? 1 : 0, params: [this.printColor('pale', ids.join(', '))] });

    this.signale.success({
      prefix,
      message
    });
  }

  public markInComplete(ids: Array<number>): void {
    this.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const prefix = '\n';
    const message: string = Localization.instance.getf('success.uncheck', { type: ids.length > 1 ? 1 : 0, params: [this.printColor('pale', ids.join(', '))] });

    this.signale.success({
      prefix,
      message
    });
  }

  public markStarted(ids: Array<number>): void {
    this.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const prefix = '\n';
    const message = Localization.instance.getf('success.start', { type: ids.length > 1 ? 1 : 0, params: [this.printColor('pale', ids.join(', '))] });

    this.signale.success({
      prefix,
      message
    });
  }

  public markPaused(ids: Array<number>): void {
    this.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const prefix = '\n';
    const message = Localization.instance.getf('success.pause', { type: ids.length > 1 ? 1 : 0, params: [this.printColor('pale', ids.join(', '))] });

    this.signale.success({
      prefix,
      message
    });
  }

  public markCanceled(ids: Array<number>): void {
    this.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const prefix = '\n';
    const message = Localization.instance.getf('success.cancel', { type: ids.length > 1 ? 1 : 0, params: [this.printColor('pale', ids.join(', '))] });

    this.signale.success({
      prefix,
      message
    });
  }

  public markRevived(ids: Array<number>): void {
    this.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const prefix = '\n';
    const message = Localization.instance.getf('success.revive', { type: ids.length > 1 ? 1 : 0, params: [this.printColor('pale', ids.join(', '))] });

    this.signale.success({
      prefix,
      message
    });
  }

  public markStarred(ids: Array<number>): void {
    this.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const prefix = '\n';
    const message = Localization.instance.getf('success.star', { type: ids.length > 1 ? 1 : 0, params: [this.printColor('pale', ids.join(', '))] });

    this.signale.success({
      prefix,
      message
    });
  }

  public markUnstarred(ids: Array<number>): void {
    this.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const prefix = '\n';
    const message = Localization.instance.getf('success.unstar', { type: ids.length > 1 ? 1 : 0, params: [this.printColor('pale', ids.join(', '))] });

    this.signale.success({
      prefix,
      message
    });
  }

  public invalidCustomAppDir(path: string): void {
    this.stopLoading();

    const prefix = '\n';
    const message = Localization.instance.getf('warning.appDir', { params: [this.printColor('error', path)] });

    this.signale.error({
      prefix,
      message
    });
  }

  public invalidFirestoreConfig(): void {
    this.stopLoading();

    const prefix = '\n';
    const message = Localization.instance.get('warning.firestoreConfig');

    this.signale.error({
      prefix,
      message
    });
  }

  public invalidLanguageFile(): void {
    this.stopLoading();

    const prefix = '\n';
    const message = Localization.instance.get('Unable to load language file');

    this.signale.error({
      prefix,
      message
    });
  }

  public invalidID(id: number): void {
    this.stopLoading();

    const prefix = '\n';
    const message = Localization.instance.getf('warning.id', { params: [this.printColor('pale', id.toString())] });

    this.signale.error({
      prefix,
      message
    });
  }

  public invalidIDRange(range: string): void {
    this.stopLoading();

    const prefix = '\n';
    const message = Localization.instance.getf('warning.idRange', { params: [this.printColor('pale', range)] });

    this.signale.error({
      prefix,
      message
    });
  }

  public invalidPriority(): void {
    this.stopLoading();

    const prefix = '\n';
    const message = Localization.instance.get('warning.priority');

    this.signale.error({
      prefix,
      message
    });
  }

  public invalidDateFormat(date: string): void {
    this.stopLoading();

    const prefix = '\n';
    const message = Localization.instance.getf('warning.dateFormat', { params: [this.printColor('pale', date)] });

    this.signale.error({
      prefix,
      message
    });
  }

  public successCreate(item: Item): void {
    this.stopLoading();

    const prefix = '\n';
    const message = Localization.instance.getf('success.create', { type: item.isTask ? 0 : 1, params: [this.printColor('pale', item.id.toString())] });

    this.signale.success({
      prefix,
      message
    });
  }

  public successEdit(id: number): void {
    this.stopLoading();

    const prefix = '\n';
    const message = Localization.instance.getf('success.edit', { params: [this.printColor('pale', id.toString())] });

    this.signale.success({
      prefix,
      message
    });
  }

  public successDelete(ids: Array<number>): void {
    this.stopLoading();

    const prefix = '\n';
    const message: string = Localization.instance.getf('success.delete', { type: ids.length > 1 ? 1 : 0, params: [this.printColor('pale', ids.join(', '))] });

    this.signale.success({
      prefix,
      message
    });
  }

  public successMove(ids: Array<number>, boards: Array<string>): void {
    this.stopLoading();

    const prefix = '\n';
    const message = Localization.instance.getf('success.move', { type: ids.length > 1 ? 1 : 0, params: [this.printColor('pale', ids.join(', ')), this.printColor('pale', boards.join(', '))] });

    this.signale.success({
      prefix,
      message
    });
  }

  public successPriority(ids: Array<number>, priority: TaskPriority): void {
    this.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const prefix: string = '\n';
    const text = Localization.instance.get('success.priority', { type: ids.length > 1 ? 1 : 0 });
    const prioText = priority === 3 ? this.printColor('task.priority.high', TaskPriority[priority]) : priority === 2 ? this.printColor('task.priority.medium', TaskPriority[priority]) : this.printColor('icons.success', TaskPriority[priority]);
    const message = format(text, [this.printColor('pale', ids.join(', ')), prioText]);

    this.signale.success({
      prefix,
      message
    });
  }

  public successDueDate(ids: Array<number>, dueDate: Date): void {
    this.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const prefix = '\n';
    const message = Localization.instance.getf('success.duedate', { type: ids.length > 1 ? 1 : 0, params: [this.printColor('pale', ids.join(', ')), dueDate] });

    this.signale.success({
      prefix,
      message
    });
  }

  public successRestore(ids: Array<number>): void {
    this.stopLoading();

    const prefix = '\n';
    const message = Localization.instance.getf('success.restore', { type: ids.length > 1 ? 1 : 0, params: [this.printColor('pale', ids.join(', '))] });

    this.signale.success({
      prefix,
      message
    });
  }

  public successCopyToClipboard(ids: Array<number>): void {
    this.stopLoading();

    const prefix = '\n';
    const message = Localization.instance.getf('success.clipboard', { type: ids.length > 1 ? 1 : 0, params: [this.printColor('pale', ids.join(', '))] });

    this.signale.success({
      prefix,
      message
    });
  }

  public successRearrangeIDs(): void {
    this.stopLoading();

    const prefix = '\n';
    const message = Localization.instance.get('success.rearrange');

    this.signale.success({
      prefix,
      message
    });
  }
}
