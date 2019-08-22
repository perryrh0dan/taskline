#!/usr/bin/env node

"use strict";
const clipboardy = require("clipboardy");
const Task = require("./task");
const Note = require("./note");
const LocalStorage = require("./local");
const render = require("./render");
const FirebaseStorage = require("./firebase");
const config = require("./config")

class Taskbook {
  constructor() {
    const {
      storageModule
    } = config.get();
    if (storageModule === "firestore") {
      this._storage = new FirebaseStorage();
    } else {
      this._storage = new LocalStorage();
    }
  }

  get _archive() {
    return this._storage.getArchive();
  }

  get _data() {
    return this._storage.get();
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
    this._storage.set(data);
  }

  _saveArchive(data) {
    this._storage.setArchive(data);
  }

  _removeDuplicates(x) {
    return [...new Set(this._arrayify(x))];
  }

  async _generateID() {
    let data = await this._getData();
    const ids = Object.keys(data).map(id => parseInt(id, 10));
    const max = ids.length === 0 ? 0 : Math.max(...ids);
    return max + 1;
  }

  async _validateIDs(inputIDs) {
    let existingIDs = await this._getIDs();

    if (inputIDs.length === 0) {
      render.missingID();
      process.exit(1);
    }

    inputIDs = this._removeDuplicates(inputIDs);

    inputIDs.forEach(id => {
      if (existingIDs.indexOf(Number(id)) === -1) {
        render.invalidID(id);
        process.exit(1);
      }
    });

    return inputIDs;
  }

  _isPriorityOpt(x) {
    return ["p:1", "p:2", "p:3"].indexOf(x) > -1;
  }

  async _getBoards() {
    let data = await this._getData();
    const boards = ["My Board"];

    Object.keys(data).forEach(id => {
      boards.push(...data[id].boards.filter(x => boards.indexOf(x) === -1));
    });

    return boards;
  }

  async _getDates() {
    let data = await this._getData();

    const dates = [];

    Object.keys(data).forEach(id => {
      if (dates.indexOf(data[id]._date) === -1) {
        dates.push(data[id]._date);
      }
    });

    return dates;
  }

  async _getIDs() {
    let data = await this._getData();

    return Object.keys(data).map(id => parseInt(id, 10));
  }

  _getPriority(desc) {
    const opt = desc.find(x => this._isPriorityOpt(x));
    return opt ? opt[opt.length - 1] : 1;
  }

  async _getOptions(input) {
    const [boards, desc] = [
      [],
      []
    ];

    if (input.length === 0) {
      render.missingDesc();
      process.exit(1);
    }

    const id = await this._generateID();
    const priority = this._getPriority(input);

    input.forEach(x => {
      if (!this._isPriorityOpt(x)) {
        return x.startsWith("@") && x.length > 1 ?
          boards.push(x) :
          desc.push(x);
      }
    });

    const description = desc.join(" ");

    if (boards.length === 0) {
      boards.push("My Board");
    }

    return {
      boards,
      description,
      id,
      priority
    };
  }

