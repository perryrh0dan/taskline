#!/usr/bin/env node

'use strict';
const clipboardy = require('clipboardy');
const Task = require('./task');
const Note = require('./note');
const LocalStorage = require('./local');
const render = require('./render');
const FirestoreStorage = require('./firestore');
const config = require('./config');

class Taskline {
  constructor() {
    const { storageModule } = config.get();
    if (storageModule === 'firestore') {
      this._storage = FirestoreStorage.getInstance();
    } else if (storageModule === 'local') {
      this._storage = LocalStorage.getInstance();
    }
  }

  _getData() {
    return this._storage.get();
  }

  _getArchive() {
    return this._storage.getArchive();
  }

  _arrayify(x) {
    return Array.isArray(x) ? x : [x];
  }

  _save(data) {
    return this._storage.set(data);
  }

  _saveArchive(data) {
    return this._storage.setArchive(data);
  }

  _removeDuplicates(x) {
    return [...new Set(this._arrayify(x))];
  }

  async _generateID(data) {
    if (!data) {
      data = await this._getData();
    }

    const ids = Object.keys(data).map(id => parseInt(id, 10));
    const max = ids.length === 0 ? 0 : Math.max(...ids);
    return max + 1;
  }

  async _validateIDs(inputIDs, existingIDs) {
    if (!existingIDs) {
      existingIDs = await this._getIDs();
    }

    inputIDs = this._removeDuplicates(inputIDs);

    try {
      inputIDs.forEach(id => {
        if (existingIDs.indexOf(Number(id)) === -1) {
          render.invalidID(id);
          throw new Error('Invalid InputIds');
        }
      });
    } catch (error) {
      return Promise.reject(new Error('Invalid InputIDs'));
    }

    return inputIDs;
  }

  async _getBoards() {
    const data = await this._getData();
    const boards = ['My Board'];

    Object.keys(data).forEach(id => {
      boards.push(...data[id].boards.filter(x => boards.indexOf(x) === -1));
    });

    return boards;
  }

  async _getDates(data) {
    if (!data) {
      data = await this._getData();
    }

    const dates = [];

    Object.keys(data).forEach(id => {
      if (dates.indexOf(data[id]._date) === -1) {
        dates.push(data[id]._date);
      }
    });

    return dates;
  }

  async _getIDs(data) {
    if (!data) {
      data = await this._getData();
    }

    return Object.keys(data).map(id => parseInt(id, 10));
  }

  _parseDate(input, format) {
    format = format || 'yyyy-mm-dd'; // Default format
    const parts = input.match(/(\d+)/g);
    let i = 0;
    const fmt = {};
    // Extract date-part indexes from the format
    format.replace(/(yyyy|dd|mm)/g, part => {
      fmt[part] = i++;
    });

    return new Date(parts[fmt.yyyy], parts[fmt.mm] - 1, parts[fmt.dd]);
  }

  _getStats(grouped) {
    let [complete, inProgress, pending, notes] = [0, 0, 0, 0];

    Object.keys(grouped).forEach(group => {
      grouped[group].forEach(item => {
        if (item._isTask) {
          return item.isComplete ? complete++ : item.inProgress ? inProgress++ : pending++;
        }

        return notes++;
      });
    });

    const total = complete + pending + inProgress;
    const percent = total === 0 ? 0 : Math.floor((complete * 100) / total);

    return {
      percent,
      complete,
      inProgress,
      pending,
      notes
    };
  }

  _hasTerms(string, terms) {
    for (const term of terms) {
      if (string.toLocaleLowerCase().indexOf(term.toLocaleLowerCase()) > -1) {
        return string;
      }
    }
  }

  _filterTask(data) {
    Object.keys(data).forEach(id => {
      if (!data[id]._isTask) {
        delete data[id];
      }
    });
    return data;
  }

  _filterStarred(data) {
    Object.keys(data).forEach(id => {
      if (!data[id].isStarred) {
        delete data[id];
      }
    });
    return data;
  }

  _filterInProgress(data) {
    Object.keys(data).forEach(id => {
      if (!data[id]._isTask || !data[id].inProgress) {
        delete data[id];
      }
    });
    return data;
  }

