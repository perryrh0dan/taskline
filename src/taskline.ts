import * as clipboardy from 'clipboardy';

import { Storage } from './storage'
import { LocalStorage } from './local'
import { Item } from './item';
import { Task, TaskPriority } from './task';
import { Renderer } from './renderer';
import { Config } from './config';
import { Note } from './note';

export class Taskline {
  private storage: Storage;

  constructor() {
    this.storage = LocalStorage.instance;
  }

  private getData(): Promise<Array<Item>> {
    return this.storage.get()
  }

  private getArchive(): Promise<Array<Item>> {
    return this.storage.getArchive();
  }

  private save(data: Array<Item>) {
    return this.storage.set(data)
  }

  private saveArchive(archive: Array<Item>) {
    return this.storage.setArchive(archive);
  }

  private arrayify(x: any) {
    return Array.isArray(x) ? x : [x];
  }

  private removeDuplicates(x: any) {
    return [...new Set(this.arrayify(x))];
  }

  private async getBoards() {
    const data = await this.getData();
    const boards = ['My Board'];

    data.forEach(item => {
      boards.push(...item.boards.filter(x => boards.indexOf(x) === -1));
    })

    return boards;
  }

  private async getDates(data?: Array<Item>): Promise<Array<string>> {
    if (!data) {
      data = await this.getData();
    }

    const dates: Array<string> = new Array<string>();

    data.forEach(item => {
      if (dates.indexOf(item.date) === -1) {
        dates.push(item.date);
      }
    })

    return dates;
  }

  private async groupByBoard(data?: Array<Item>, boards?: Array<string>): Promise<any> {
    if (!data) {
      data = await this.getData();
    }

    if (!boards) {
      boards = await this.getBoards();
    }

    const grouped: any = {};

    if (boards.length === 0) {
      boards = await this.getBoards();
    }

    data.forEach((item: Item) => {
      boards!.forEach((board: string) => {
        if (item.boards.includes(board)) {
          if (Array.isArray(grouped[board])) {
            return grouped[board].push(item)
          }

          grouped[board] = [item];
          return grouped[board];
        }
      });
    });

    return grouped;
  }

  private async groupByDate(data: Array<Item>, dates: Array<string>): Promise<any> {
    if (!data) {
      data = await this.getData();
    }

    if (!dates) {
      dates = await this.getDates();
    }

    const grouped: any = {};

    data.forEach((item: Item): void => {
      dates.forEach((date: string) => {
        if (item.date === date) {
          if (Array.isArray(grouped[date])) {
            return grouped[date].push(item)
          }

          grouped[date] = [item];
          return grouped[date];
        }
      });
    });

    return grouped;
  }

  private async saveItemsToArchive(ids: Array<number>) {
    const data = await this.getData();
    const archive = await this.getArchive();

    for (const id of ids) {
      const archiveID = await this.generateID(archive);
      const item = data.find(x => x.id === id);
      if (!item) continue;
      item.id = archiveID;
      archive.push(item);
    }

    await this.saveArchive(archive);
  }

  private async saveItemsToStorage(ids: Array<number>): Promise<void> {
    const data = await this.getData();
    const archive = await this.getArchive();

    for (const id of ids) {
      const restoreID = await this.generateID(data);
      const item = archive.find(x => x.id === id);
      if (!item) continue;
      item.id = restoreID;
      data.push(item);
    }

    await this.save(data);
  }

  private parseOptions(options: string): Array<string> {
    return options.split(',');
  }

  private parseDate(input: string, format: string): Date {
    format = format || 'yyyy-mm-dd HH:MM' // Default format
    const parts: Array<number> = input.match(/(\d+)/g)!.map((item: string) => {
      return parseInt(item, 10);
    });
    const fmt: any = {};
    let i = 0;
    let date;

    // Extract date-part indexes from the format
    format.replace(/(yyyy|dd|mm|HH|MM|SS)/g, (part: string) => {
      fmt[part] = i++;
      return part;
    });

    // Some simple date checks
    if (parts[fmt.yyyy] < 0 || parts[fmt.mm] > 11 || parts[fmt.dd] > 31) throw new Error('Cant parse to date');

    try {
      date = new Date(parts[fmt.yyyy], parts[fmt.mm] - 1, parts[fmt.dd]);
    } catch (error) {
      Renderer.instance.invalidDateFormat(input)
      throw new Error('Cant parse to date');
    }

    if (parts[fmt.HH]) {
      date.setHours(parts[fmt.HH]);
      if (parts[fmt.MM]) {
        date.setMinutes(parts[fmt.MM]);
        if (parts[fmt.SS]) {
          date.setSeconds(parts[fmt.SS]);
        }
      }
    }

    return date;
  }

