'use strict';
const IntlRelativeTimeFormat = require('@formatjs/intl-relativetimeformat')
  .default;
const relativeFormat = new IntlRelativeTimeFormat();

const chalk = require('chalk');
const signale = require('signale');
const ora = require('ora');
const addWeeks = require('date-fns/addWeeks');
const isBefore = require('date-fns/isBefore');
const endOfDay = require('date-fns/endOfDay');
const toDate = require('date-fns/toDate');
const config = require('./config');

signale.config({
  displayLabel: false
});

const { await: wait, error, log, note, pending, success } = signale;
const { blue, green, grey, magenta, red, underline, yellow } = chalk;

const priorities = {
  2: 'yellow',
  3: 'red'
};

class Render {
  get _configuration() {
    return config.get();
  }

  _colorBoards(boards) {
    return boards.map(x => grey(x)).join(' ');
  }

  _isBoardComplete(items) {
    const { tasks, complete, notes } = this._getItemStats(items);
    return tasks === complete && notes === 0;
  }

  _getAge(birthday) {
    const daytime = 24 * 60 * 60 * 1000;
    const age = Math.round(Math.abs((birthday - Date.now()) / daytime));
    return age === 0 ? '' : grey(`${age}d`);
  }

  _getDueDate(dueTimestamp) {
    const now = new Date();
    const dueDate = toDate(dueTimestamp);

    // get date diff
    const diffTime = dueDate.getTime() - now.getTime();
    const diffSeconds = Math.ceil(diffTime / 1000);
    let unit = '';
    let value = 0;
    // let isSoon = false;
    // let isUrgent = false;

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

    const humanizedDate = relativeFormat.format(value, unit);
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

  _getCorrelation(items) {
    const { tasks, complete } = this._getItemStats(items);
    return grey(`[${complete}/${tasks}]`);
  }

  _getItemStats(items) {
    let [tasks, complete, notes] = [0, 0, 0];

    items.forEach(item => {
      if (item._isTask) {
        tasks++;
        if (item.isComplete) {
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

  _getStar(item) {
    return item.isStarred ? yellow('★') : '';
  }

  _buildTitle(key, items) {
    const title =
      key === new Date().toDateString() ? `${underline(key)} ${grey('[Today]')}` : underline(key);
    const correlation = this._getCorrelation(items);
    return {
      title,
      correlation
    };
  }

  _buildPrefix(item) {
    const prefix = [];

    const { _id } = item;
    prefix.push(' '.repeat(4 - String(_id).length));
    prefix.push(grey(`${_id}.`));

    return prefix.join(' ');
  }

  _buildMessage(item) {
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

  _displayTitle(board, items) {
    const { title: message, correlation: suffix } = this._buildTitle(
      board,
      items
    );
    const titleObj = {
      prefix: '\n ',
      message,
      suffix
    };

    return log(titleObj);
  }

  _displayItemByBoard(item) {
    const { _isTask, isComplete, inProgress } = item;
    const age = this._getAge(item._timestamp);
    let dueDate;
    if (item.dueDate && !item.isComplete) {
      dueDate = this._getDueDate(item.dueDate);
    }

    const star = this._getStar(item);

    const prefix = this._buildPrefix(item);
    const message = this._buildMessage(item);
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
      return isComplete ? success(msgObj) : inProgress ? wait(msgObj) : pending(msgObj);
    }

    return note(msgObj);
  }

  _displayItemByDate(item) {
    const { _isTask, isComplete, inProgress } = item;
    const boards = item.boards.filter(x => x !== 'My Board');
    const star = this._getStar(item);

    const prefix = this._buildPrefix(item);
    const message = this._buildMessage(item);
    const suffix = `${this._colorBoards(boards)} ${star}`;

    const msgObj = {
      prefix,
      message,
      suffix
    };

    if (_isTask) {
      return isComplete ? success(msgObj) : inProgress ? wait(msgObj) : pending(msgObj);
    }

    return note(msgObj);
  }

  startLoading() {
    if (!this.spinner) {
      this.spinner = ora();
    }

    this.spinner.start();
  }

  stopLoading() {
    if (this.spinner) {
      this.spinner.stop();
    }
  }

  displayByBoard(data) {
    this.stopLoading();
    Object.keys(data).forEach(board => {
      if (
        this._isBoardComplete(data[board]) &&
        !this._configuration.displayCompleteTasks
      ) {
        return;
      }

      this._displayTitle(board, data[board]);
      data[board].forEach(item => {
        if (
          item._isTask &&
          item.isComplete &&
          !this._configuration.displayCompleteTasks
        ) {
          return;
        }

        this._displayItemByBoard(item);
      });
    });
  }

  displayByDate(data) {
    this.stopLoading();
    Object.keys(data).forEach(date => {
      if (
        this._isBoardComplete(data[date]) &&
        !this._configuration.displayCompleteTasks
      ) {
        return;
      }

      this._displayTitle(date, data[date]);
      data[date].forEach(item => {
        if (
          item._isTask &&
          item.isComplete &&
          !this._configuration.displayCompleteTasks
        ) {
          return;
        }

        this._displayItemByDate(item);
      });
    });
  }

  displayStats({ percent, complete, inProgress, pending, notes }) {
    if (!this._configuration.displayProgressOverview) {
      return;
    }

    percent =
      percent >= 75 ? green(`${percent}%`) : percent >= 50 ? yellow(`${percent}%`) : `${percent}%`;

    const status = [
      `${green(complete)} ${grey('done')}`,
      `${blue(inProgress)} ${grey('in-progress')}`,
      `${magenta(pending)} ${grey('pending')}`,
      `${blue(notes)} ${grey(notes === 1 ? 'note' : 'notes')}`
    ];

    if (complete !== 0 && inProgress === 0 && pending === 0 && notes === 0) {
      log({
        prefix: '\n ',
        message: 'All done!',
        suffix: yellow('★')
      });
    }

    if (pending + inProgress + complete + notes === 0) {
      log({
        prefix: '\n ',
        message: 'Type `tl --help` to get started!',
        suffix: yellow('★')
      });
    }

    log({
      prefix: '\n ',
      message: grey(`${percent} of all tasks complete.`)
    });
    log({
      prefix: ' ',
      message: status.join(grey(' · ')),
      suffix: '\n'
    });
  }

  invalidCustomAppDir(path) {
    this.stopLoading();
    const [prefix, suffix] = ['\n', red(path)];
    const message = 'Custom app directory was not found on your system:';
    error({
      prefix,
      message,
      suffix
    });
  }

  invalidFirestoreConfig() {
    this.stopLoading();
    const [prefix, suffix] = ['\n', ''];
    const message = 'Firestore config contains error';
    error({
      prefix,
      message,
      suffix
    });
  }

  invalidID(id) {
    this.stopLoading();
    const [prefix, suffix] = ['\n', grey(id)];
    const message = 'Unable to find item with id:';
    error({
      prefix,
      message,
      suffix
    });
  }

  invalidIDRange(range) {
    this.stopLoading();
    const [prefix, suffix] = ['\n', grey(range)];
    const message = 'Unable to resolve ID range:';
    error({
      prefix,
      message,
      suffix
    });
  }

  invalidPriority() {
    this.stopLoading();
    const prefix = '\n';
    const message = 'Priority can only be 1, 2 or 3';
    error({
      prefix,
      message
    });
  }

  invalidDateFormat(date) {
    this.stopLoading();
    const [prefix, suffix] = ['\n', grey(date)];
    const message = 'Unable to parse date:';
    error({
      prefix,
      message,
      suffix
    });
  }

  markComplete(ids) {
    this.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const [prefix, suffix] = ['\n', grey(ids.join(', '))];
    const message = `Checked ${ids.length > 1 ? 'tasks' : 'task'}:`;
    success({
      prefix,
      message,
      suffix
    });
  }

  markIncomplete(ids) {
    this.stopLoading();
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

  markStarted(ids) {
    this.stopLoading();
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

  markPaused(ids) {
    this.stopLoading();
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

  markStarred(ids) {
    this.stopLoading();
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

  markUnstarred(ids) {
    this.stopLoading();
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

  successCreate({ _id, _isTask }) {
    this.stopLoading();
    const [prefix, suffix] = ['\n', grey(_id)];
    const message = `Created ${_isTask ? 'task:' : 'note:'}`;
    success({
      prefix,
      message,
      suffix
    });
  }

  successEdit(id) {
    this.stopLoading();
    const [prefix, suffix] = ['\n', grey(id)];
    const message = 'Updated description of item:';
    success({
      prefix,
      message,
      suffix
    });
  }

  successDelete(ids) {
    this.stopLoading();
    const [prefix, suffix] = ['\n', grey(ids.join(', '))];
    const message = `Deleted ${ids.length > 1 ? 'items' : 'item'}:`;
    success({
      prefix,
      message,
      suffix
    });
  }

  successMove(ids, boards) {
    this.stopLoading();
    const [prefix, suffix] = ['\n', grey(boards.join(', '))];
    const message = `Move item: ${grey(ids.join(', '))} to`;
    success({
      prefix,
      message,
      suffix
    });
  }

  successPriority(ids, level) {
    this.stopLoading();
    if (ids.length === 0) {
      return;
    }

    const prefix = '\n';
    const message = `Updated priority of ${
      ids.length > 1 ? 'tasks' : 'task'
    }: ${grey(ids.join(', '))} to`;
    const suffix =
      level === 3 ? red('high') : level === 2 ? yellow('medium') : green('normal');
    success({
      prefix,
      message,
      suffix
    });
  }

  successDueDate(ids, dueDate) {
    this.stopLoading();
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

  successRestore(ids) {
    this.stopLoading();
    const [prefix, suffix] = ['\n', grey(ids.join(', '))];
    const message = `Restored ${ids.length > 1 ? 'items' : 'item'}:`;
    success({
      prefix,
      message,
      suffix
    });
  }

  successCopyToClipboard(ids) {
    this.stopLoading();
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

module.exports = new Render();