  _filterComplete(data) {
    Object.keys(data).forEach(id => {
      if (!data[id]._isTask || !data[id].isComplete) {
        delete data[id];
      }
    });
    return data;
  }

  _filterPending(data) {
    Object.keys(data).forEach(id => {
      if (!data[id]._isTask || data[id].isComplete) {
        delete data[id];
      }
    });
    return data;
  }

  _filterNote(data) {
    Object.keys(data).forEach(id => {
      if (data[id]._isTask) {
        delete data[id];
      }
    });
    return data;
  }

  _filterPriority(data, priority) {
    const prio = priority === 'default' ? 1 : (priority === 'medium' ? 2 : 3);
    Object.keys(data).forEach(id => {
      if (data[id].priority !== prio) {
        delete data[id];
      }
    });
    return data;
  }

  async _filterByAttributes(attr) {
    let data = await this._getData();

    if (Object.keys(data).length === 0) {
      return data;
    }

    attr.forEach(x => {
      switch (x) {
        case 'star':
        case 'starred':
          data = this._filterStarred(data);
          break;

        case 'done':
        case 'checked':
        case 'complete':
          data = this._filterComplete(data);
          break;

        case 'progress':
        case 'started':
        case 'begun':
          data = this._filterInProgress(data);
          break;

        case 'pending':
        case 'unchecked':
        case 'incomplete':
          data = this._filterPending(data);
          break;

        case 'todo':
        case 'task':
        case 'tasks':
          data = this._filterTask(data);
          break;

        case 'note':
        case 'notes':
          data = this._filterNote(data);
          break;

        case 'default':
        case 'medium':
        case 'high':
          data = this._filterPriority(data, x);
          break;

        default:
          break;
      }
    });

    return data;
  }

  async _groupByBoard(data, boards) {
    if (!data) {
      data = await this._getData();
    }

    if (!boards) {
      boards = await this._getBoards();
    }

    const grouped = {};

    if (boards.length === 0) {
      boards = await this._getBoards();
    }

    Object.keys(data).forEach(id => {
      boards.forEach(board => {
        if (data[id].boards.includes(board)) {
          if (Array.isArray(grouped[board])) {
            return grouped[board].push(data[id]);
          }

          grouped[board] = [data[id]];
          return grouped[board];
        }
      });
    });

    return grouped;
  }

  async _groupByDate(data, dates) {
    if (!data) {
      data = await this._getData();
    }

    if (!dates) {
      dates = await this._getDates();
    }

    const grouped = {};

    Object.keys(data).forEach(id => {
      dates.forEach(date => {
        if (data[id]._date === date) {
          if (Array.isArray(grouped[date])) {
            return grouped[date].push(data[id]);
          }

          grouped[date] = [data[id]];
          return grouped[date];
        }
      });
    });

    return grouped;
  }

  async _saveItemsToArchive(ids) {
    const data = await this._getData();
    const archive = await this._getArchive();

    for (const id of ids) {
      const archiveID = await this._generateID(archive); // eslint-disable-line no-await-in-loop
      const item = data[id];
      item._id = archiveID;
      archive[archiveID] = item;
    }

    await this._saveArchive(archive);
  }

  async _saveItemsToStorage(ids) {
    const archive = await this._getArchive();
    const data = await this._getData();

    for (const id of ids) {
      const restoreID = await this._generateID(data); // eslint-disable-line no-await-in-loop
      const item = archive[id];
      item._id = restoreID;
      data[restoreID] = item;
    }

    await this._save(data);
  }

  _splitOption(option) {
    if (!Array.isArray(option)) {
      const options = option.split(',');
      return options;
    }

    return option;
  }

  async createNote(description, boards = 'My Board') {
    render.startLoading();
    const id = await this._generateID();
    const data = await this._getData();

    boards = this._splitOption(boards);

    const note = new Note({
      id,
      description,
      boards
    });
    data[id] = note;
    await this._save(data);
    render.successCreate(note);
  }