  async _getStats() {
    let data = await this._getData();
    let [complete, inProgress, pending, notes] = [0, 0, 0, 0];

    Object.keys(data).forEach(id => {
      if (data[id]._isTask) {
        return data[id].isComplete ?
          complete++
          :
          data[id].inProgress ?
          inProgress++
          :
          pending++;
      }

      return notes++;
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

  async _filterByAttributes(attr) {
    let data = await this._getData();

    if (Object.keys(data).length === 0) {
      return data;
    }

    attr.forEach(x => {
      switch (x) {
        case "star":
        case "starred":
          data = this._filterStarred(data);
          break;

        case "done":
        case "checked":
        case "complete":
          data = this._filterComplete(data);
          break;

        case "progress":
        case "started":
        case "begun":
          data = this._filterInProgress(data);
          break;

        case "pending":
        case "unchecked":
        case "incomplete":
          data = this._filterPending(data);
          break;

        case "todo":
        case "task":
        case "tasks":
          data = this._filterTask(data);
          break;

        case "note":
        case "notes":
          data = this._filterNote(data);
          break;

        default:
          break;
      }
    });

    return data;
  }

  async _groupByBoard() {
    let data = await this._getData();
    let boards = await this._getBoards();

    const grouped = {};

    if (boards.length === 0) {
      boards = this._getBoards();
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

  async _groupByDate() {
    let data = await this._getData();
    let dates = await this._getDates();

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

  async _saveItemToArchive(item) {
    let archive = await this._storage.getArchive();
    const archiveID = await this._generateID(archive);

    item._id = archiveID;
    archive[archiveID] = item;

    this._saveArchive(archive);
  }

  async _saveItemToStorage(item) {
    let data = await this._getData();

    const restoreID = await this._generateID();

    item._id = restoreID;
    data[restoreID] = item;

    this._save(data);
  }

  async createNote(desc) {
    let data = await this._getData();

    const {
      id,
      description,
      boards
    } = await this._getOptions(desc);
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
    let data = await this._getData();

    ids = await this._validateIDs(ids);
    const descriptions = [];

    ids.forEach(id => descriptions.push(data[id].description));

    clipboardy.writeSync(descriptions.join("\n"));
    render.successCopyToClipboard(ids);
  }

  async checkTasks(ids) {
    let data = await this._getData();

    ids = await this._validateIDs(ids);
    const {
      data
    } = this;
    const [checked, unchecked] = [
      [],
      []
    ];

    ids.forEach(id => {
      if (data[id]._isTask) {
        data[id].inProgress = false;
        data[id].isComplete = !data[id].isComplete;
        return data[id].isComplete ? checked.push(id) : unchecked.push(id);
      }
    });

    this._save(data);
    render.markComplete(checked);
    render.markIncomplete(unchecked);
  }

  async beginTasks(ids) {
    let data = await this._getData();

    ids = await this._validateIDs(ids);
    const [started, paused] = [
      [],
      []
    ];

    ids.forEach(id => {
      if (data[id]._isTask) {
        data[id].isComplete = false;
        data[id].inProgress = !data[id].inProgress;
        return data[id].inProgress ? started.push(id) : paused.push(id);
      }
    });

    this._save(data);
    render.markStarted(started);
    render.markPaused(paused);
  }

  async createTask(desc) {
    let data = await this._getData();

    const {
      boards,
      description,
      id,
      priority
    } = await this._getOptions(desc);
    const task = new Task({
      id,
      description,
      boards,
      priority
    });
    data[id] = task;
    this._save(data);
    render.successCreate(task);
  }

  async deleteItems(ids) {
    let data = await this._getData();

    ids = await this._validateIDs(ids);

    ids.forEach(id => {
      this._saveItemToArchive(data[id]);
      delete data[id];
    });

    this._save(data);
    render.successDelete(ids);
  }

  displayArchive() {
    render.displayByDate(
      this._groupByDate(this._archive, this._getDates(this._archive))
    );
  }

  async displayByBoard() {
    let data = await this._groupByBoard();
    render.displayByBoard(data);
  }

  async displayByDate() {
    let data = await this._groupByDate();
    render.displayByDate(data);
  }

  async displayStats() {
    let states = await this._getStats();
    render.displayStats(states);
  }

  async editDescription(input) {
    const targets = input.filter(x => x.startsWith("@"));

    if (targets.length === 0) {
      render.missingID();
      process.exit(1);
    }

    if (targets.length > 1) {
      render.invalidIDsNumber();
      process.exit(1);
    }

    const [target] = targets;
    const id = await this._validateIDs(target.replace("@", ""));
    const newDesc = input.filter(x => x !== target).join(" ");

    if (newDesc.length === 0) {
      render.missingDesc();
      process.exit(1);
    }

    let data = await this._getData();

    data[id].description = newDesc;
    this._save(data);
    render.successEdit(id);
  }

  async findItems(terms) {
    let data = await this._getData();

    const result = {};

    Object.keys(data).forEach(id => {
      if (!this._hasTerms(data[id].description, terms)) {
        return;
      }

      result[id] = data[id];
    });

    render.displayByBoard(this._groupByBoard(result));
  }

  listByAttributes(terms) {
    let [boards, attributes] = [
      [],
      []
    ];
    const storedBoards = this._getBoards();

    terms.forEach(x => {
      if (storedBoards.indexOf(`@${x}`) === -1) {
        return x === "myboard" ? boards.push("My Board") : attributes.push(x);
      }

      return boards.push(`@${x}`);
    });

    [boards, attributes] = [boards, attributes].map(x =>
      this._removeDuplicates(x)
    );

    const data = this._filterByAttributes(attributes);
    render.displayByBoard(this._groupByBoard(data, boards));
  }

  async moveBoards(input) {
    let boards = [];
    const targets = input.filter(x => x.startsWith("@"));

    if (targets.length === 0) {
      render.missingID();
      process.exit(1);
    }

    if (targets.length > 1) {
      render.invalidIDsNumber();
      process.exit(1);
    }

    const [target] = targets;
    const id = await this._validateIDs(target.replace("@", ""));

    input
      .filter(x => x !== target)
      .forEach(x => {
        boards.push(x === "myboard" ? "My Board" : `@${x}`);
      });

    if (boards.length === 0) {
      render.missingBoards();
      process.exit(1);
    }

    boards = this._removeDuplicates(boards);

    let data = await this._getData();
    data[id].boards = boards;
    this._save(data);
    render.successMove(id, boards);
  }

  async restoreItems(ids) {
    let archive = await this.getArchive();
    let existingIDs = await this._getIDs(archive);

    ids = await this._validateIDs(ids, existingIDs);

    ids.forEach(id => {
      this._saveItemToStorage(archive[id]);
      delete archive[id];
    });

    this._saveArchive(archive);
    render.successRestore(ids);
  }

  async starItems(ids) {
    ids = await this._validateIDs(ids);

    let data = await this._getData();

    const [starred, unstarred] = [
      [],
      []
    ];

    ids.forEach(id => {
      data[id].isStarred = !data[id].isStarred;
      return data[id].isStarred ? starred.push(id) : unstarred.push(id);
    });

    this._save(data);
    render.markStarred(starred);
    render.markUnstarred(unstarred);
  }

  async updatePriority(input) {
    const level = input.find(x => ["1", "2", "3"].indexOf(x) > -1);

    if (!level) {
      render.invalidPriority();
      process.exit(1);
    }

    const targets = input.filter(x => x.startsWith("@"));

    if (targets.length === 0) {
      render.missingID();
      process.exit(1);
    }

    if (targets.length > 1) {
      render.invalidIDsNumber();
      process.exit(1);
    }

    const [target] = targets;
    const id = await this._validateIDs(target.replace("@", ""));

    let data = await this._getData();

    data[id].priority = level;
    await this._save(data);
    render.successPriority(id, level);
  }

  async clear() {
    let data = await this._getData();

    const ids = [];

    Object.keys(data).forEach(id => {
      if (data[id].isComplete) {
        ids.push(id);
      }
    });

    if (ids.length === 0) {
      return;
    }

    this.deleteItems(ids);
  }
}

module.exports = new Taskbook();
