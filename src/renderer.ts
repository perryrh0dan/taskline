import { Chalk } from 'chalk';
import { Signale } from 'signale';
import { Ora } from 'ora';
import { addWeeks, isBefore, endOfDay, toDate } from 'date-fns';
import { Config } from './config';
import ora = require('ora');
import { Item } from './item';
import { TaskPriority } from './task';

const signal = new Signale({
  config: {
    displayLabel: false;
  }
})

const { await: wait, error, log, note, pending, success, fatal } = signale;
const { blue, green, grey, magenta, red, underline, yellow } = chalk;

const priorities = {
  2: 'yellow',
  3: 'red'
};

export class Renderer {
  private static _instance: Renderer
  private spinner: Ora;

  public static get instance() {
    if (!this._instance) {
      this._instance = new Renderer();
    }

    return this._instance;
  }

  private constructor() {
    this.spinner = ora();
  }

  private get configuration() {
    return Config.instance.get();
  }

  private colorBoards(boards) {
    return boards.map(x => grey(x)).join(' ');
  }

  public startLoading() {
    this.spinner.start();
  }

  public stopLoading() {
    this.spinner.stop();
  }

  public markComplete(ids: Array<number>) {
    Renderer.instance.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const [prefix, suffix] = ['\n', grey(ids.join(', '))];
    const message = `Checked ${ids.length > 1 ? 'tasks' : 'task'}:`;
    success({
      prefix,
      message,
      suffix
    })
  }

  public markInComplete(ids: Array<number>) {
    Renderer.instance.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const [prefix, suffix] = ['\n', grey(ids.join(', '))];
    const message = `Unchecked ${ids.length > 1 ? 'tasks' : 'task'}:`;
    success({
      prefix,
      message,
      suffix
    });
  }

  public markStarted(ids: Array<number>) {
    Renderer.instance.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const [prefix, suffix] = ['\n', grey(ids.join(', '))];
    const message = `Started ${ids.length > 1 ? 'tasks' : 'task'}:`;
    success({
      prefix,
      message,
      suffix
    });
  }

  public markPaused(ids: Array<number>) {
    Renderer.instance.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const [prefix, suffix] = ['\n', grey(ids.join(', '))];
    const message = `Paused ${ids.length > 1 ? 'tasks' : 'task'}:`;
    success({
      prefix,
      message,
      suffix
    });
  }

  public markCanceled(ids: Array<number>) {
    Renderer.instance.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const [prefix, suffix] = ['\n', grey(ids.join(', '))];
    const message = `Canceled ${ids.length > 1 ? 'tasks' : 'task'}:`;
    success({
      prefix,
      message,
      suffix
    });
  }

  public markRevived(ids: Array<number>) {
    Renderer.instance.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const [prefix, suffix] = ['\n', grey(ids.join(', '))];
    const message = `Revived ${ids.length > 1 ? 'tasks' : 'task'}:`;
    success({
      prefix,
      message,
      suffix
    });
  }

  public markStarred(ids: Array<number>) {
    Renderer.instance.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const [prefix, suffix] = ['\n', grey(ids.join(', '))];
    const message = `Starred ${ids.length > 1 ? 'items' : 'item'}:`;
    success({
      prefix,
      message,
      suffix
    });
  }

  public markUnstarred(ids: Array<number>) {
    Renderer.instance.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const [prefix, suffix] = ['\n', grey(ids.join(', '))];
    const message = `Unstarred ${ids.length > 1 ? 'items' : 'item'}:`;
    success({
      prefix,
      message,
      suffix
    });
  }

  public successCreate(item: Item) {
    Renderer.instance.stopLoading();
    const [prefix, suffix] = ['\n', grey(item.id)];
    const message = `Created ${item.isTask ? 'task:' : 'note:'}`;
    success({
      prefix,
      message,
      suffix
    });
  }

  public successEdit(id: number) {
    Renderer.instance.stopLoading();
    const [prefix, suffix] = ['\n', grey(id)];
    const message = 'Updated description of item:';
    success({
      prefix,
      message,
      suffix
    });
  }

  public successDelete(ids: Array<number>) {
    Renderer.instance.stopLoading();
    const [prefix, suffix] = ['\n', grey(ids.join(', '))];
    const message = `Deleted ${ids.length > 1 ? 'items' : 'item'}:`;
    success({
      prefix,
      message,
      suffix
    });
  }

  public successPriority(ids: Array<number>, priority: TaskPriority) {
    Renderer.instance.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const prefix = '\n';
    const message = `Updated priority of ${
      ids.length > 1 ? 'tasks' : 'task'
      }: ${grey(ids.join(', '))} to`;
    const suffix =
      priority === 3 ? red(priority.toString()) : priority === 2 ? yellow(priority.toString()) : green(priority.toString());
    success({
      prefix,
      message,
      suffix
    });
  }

  public successDueDate(ids: Array<number>, dueDate: number) {
    Renderer.instance.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const prefix = '\n';
    const message = `Updated duedate of ${
      ids.length > 1 ? 'tasks' : 'task'
    }: ${grey(ids.join(', '))} to`;
    const suffix = dueDate;
    success({
      prefix,
      message,
      suffix
    });
  }

  public successRestore(ids: Array<number>) {
    Renderer.instance.stopLoading();
    const [prefix, suffix] = ['\n', grey(ids.join(', '))];
    const message = `Restored ${ids.length > 1 ? 'items' : 'item'}:`;
    success({
      prefix,
      message,
      suffix
    });
  }

  public successCopyToClipboard(ids: Array<number>) {
    Renderer.instance.stopLoading();
    const [prefix, suffix] = ['\n', grey(ids.join(', '))];
    const message = `Copied the ${
      ids.length > 1 ? 'descriptions of items' : 'description of item'
    }:`;
    success({
      prefix,
      message,
      suffix
    });
  }
}