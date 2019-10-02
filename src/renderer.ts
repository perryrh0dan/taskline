import { Signale, SignaleOptions } from 'signale';
import { Ora } from 'ora';
import { addWeeks, isBefore, endOfDay, toDate } from 'date-fns';
import * as figures from 'figures';

const chalk = require('chalk');

import { Config } from './config';
import ora = require('ora');
import { Item } from './item';
import { TaskPriority, Task } from './task';

const { underline } = chalk;

export class Renderer {
  private static _instance: Renderer
  private spinner: Ora;
  private signale: Signale;

  private colorPale: Function;
  private colorMedium: Function;
  private colorHigh: Function;
  private colorNote: Function;
  private colorSuccess: Function;
  private colorStar: Function;
  private colorProgress: Function;
  private colorPending: Function;
  private colorCanceled: Function;

  public static get instance(): Renderer {
    if (!this._instance) {
      this._instance = new Renderer();
    }

    return this._instance;
  }

  private constructor() {
    this.spinner = ora();
    this.loadColorConfiguration();
  }

  private loadColorConfiguration(): void {
    const { colors } = this.configuration;
    const signaleOptions: SignaleOptions = {
      config: {
        displayLabel: false
      },
    };

    let color: string;
    if (typeof chalk[colors.pale] === 'function') {
      this.colorPale = chalk[colors.pale];
    } else {
      this.colorPale = chalk[Config.instance.getDefault().colors.pale];
    }

    if (typeof chalk[colors.task.priority.medium] === 'function') {
      this.colorMedium = chalk[colors.task.priority.medium];
    } else {
      this.colorMedium = chalk[Config.instance.getDefault().colors.task.priority.medium];
    }

    if (typeof chalk[colors.task.priority.high] === 'function') {
      this.colorHigh = chalk[colors.task.priority.high];
    } else {
      this.colorHigh = chalk[Config.instance.getDefault().colors.task.priority.high];
    }

    // Note
    if (typeof chalk[colors.icons.note] === 'function') {
      color = colors.icons.note;
    } else {
      color = Config.instance.getDefault().colors.icons.note;
    }

    signaleOptions.types = {
      note: {
        badge: figures.bullet,
        color: color,
        label: 'note'
      },
    };
    this.colorNote = chalk[color];

    // Success
    if (typeof chalk[colors.icons.success] === 'function') {
      color = colors.icons.success;
      this.colorSuccess = chalk[colors.icons.success];
    } else {
      color = Config.instance.getDefault().colors.icons.success;
    }

    signaleOptions.types = Object.assign(signaleOptions.types, {
      success: {
        badge: figures.tick,
        color: 'green',
        label: 'success'
      }
    });
    this.colorSuccess = chalk[color];

    // Star
    if (typeof chalk[colors.icons.star] === 'function') {
      color = colors.icons.star;
    } else {
      color = Config.instance.getDefault().colors.icons.star;
    }

    signaleOptions.types = Object.assign(signaleOptions.types, {
      star: {
        badge: figures.star,
        color: color,
        label: 'star'
      }
    });
    this.colorStar = chalk[color];

    // Progress
    if (typeof chalk[colors.icons.progress] === 'function') {
      color = colors.icons.progress;
    } else {
      color = Config.instance.getDefault().colors.icons.progress;
    }

    signaleOptions.types = Object.assign(signaleOptions.types, {
      await: {
        badge: figures.ellipsis,
        color: color,
        label: 'awaiting'
      }
    });
    this.colorProgress = chalk[color];

    // Pending
    if (typeof chalk[colors.icons.pending] === 'function') {
      color = colors.icons.pending;
    } else {
      color = Config.instance.getDefault().colors.icons.pending;
    }

    signaleOptions.types = Object.assign(signaleOptions.types, {
      pending: {
        badge: figures.checkboxOff,
        color: color,
        label: 'pending'
      }
    });
    this.colorPending = chalk[color];

    // Canceled
    if (typeof chalk[colors.icons.canceled] === 'function') {
      color = colors.icons.canceled;
    } else {
      color = Config.instance.getDefault().colors.icons.canceled;
    }

    signaleOptions.types = Object.assign(signaleOptions.types, {
      canceled: {
        badge: figures.cross,
        color: color,
        label: 'error'
      }
    });
    this.colorCanceled = chalk[color];

    this.signale = new Signale(signaleOptions);
  }

  private get configuration(): any {
    return Config.instance.get();
  }

  private colorBoards(boards: any): any {
    return boards.map((x: any) => this.colorPale(x)).join(' ');
  }

  private isBoardComplete(items: Array<Item>): boolean {
    const { tasks, complete, notes } = this.getItemStats(items);
    return tasks === complete && notes === 0;
  }