  async copyToClipboard(ids) {
    render.startLoading();
    ids = this._splitOption(ids);

    const data = await this._getData();

    ids = await this._validateIDs(ids).catch(() => {
      return Promise.reject(new Error('Invalid InputIDs'));
    });

    const descriptions = [];

    ids.forEach(id => descriptions.push(data[id].description));

    clipboardy.writeSync(descriptions.join('\n'));
    render.successCopyToClipboard(ids);
  }

  async checkTasks(ids) {
    render.startLoading();
    const data = await this._getData();

    ids = this._splitOption(ids);
    ids = await this._validateIDs(ids).catch(() => {
      return Promise.reject(new Error('Invalid InputIDs'));
    });

    const [checked, unchecked] = [[], []];

    ids.forEach(id => {
      if (data[id]._isTask) {
        data[id].inProgress = false;
        data[id].isComplete = !data[id].isComplete;
        return data[id].isComplete ? checked.push(id) : unchecked.push(id);
      }
    });

    await this._save(data);
    render.markComplete(checked);
    render.markIncomplete(unchecked);
  }

  async beginTasks(ids) {
    render.startLoading();
    const data = await this._getData();

    ids = this._splitOption(ids);
    ids = await this._validateIDs(ids).catch(() => {
      return Promise.reject(new Error('Invalid InputIDs'));
    });

    const [started, paused] = [[], []];

    ids.forEach(id => {
      if (data[id]._isTask) {
        data[id].isComplete = false;
        data[id].inProgress = !data[id].inProgress;
        return data[id].inProgress ? started.push(id) : paused.push(id);
      }
    });

    await this._save(data);
    render.markStarted(started);
    render.markPaused(paused);
  }

  async createTask(
    description,
    boards = 'My Board',
    priority = 1,
    dueDate = null
  ) {
    render.startLoading();
    const id = await this._generateID();
    const data = await this._getData();
    const { dateformat } = config.get();

    priority = Number(priority);
    boards = this._splitOption(boards);

    let dueTime;
    if (dueDate) {
      dueDate = this._parseDate(dueDate, dateformat);
      dueDate.setHours(23, 59, 59);
      dueTime = dueDate.getTime();
    }

    const task = new Task({
      id,
      description,
      boards,
      priority,
      dueTime
    });
    data[id] = task;
    await this._save(data);
    render.successCreate(task);
  }

  async deleteItems(ids) {
    render.startLoading();
    const data = await this._getData();

    ids = this._splitOption(ids);
    ids = await this._validateIDs(ids).catch(() => {
      return Promise.reject(new Error('Invalid InputIDs'));
    });

    await this._saveItemsToArchive(ids);

    ids.forEach(id => {
      delete data[id];
    });

    await this._save(data);
    render.successDelete(ids);
  }

  async displayArchive() {
    render.startLoading();
    const archive = await this._getArchive();
    const dates = await this._getDates(archive);

    const grouped = await this._groupByDate(archive, dates);

    render.displayByDate(grouped);
  }

  async displayByBoard() {
    render.startLoading();
    const grouped = await this._groupByBoard();
    render.displayByBoard(grouped);
    return grouped;
  }

  async displayByDate() {
    render.startLoading();
    const grouped = await this._groupByDate();
    render.displayByDate(grouped);
    return grouped;
  }

  displayStats(grouped) {
    const states = this._getStats(grouped);
    render.displayStats(states);
  }

  async editDescription(id, description) {
    render.startLoading();

    id = await this._validateIDs(id).catch(() => {
      return Promise.reject(new Error('Invalid InputIDs'));
    });

    const data = await this._getData();

    data[id].description = description;
    await this._save(data);
    render.successEdit(id);
  }

  async findItems(terms) {
    render.startLoading();
    terms = this._splitOption(terms);
    const data = await this._getData();
    const result = {};

    Object.keys(data).forEach(id => {
      if (!this._hasTerms(data[id].description, terms)) {
        return;
      }

      result[id] = data[id];
    });

    const grouped = await this._groupByBoard(result);
    render.displayByBoard(grouped);
  }