  private parseIDs(IDs: String): Array<number> {
    const temp = IDs.split(',');
    let ids = new Array<number>();

    temp.forEach(element => {
      if (element.includes('-')) {
        const range = element.split('-');
        const from = parseInt(range[0]);
        const to = parseInt(range[1]);
        if (!isNaN(from) && !isNaN(to)) {
          const rangeList = Array.from(
            new Array(to - (from - 1)),
            (x, i) => i + from
          );
          ids = ids.concat(rangeList);
        } else {
          Renderer.instance.invalidIDRange(element);
          throw new Error('Wrong parameters in ID Range');
        }
      } else {
        ids.push(parseInt(element));
      }
    });

    return ids;
  }

  private async getIDs(data?: Array<Item>): Promise<Array<number>> {
    if (!data) {
      data = await this.getData();
    }

    return data.map((item: Item) => item.id);
  }

  private getStats(grouped: any) {
    let [complete, inProgress, pending, notes] = [0, 0, 0, 0];

    Object.keys(grouped).forEach(group => {
      grouped[group].forEach((item: Item) => {
        if (item instanceof Task) {
          return item.isComplete ? complete++ : item.inProgress ? inProgress++ : pending++;
        }

        return notes++;
      })
    })

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

  private async generateID(data?: Array<Item>) {
    if (!data) {
      data = await this.getData();
    }

    const max = data.length ? Math.max(...data.map(function (item) { return item.id; })) : 0;
    return max + 1;
  }

  private async validateIDs(inputIDs: Array<number>, existingIDs?: Array<number>) {
    if (!existingIDs) {
      existingIDs = await this.getIDs();
    }

    inputIDs = this.removeDuplicates(inputIDs);

    try {
      inputIDs.forEach((id: number) => {
        if (existingIDs!.indexOf(id) === -1) {
          Renderer.instance.invalidID(id);
          throw new Error('Invalid InputIds')
        }
      })
    } catch (error) {
      return Promise.reject(new Error('Invalid InputIDs'));
    }

    return inputIDs;
  }

  private validatePriority(priority: string): TaskPriority {
    const level = Number(priority)
    if (Object.values(TaskPriority).includes(level)) {
      Renderer.instance.invalidPriority();
      throw new Error('Invalid  Priority');
    }

    return level;
  }

  public async createTask(description: string, boards?: string, priority?: string, dueDate?: string): Promise<void> {
    Renderer.instance.startLoading();

    const id = await this.generateID();
    const data = await this.getData();
    const { dateformat } = Config.instance.get();

    let validatedPriority: number;
    if (priority) {
      try {
        validatedPriority = this.validatePriority(priority);
      } catch (error) {
        return Promise.reject(new Error('Invalid Priority'));
      }
    }

    let parsedBoards: Array<string>
    if (boards) {
      parsedBoards = this.parseOptions(boards);
    }

    let dueTime: number;
    if (dueDate) {
      try {
        dueTime = this.parseDate(dueDate, dateformat).getTime()
      } catch (error) {
        return Promise.reject(new Error('Invalid Date Format'));
      }
    }

    const task = new Task({
      id: id,
      description: description,
      boards: parsedBoards,
      priority: validatedPriority,
      dueDate: dueTime,
    })

    data.push(task);
    await this.save(data);
    Renderer.instance.successCreate(task);
  }

  public async createNote(description: string, boards: string = '') {
    Renderer.instance.startLoading();
    const id = await this.generateID();
    const data = await this.getData();

    const parsedBoards = this.parseOptions(boards);

    const note = new Note({
      id: id,
      description: description,
      boards: parsedBoards
    });

    data.push(note);
    await this.save(data);
    Renderer.instance.successCreate(note);
  }

  public async copyToClipboard(ids: string): Promise<void> {
    Renderer.instance.startLoading();

    let parsedIDs: Array<number>;

    try {
      parsedIDs = this.parseIDs(ids);
    } catch (error) {
      return Promise.reject(new Error('Invalid Input ID Range'));
    }

    const validatedIDs = await this.validateIDs(parsedIDs).catch(() => {
      return Promise.reject(new Error('Invalid InputIDs'));
    });

    const items = await this.getData()
    const description: Array<string> = new Array<string>();

    items.forEach(item => {
      if (validatedIDs.indexOf(item.id) === -1) return;
      return description.push(item.description);
    });

    clipboardy.writeSync(description.join('\n'));
    Renderer.instance.successCopyToClipboard(parsedIDs);
  }

  public async checkTasks(ids: string): Promise<void> {
    Renderer.instance.startLoading();

    let parsedIDs: Array<number>;
    try {
      parsedIDs = this.parseIDs(ids);
    } catch (error) {
      return Promise.reject(new Error('Invalid Input ID Range'));
    }

    const validatedIDs = await this.validateIDs(parsedIDs).catch(() => {
      return Promise.reject(new Error('Invalid InputIDs'));
    });

    const items = await this.getData()

    const [checked, unchecked] = [new Array<number>(), new Array<number>()];

    items.forEach((item: Item): void => {
      if (validatedIDs.indexOf(item.id) === -1) return;
      if (item instanceof Task) {
        item.check();
        item.isComplete ? checked.push(item.id) : unchecked.push(item.id);
      };
    });

    await this.save(items);
    Renderer.instance.markComplete(checked);
    Renderer.instance.markInComplete(unchecked);
  }

  public async beginTasks(ids: string): Promise<void> {
    Renderer.instance.startLoading();

    let parsedIDs: Array<number>;

    try {
      parsedIDs = this.parseIDs(ids);
    } catch (error) {
      return Promise.reject(new Error('Invalid Input ID Range'));
    }

    const validatedIDs = await this.validateIDs(parsedIDs).catch(() => {
      return Promise.reject(new Error('Invalid InputIDs'));
    });

    const items = await this.getData();

    const [started, paused] = [new Array<number>(), new Array<number>()];

    items.forEach((item: Item): void => {
      if (validatedIDs.indexOf(item.id) === -1) return;
      if (item instanceof Task) {
        item.begin();
        item.inProgress ? started.push(item.id) : paused.push(item.id);
      }
    })

    await this.save(items);
    Renderer.instance.markStarted(started);
    Renderer.instance.markPaused(paused);
  }

  public async cancelTasks(ids: string): Promise<void> {
    Renderer.instance.startLoading();

    let parsedIDs: Array<number>;

    try {
      parsedIDs = this.parseIDs(ids);
    } catch (error) {
      return Promise.reject(new Error('Invalid Input ID Range'));
    }

    const validatedIDs = await this.validateIDs(parsedIDs).catch(() => {
      return Promise.reject(new Error('Invalid InputIDs'));
    });

    const data = await this.getData();

    const [canceled, revived] = [new Array<number>(), new Array<number>()];

    data.forEach((item: Item): void => {
      if (validatedIDs.indexOf(item.id) === -1) return;
      if (item instanceof Task) {
        item.cancel()
        item.isCanceled ? canceled.push(item.id) : revived.push(item.id);
      }
    })

    await this.save(data);
    Renderer.instance.markCanceled(canceled);
    Renderer.instance.markRevived(revived)
  }

  public async deleteItems(ids: string): Promise<void> {
    Renderer.instance.startLoading();

    let parsedIDs: Array<number>;

    try {
      parsedIDs = this.parseIDs(ids);
    } catch (error) {
      return Promise.reject(new Error('Invalid Input ID Range'))
    }

    let data = await this.getData();

    const validatedIDs = await this.validateIDs(parsedIDs).catch(() => {
      return Promise.reject(new Error('Invalid InputIDs'));
    });

    await this.saveItemsToArchive(validatedIDs);

    data = data.filter(item => { return validatedIDs.indexOf(item.id) === -1 });

    await this.save(data);
    Renderer.instance.successDelete(validatedIDs);
  }

  public async clear(): Promise<void> {
    Renderer.instance.startLoading();
    const data = await this.getData();

    const ids: Array<number> = new Array<number>();

    data.forEach(item => {
      if (item instanceof Task && (item.isTask || item.isCanceled)) {
        ids.push(item.id);
      }
    });

    if (ids.length === 0) {
      return Renderer.instance.stopLoading();
    }

    await this.deleteItems(ids.join(','));
  }

  public async updateDueDate(ids: string, dueDate: string): Promise<void> {
    Renderer.instance.startLoading();
    const { dateformat } = Config.instance.get();

    let parsedIDs: Array<number> = new Array<number>();
    try {
      parsedIDs = this.parseIDs(ids);
    } catch (error) {
      return Promise.reject(new Error('Invalid Input ID Range'));
    }

    const validatedIDs = await this.validateIDs(parsedIDs).catch(() => {
      return Promise.reject(new Error('Invalid InputIDs'));
    })

    const data = await this.getData();
    let dueTime: number, parsedDueDate: Date;

    try {
      parsedDueDate = this.parseDate(dueDate, dateformat)
      dueTime = parsedDueDate.getTime();
    } catch (error) {
      return Promise.reject(new Error('Invalid Date Format'));
    }

    const updated: Array<number> = new Array<number>();
    data.forEach((item: Item): void => {
      if (validatedIDs.indexOf(item.id) === -1) return;
      if (item instanceof Task) {
        item.dueDate = dueTime;
        updated.push(item.id);
      }
    });

    await this.save(data);
    Renderer.instance.successDueDate(updated, parsedDueDate);
  }

  async restoreItems(ids: string): Promise<void> {
    Renderer.instance.startLoading();

    let archive = await this.getArchive();
    const existingIDs = await this.getIDs(archive);

    let parsedIDs: Array<number>;
    try {
      parsedIDs = this.parseIDs(ids);
    } catch (error) {
      return Promise.reject(new Error('Invalid Input ID Range'));
    }

    let validatedIDs: Array<number>;
    validatedIDs = await this.validateIDs(parsedIDs, existingIDs).catch(() => {
      return Promise.reject(new Error('Invalid InputIDs'));
    });

    await this.saveItemsToStorage(validatedIDs);

    archive = archive.filter(item => { return validatedIDs.indexOf(item.id) !== -1 });

    await this.saveArchive(archive);
    Renderer.instance.successRestore(validatedIDs);
  }

  public async updatePriority(ids: string, priority: string): Promise<void> {
    Renderer.instance.startLoading();

    let level: TaskPriority;
    try {
      level = this.validatePriority(priority);
    } catch (error) {
      return Promise.reject(new Error('Invalid Priority'));
    }

    let parsedIDs: Array<number>;
    try {
      parsedIDs = this.parseIDs(ids);
    } catch (error) {
      return Promise.reject(new Error('Invalid Input ID Range'));
    }

    const validatedIDs = await this.validateIDs(parsedIDs).catch(() => {
      return Promise.reject(new Error('Invalid InputIDs'));
    });

    const data = await this.getData();
    const updated: Array<number> = new Array<number>();

    data.forEach((item: Item): void => {
      if (validatedIDs.indexOf(item.id) === -1) return;
      if (item instanceof Task) {
        item.priority = level;
        updated.push(item.id);
      }
    });

    await this.save(data);
    Renderer.instance.successPriority(updated, level)
  }

  public async displayArchive() {
    Renderer.instance.startLoading();
    const archive = await this.getArchive();
    const dates = await this.getDates(archive);

    const grouped = await this.groupByDate(archive, dates);

    Renderer.instance.displayByDate(grouped);
  }

  public async displayByBoard() {
    Renderer.instance.startLoading();
    const grouped = await this.groupByBoard();
    Renderer.instance.displayByBoard(grouped);
    return grouped;
  }

  public async displayByDate() {

  }

  public displayStats(grouped: any) {
    const states = this.getStats(grouped);
    Renderer.instance.displayStats(states.percent, states.complete, states.inProgress, states.pending, states.notes);
  }

  public async editDescription(id: string, description: string) {

  }
}