  private getAge(birthday: number): string {
    const daytime: number = 24 * 60 * 60 * 1000;
    const age: number = Math.round(Math.abs(birthday - Date.now()) / daytime);
    return age === 0 ? '' : this.colorPale(`${age}d`);
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

  getDueDate(dueTimestamp: number): string {
    const now = new Date();
    const dueDate = toDate(dueTimestamp);

    const humanizedDate = this.getRelativeHumanizedDate(dueDate);
    const text = `(Due ${humanizedDate})`;

    const isSoon = isBefore(dueDate, addWeeks(now, 1));
    const isUrgent = isBefore(dueDate, endOfDay(now));

    if (isUrgent) {
      return this.colorHigh(underline(text));
    }

    if (isSoon) {
      return this.colorMedium(text);
    }

    return this.colorPale(text);
  }

  private getCorrelation(items: Array<Item>): string {
    const { tasks, complete } = this.getItemStats(items);
    return this.colorPale(`[${complete}/${tasks}]`);
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
    return item.isStarred ? this.colorStar('★') : '';
  }

  private buildTitle(key: string, items: Array<Item>): any {
    const title =
      key === new Date().toDateString() ? `${underline(key)} ${this.colorPale('[Today]')}` : underline(key);
    const correlation = this.getCorrelation(items);
    return {
      title,
      correlation
    };
  }

  private buildPrefix(item: Item): string {
    const prefix: Array<string> = [];

    prefix.push(' '.repeat(4 - String(item.id).length));
    prefix.push(this.colorPale(`${item.id}.`));

    return prefix.join(' ');
  }

  private getTaskColor(task: Task): string {
    const { colors } = this.configuration;
    if (task.priority === 1) {
      if (typeof chalk[colors.default] === 'function') {
        return colors.default; 
      } else {
        return Config.instance.getDefault().colors.default;
      }
    } else if (task.priority === 2) {
      if (typeof chalk[colors.task.priority.medium] === 'function') {
        return colors.task.priority.medium; 
      } else {
        return Config.instance.getDefault().colors.task.priority.medium;
      }
    } else {
      if (typeof chalk[colors.task.priority.high] === 'function') {
        return colors.task.priority.high;
      } else {
        return Config.instance.getDefault().colors.task.priority.high;
      }
    }
  }

  private buildMessage(item: Item): string {
    const message: Array<string> = [];

    if (item instanceof Task) {
      if (!item.isComplete && item.priority > 1) {
        message.push(underline[this.getTaskColor(item)](item.description));
      } else {
        message.push(item.isComplete ? this.colorPale(item.description) : item.description);
      }

      if (!item.isComplete && item.priority > 1) {
        message.push(item.priority === 2 ? this.colorMedium('(!)') : this.colorHigh('(!!)'));
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

    percent = percent >= 75 ? this.colorSuccess(`${percent}%`) : percent >= 50 ? this.colorMedium(`${percent}%`) : `${percent}%`;

    const status: Array<string> = [
      `${this.colorSuccess(complete)} ${this.colorPale('done')}`,
      `${this.colorCanceled(canceled)} ${this.colorPale('canceled')}`,
      `${this.colorProgress(inProgress)} ${this.colorPale('in-progress')}`,
      `${this.colorPending(pending)} ${this.colorPale('pending')}`,
      `${this.colorNote(notes)} ${this.colorPale(notes === 1 ? 'note' : 'notes')}`
    ];

    if (complete !== 0 && inProgress === 0 && pending === 0 && notes === 0) {
      this.signale.log({
        prefix: '\n ',
        message: 'All done!',
        suffix: this.colorStar('★')
      });
    }

    if (pending + inProgress + complete + notes === 0) {
      this.signale.log({
        prefix: '\n ',
        message: 'Type `tl --help` to get started!',
        suffix: this.colorStar('★')
      });
    }

    this.signale.log({
      prefix: '\n ',
      message: this.colorPale(`${percent} of all tasks complete.`)
    });
    this.signale.log({
      prefix: ' ',
      message: status.join(this.colorPale(' · ')),
      suffix: '\n'
    });
  }

  public markComplete(ids: Array<number>): void {
    this.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const [prefix, suffix] = ['\n', this.colorPale(ids.join(', '))];
    const message: string = `Checked ${ids.length > 1 ? 'tasks' : 'task'}:`;
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

    const [prefix, suffix] = ['\n', this.colorPale(ids.join(', '))];
    const message: string = `Unchecked ${ids.length > 1 ? 'tasks' : 'task'}:`;
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

    const [prefix, suffix] = ['\n', this.colorPale(ids.join(', '))];
    const message = `Started ${ids.length > 1 ? 'tasks' : 'task'}:`;
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

    const [prefix, suffix] = ['\n', this.colorPale(ids.join(', '))];
    const message = `Paused ${ids.length > 1 ? 'tasks' : 'task'}:`;
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

    const [prefix, suffix] = ['\n', this.colorPale(ids.join(', '))];
    const message = `Canceled ${ids.length > 1 ? 'tasks' : 'task'}:`;
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

    const [prefix, suffix] = ['\n', this.colorPale(ids.join(', '))];
    const message = `Revived ${ids.length > 1 ? 'tasks' : 'task'}:`;
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

    const [prefix, suffix] = ['\n', this.colorPale(ids.join(', '))];
    const message = `Starred ${ids.length > 1 ? 'items' : 'item'}:`;
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

    const [prefix, suffix] = ['\n', this.colorPale(ids.join(', '))];
    const message = `Unstarred ${ids.length > 1 ? 'items' : 'item'}:`;
    this.signale.success({
      prefix,
      message,
      suffix
    });
  }

  invalidCustomAppDir(path: string): void {
    this.stopLoading();
    const [prefix, suffix] = ['\n', this.colorHigh(path)];
    const message = 'Custom app directory was not found on your system:';
    this.signale.error({
      prefix,
      message,
      suffix
    });
  }

  invalidFirestoreConfig(): void {
    this.stopLoading();
    const [prefix, suffix] = ['\n', ''];
    const message = 'Firestore config contains error';
    this.signale.error({
      prefix,
      message,
      suffix
    });
  }

  public invalidID(id: number): void {
    this.stopLoading();
    const [prefix, suffix] = ['\n', this.colorPale(id)];
    const message = 'Unable to find item with id:';
    this.signale.error({
      prefix,
      message,
      suffix
    });
  }

  public invalidIDRange(range: string): void {
    this.stopLoading();
    const [prefix, suffix] = ['\n', this.colorPale(range)];
    const message = 'Unable to resolve ID range:';
    this.signale.error({
      prefix,
      message,
      suffix
    });
  }

  public invalidPriority(): void {
    this.stopLoading();
    const prefix = '\n';
    const message = 'Priority can only be 1, 2 or 3';
    this.signale.error({
      prefix,
      message
    });
  }

  public invalidDateFormat(date: string): void {
    this.stopLoading();
    const [prefix, suffix] = ['\n', this.colorPale(date)];
    const message = 'Unable to parse date:';
    this.signale.error({
      prefix,
      message,
      suffix
    });
  }

  public successCreate(item: Item): void {
    this.stopLoading();
    const [prefix, suffix] = ['\n', this.colorPale(item.id)];
    const message = `Created ${item.isTask ? 'task:' : 'note:'}`;
    this.signale.success({
      prefix,
      message,
      suffix
    });
  }

  public successEdit(id: number): void {
    this.stopLoading();
    const [prefix, suffix] = ['\n', this.colorPale(id)];
    const message = 'Updated description of item:';
    this.signale.success({
      prefix,
      message,
      suffix
    });
  }

  public successDelete(ids: Array<number>): void {
    this.stopLoading();
    const [prefix, suffix] = ['\n', this.colorPale(ids.join(', '))];
    const message: string = `Deleted ${ids.length > 1 ? 'items' : 'item'}:`;
    this.signale.success({
      prefix,
      message,
      suffix
    });
  }

  public successMove(ids: Array<number>, boards: Array<string>): void {
    this.stopLoading();
    const [prefix, suffix] = ['\n', this.colorPale(boards.join(', '))];
    const message: string = `Move item: ${this.colorPale(ids.join(', '))} to`;
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
    const message = `Updated priority of ${
      ids.length > 1 ? 'tasks' : 'task'
      }: ${this.colorPale(ids.join(', '))} to`;
    const suffix =
      priority === 3 ? this.colorHigh(TaskPriority[priority]) : priority === 2 ? this.colorMedium(TaskPriority[priority]) : this.colorSuccess(TaskPriority[priority]);
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
    const message = `Updated duedate of ${
      ids.length > 1 ? 'tasks' : 'task'
      }: ${this.colorPale(ids.join(', '))} to`;
    const suffix = dueDate;
    this.signale.success({
      prefix,
      message,
      suffix
    });
  }

  public successRestore(ids: Array<number>): void {
    this.stopLoading();
    const [prefix, suffix] = ['\n', this.colorPale(ids.join(', '))];
    const message = `Restored ${ids.length > 1 ? 'items' : 'item'}:`;
    this.signale.success({
      prefix,
      message,
      suffix
    });
  }

  public successCopyToClipboard(ids: Array<number>): void {
    this.stopLoading();
    const [prefix, suffix] = ['\n', this.colorPale(ids.join(', '))];
    const message = `Copied the ${
      ids.length > 1 ? 'descriptions of items' : 'description of item'
      }:`;
    this.signale.success({
      prefix,
      message,
      suffix
    });
  }

  public successRearrangeIDs(): void {
    this.stopLoading();
    const prefix = '\n';
    const message = `Rearranged ids of all items`;
    this.signale.success({
      prefix,
      message
    });
  }
}