  async listByAttributes(terms) {
    render.startLoading();
    terms = this._splitOption(terms);
    let [boards, attributes] = [[], []];
    const storedBoards = await this._getBoards();

    terms.forEach(x => {
      if (storedBoards.indexOf(x) === -1) {
        return x === 'myboard' ? boards.push('My Board') : attributes.push(x);
      }

      return boards.push(x);
    });

    [boards, attributes] = [boards, attributes].map(x =>
      this._removeDuplicates(x)
    );

    const data = await this._filterByAttributes(attributes);
    const grouped = await this._groupByBoard(data, boards);
    render.displayByBoard(grouped);
    return grouped;
  }

  async moveBoards(ids, boards) {
    render.startLoading();
    boards = this._splitOption(boards);

    ids = this._splitOption(ids);
    ids = await this._validateIDs(ids).catch(() => {
      return Promise.reject(new Error('Invalid InputIDs'));
    });

    boards = this._removeDuplicates(boards);

    const data = await this._getData();

    ids.forEach(id => {
      data[id].boards = boards;
    });
    await this._save(data);
    render.successMove(ids, boards);
  }

  async restoreItems(ids) {
    render.startLoading();
    const archive = await this._getArchive();
    const existingIDs = await this._getIDs(archive);

    ids = this._splitOption(ids);
    ids = await this._validateIDs(ids, existingIDs).catch(() => {
      return Promise.reject(new Error('Invalid InputIDs'));
    });

    await this._saveItemsToStorage(ids);

    ids.forEach(id => {
      delete archive[id];
    });

    await this._saveArchive(archive);
    render.successRestore(ids);
  }

  async starItems(ids) {
    render.startLoading();

    ids = this._splitOption(ids);
    ids = await this._validateIDs(ids).catch(() => {
      return Promise.reject(new Error('Invalid InputIDs'));
    });

    const data = await this._getData();

    const [starred, unstarred] = [[], []];

    ids.forEach(id => {
      data[id].isStarred = !data[id].isStarred;
      return data[id].isStarred ? starred.push(id) : unstarred.push(id);
    });

    await this._save(data);
    render.markStarred(starred);
    render.markUnstarred(unstarred);
  }

  async updatePriority(ids, priority) {
    render.startLoading();
    let level = ['1', '2', '3'].indexOf(priority) > -1 ? priority : null;
    level = Number(level);

    if (!level) {
      render.invalidPriority();
      return Promise.reject(new Error('Invalid Priority'));
    }

    ids = this._splitOption(ids);
    ids = await this._validateIDs(ids).catch(() => {
      return Promise.reject(new Error('Invalid InputIDs'));
    });

    const data = await this._getData();
    const updated = [];

    ids.forEach(id => {
      if (data[id]._isTask) {
        data[id].priority = level;
        return updated.push(id);
      }
    });

    await this._save(data);
    render.successPriority(updated, level);
  }

  async updateDueDate(ids, dueDate) {
    render.startLoading();
    const { dateformat } = config.get();

    ids = this._splitOption(ids);
    ids = await this._validateIDs(ids).catch(() => {
      return Promise.reject(new Error('Invalid InputIDs'));
    });

    const data = await this._getData();
    let dueTime;

    try {
      dueDate = this._parseDate(dueDate, dateformat);
      dueDate.setHours(23, 59, 59);
      dueTime = dueDate.getTime();
    } catch (error) {
      render.invalidDateFormat();
      return Promise.reject(new Error('Invalid Date Format'));
    }

    const updated = [];

    ids.forEach(id => {
      if (data[id]._isTask) {
        data[id].dueDate = dueTime;
        return updated.push(id);
      }
    });

    await this._save(data);
    render.successDueDate(updated, dueDate);
  }

  async clear() {
    render.startLoading();
    const data = await this._getData();

    const ids = [];

    Object.keys(data).forEach(id => {
      if (data[id].isComplete) {
        ids.push(id);
      }
    });

    if (ids.length === 0) {
      render.stopLoading();
      return;
    }

    await this.deleteItems(ids);
  }
}

module.exports = Taskline;
