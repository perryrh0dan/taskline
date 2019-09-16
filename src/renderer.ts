import { Signale } from 'signale';
import { Ora } from 'ora';
import { addWeeks, isBefore, endOfDay, toDate } from 'date-fns';

const chalk = require('chalk');

import { Config } from './config';
import ora = require('ora');
import { Item } from './item';
import { TaskPriority, Task } from './task';

const signale = new Signale({
  config: {
    displayLabel: false
  }
})

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

  private isBoardComplete(items) {
    const { tasks, complete, notes } = this.getItemStats(items);
    return tasks === complete && notes === 0;
  }

  private getAge(birthday) {
    const daytime = 24 * 60 * 60 * 1000;
    const age = Math.round(Math.abs(birthday - Date.now()) / daytime);
    return age === 0 ? '' : grey(`${age}d`);
  }

  private getRelativeHumanizedDate(dueDate: Date, now?: Date) {
    if (!now) now = new Date();

    // get date diff
    const diffTime = dueDate.getTime() - now.getTime();
    const diffSeconds = Math.ceil(diffTime / 1000);
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

  getDueDate(dueTimestamp: number) {
    const now = new Date();
    const dueDate = toDate(dueTimestamp);

    const humanizedDate = this.getRelativeHumanizedDate(dueDate);
    const text = `(Due ${humanizedDate})`;

    const isSoon = isBefore(dueDate, addWeeks(now, 1));
    const isUrgent = isBefore(dueDate, endOfDay(now));

    if (isUrgent) {
      return red(underline(text));
    }

    if (isSoon) {
      return yellow(text);
    }

    return grey(text);
  }

  private getCorrelation(items: Array<Item>) {
    const { tasks, complete } = this.getItemStats(items);
    return grey(`[${complete}/${tasks}]`);
  }

  private getItemStats(items: Array<Item>) {
    let [tasks, complete, notes] = [0, 0, 0];

    items.forEach(item => {
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

  private getStar(item) {
    return item.isStarred ? yellow('★') : '';
  }

  private buildTitle(key: string, items: Array<Item>) {
    const title =
      key === new Date().toDateString() ? `${underline(key)} ${grey('[Today]')}` : underline(key);
    const correlation = this.getCorrelation(items);
    return {
      title,
      correlation
    };
  }

  private buildPrefix(item) {
    const prefix = [];

    const { _id } = item;
    prefix.push(' '.repeat(4 - String(_id).length));
    prefix.push(grey(`${_id}.`));

    return prefix.join(' ');
  }

  private buildMessage(item) {
    const message = [];

    const { isComplete, description } = item;
    const priority = parseInt(item.priority, 10);

    if (!isComplete && priority > 1) {
      message.push(underline[priorities[priority]](description));
    } else {
      message.push(isComplete ? grey(description) : description);
    }

    if (!isComplete && priority > 1) {
      message.push(priority === 2 ? yellow('(!)') : red('(!!)'));
    }

    return message.join(' ');
  }

  private displayTitle(board: string, items: Array<Item>) {
    const { title: message, correlation: suffix } = this.buildTitle(
      board,
      items
    );
    const titleObj = {
      prefix: '\n ',
      message,
      suffix
    };

    return signale.log(titleObj);
  }

  private displayItemByBoard(item) {
    const { _isTask, isComplete, inProgress, isCanceled } = item;
    const age = this.getAge(item._timestamp);
    let dueDate;
    if (item.dueDate && !item.isComplete) {
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

    if (_isTask) {
      return isComplete ? signale.success(msgObj) : inProgress ? signale.await(msgObj) : isCanceled ? signale.fatal(msgObj) : signale.pending(msgObj);
    }

    return signale.note(msgObj);
  }

  private displayItemByDate(item) {
    const { _isTask, isComplete, inProgress, isCanceled } = item;
    const boards = item.boards.filter(x => x !== 'My Board');
    const star = this.getStar(item);

    const prefix = this.buildPrefix(item);
    const message = this.buildMessage(item);
    const suffix = `${this.colorBoards(boards)} ${star}`;

    const msgObj = {
      prefix,
      message,
      suffix
    };

    if (_isTask) {
      return isComplete ? signale.success(msgObj) : inProgress ? signale.await(msgObj) : isCanceled ? signale.fatal(msgObj) : signale.pending(msgObj);
    }

    return signale.note(msgObj);
  }

  public startLoading() {
    this.spinner.start();
  }

  public stopLoading() {
    this.spinner.stop();
  }

  public displayByBoard(data) {
    this.stopLoading();
    Object.keys(data).forEach(board => {
      if (
        this.isBoardComplete(data[board]) &&
        !this.configuration.displayCompleteTasks
      ) {
        return;
      }

      this.displayTitle(board, data[board]);
    })
  }

  public displayByDate(data) {
    this.stopLoading();
  }

  public markComplete(ids: Array<number>) {
    this.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const [prefix, suffix] = ['\n', grey(ids.join(', '))];
    const message = `Checked ${ids.length > 1 ? 'tasks' : 'task'}:`;
    signale.success({
      prefix,
      message,
      suffix
    })
  }

  public markInComplete(ids: Array<number>) {
    this.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const [prefix, suffix] = ['\n', grey(ids.join(', '))];
    const message = `Unchecked ${ids.length > 1 ? 'tasks' : 'task'}:`;
    signale.success({
      prefix,
      message,
      suffix
    });
  }

  public markStarted(ids: Array<number>) {
    this.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const [prefix, suffix] = ['\n', grey(ids.join(', '))];
    const message = `Started ${ids.length > 1 ? 'tasks' : 'task'}:`;
    signale.success({
      prefix,
      message,
      suffix
    });
  }

  public markPaused(ids: Array<number>) {
    this.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const [prefix, suffix] = ['\n', grey(ids.join(', '))];
    const message = `Paused ${ids.length > 1 ? 'tasks' : 'task'}:`;
    signale.success({
      prefix,
      message,
      suffix
    });
  }

  public markCanceled(ids: Array<number>) {
    this.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const [prefix, suffix] = ['\n', grey(ids.join(', '))];
    const message = `Canceled ${ids.length > 1 ? 'tasks' : 'task'}:`;
    signale.success({
      prefix,
      message,
      suffix
    });
  }

  public markRevived(ids: Array<number>) {
    this.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const [prefix, suffix] = ['\n', grey(ids.join(', '))];
    const message = `Revived ${ids.length > 1 ? 'tasks' : 'task'}:`;
    signale.success({
      prefix,
      message,
      suffix
    });
  }

  public markStarred(ids: Array<number>) {
    this.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const [prefix, suffix] = ['\n', grey(ids.join(', '))];
    const message = `Starred ${ids.length > 1 ? 'items' : 'item'}:`;
    signale.success({
      prefix,
      message,
      suffix
    });
  }

  public markUnstarred(ids: Array<number>) {
    this.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const [prefix, suffix] = ['\n', grey(ids.join(', '))];
    const message = `Unstarred ${ids.length > 1 ? 'items' : 'item'}:`;
    signale.success({
      prefix,
      message,
      suffix
    });
  }

  public invalidID(id) {
    this.stopLoading();
    const [prefix, suffix] = ['\n', grey(id)];
    const message = 'Unable to find item with id:';
    signale.error({
      prefix,
      message,
      suffix
    });
  }

  public invalidIDRange(range) {
    this.stopLoading();
    const [prefix, suffix] = ['\n', grey(range)];
    const message = 'Unable to resolve ID range:';
    signale.error({
      prefix,
      message,
      suffix
    });
  }

  public invalidPriority() {
    this.stopLoading();
    const prefix = '\n';
    const message = 'Priority can only be 1, 2 or 3';
    signale.error({
      prefix,
      message
    });
  }

  public invalidDateFormat(date) {
    this.stopLoading();
    const [prefix, suffix] = ['\n', grey(date)];
    const message = 'Unable to parse date:';
    signale.error({
      prefix,
      message,
      suffix
    });
  }

  public successCreate(item: Item) {
    this.stopLoading();
    const [prefix, suffix] = ['\n', grey(item.id)];
    const message = `Created ${item.isTask ? 'task:' : 'note:'}`;
    signale.success({
      prefix,
      message,
      suffix
    });
  }

  public successEdit(id: number) {
    this.stopLoading();
    const [prefix, suffix] = ['\n', grey(id)];
    const message = 'Updated description of item:';
    signale.success({
      prefix,
      message,
      suffix
    });
  }

  public successDelete(ids: Array<number>) {
    this.stopLoading();
    const [prefix, suffix] = ['\n', grey(ids.join(', '))];
    const message = `Deleted ${ids.length > 1 ? 'items' : 'item'}:`;
    signale.success({
      prefix,
      message,
      suffix
    });
  }

  public successPriority(ids: Array<number>, priority: TaskPriority) {
    this.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const prefix = '\n';
    const message = `Updated priority of ${
      ids.length > 1 ? 'tasks' : 'task'
      }: ${grey(ids.join(', '))} to`;
    const suffix =
      priority === 3 ? red(priority.toString()) : priority === 2 ? yellow(priority.toString()) : green(priority.toString());
    signale.success({
      prefix,
      message,
      suffix
    });
  }

  public successDueDate(ids: Array<number>, dueDate: Date) {
    this.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const prefix = '\n';
    const message = `Updated duedate of ${
      ids.length > 1 ? 'tasks' : 'task'
      }: ${grey(ids.join(', '))} to`;
    const suffix = dueDate;
    signale.success({
      prefix,
      message,
      suffix
    });
  }

  public successRestore(ids: Array<number>) {
    this.stopLoading();
    const [prefix, suffix] = ['\n', grey(ids.join(', '))];
    const message = `Restored ${ids.length > 1 ? 'items' : 'item'}:`;
    signale.success({
      prefix,
      message,
      suffix
    });
  }

  public successCopyToClipboard(ids: Array<number>) {
    this.stopLoading();
    const [prefix, suffix] = ['\n', grey(ids.join(', '))];
    const message = `Copied the ${
      ids.length > 1 ? 'descriptions of items' : 'description of item'
      }:`;
    signale.success({
      prefix,
      message,
      suffix
    });
  }
}