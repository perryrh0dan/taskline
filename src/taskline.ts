import * as clipboardy from 'clipboardy';

import { LocalStorage } from './local'
import { Item } from './item';
import { Task, TaskPriority } from './task';
import { Renderer } from './renderer';
import { Config } from './config';
import { Note } from './note';



export class Taskline {
  private storage;

  constructor() {
    this.storage = LocalStorage.instance;
  }

  private getData(ids?: Array<number>): Promise<Array<Item>> {
    return this.storage.get(ids)
  }

  private getArchive(ids?: Array<number>): Promise<Array<Item>> {
    return this.storage.getArchive(ids);
  }

  private save(data: Array<Item>) {
    return this.storage.set(data)
  }

  private saveArchive(archive: Array<Item>) {
    return this.storage.setArchive(archive);
  }

  private arrayify(x) {
    return Array.isArray(x) ? x : [x];
  }

  private removeDuplicates(x) {
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

  private async groupByBoard(data: Array<Item>, boards: Array<string>) {
    if (!data) {
      data = await this.getData();
    }

    if (!boards) {
      boards = await this.getBoards();
    }

    const grouped = {};

    if (boards.length === 0) {
      boards = await this.getBoards();
    }

    data.forEach((item: Item) => {
      boards.forEach((board: string) => {
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

  private async groupByDate(data: Array<Item>, dates: Array<string>) {
    if (!data) {
      data = await this.getData();
    }

    if (!dates) {
      dates = await this.getDates();
    }

    const grouped = {}

    data.forEach((item: Item) => {
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
      item.id = archiveID;
      archive.push(item);
    }

    await this.saveArchive(archive);
  }

  private async saveItemsToStorage(ids: Array<number>) {
    const data = await this.getData();
    const archive = await this.getArchive();

    for (const id of ids) {
      const restoreID = await this.generateID(data);
      const item = archive.find(x => x.id === id);
      item.id = restoreID;
      data.push(item);
    }

    await this.save(data);
  }

  private parseOptions(options: string): Array<string> {
    return options.split(',');
  }

  private parseDate(input: string, format: string) {
    format = format || 'yyyy-mm-dd HH:MM' // Default format
    const parts: Array<number> = input.match(/(\d+)/g).map((item: string) => {
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

  private parseIDs(IDs: String) {
    if (Array.isArray(IDs)) return IDs;

    const temp = IDs.split(',');
    let ids = [];

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
          // render.invalidIDRange(element);
          throw new Error('Wrong parameters in ID Range');
        }
      } else {
        ids.push(element);
      }
    });

    return ids;
  }

  private async getIDs(data?) {
    if (!data) {
      data = await this.getData();
    }

    return Object.keys(data).map(id => parseInt(id, 10));
  }

  private async generateID(data?: Array<Item>) {
    if (!data) {
      data = await this.getData();
    }

    const max = Math.max.apply(Math, data.map(function (item) { return item.id; }))
    return max + 1;
  }

  private async validateIDs(inputIDs: Array<number>, existingIDs?) {
    if (!existingIDs) {
      existingIDs = await this.getIDs();
    }

    inputIDs = this.removeDuplicates(inputIDs);

    try {
      inputIDs.forEach((id: number) => {
        if (existingIDs.indexOf(id) === -1) {
          Renderer.instance.invalidID(id);
          throw new Error('Invalid InputIds')
        }
      })
    } catch (error) {
      return Promise.reject(new Error('Invalid InputIDs'));
    }

    return inputIDs;
  }

  private validatePriority(priority: string) {
    const level = Number(priority)
    if (Object.values(TaskPriority).includes(level)) {
      Renderer.instance.invalidPriority();
      throw new Error('Invalid  Priority');
    }

    return level;
  }

  public async createTask(description: string, boards: string, priority: string, dueDate: string) {
    Renderer.instance.startLoading();

    const id = await this.generateID();
    const data = await this.getData();
    const { dateformat } = Config.instance.get();

    let validatedPriority;
    if (priority) {
      try {
        validatedPriority = this.validatePriority(priority);
      } catch (error) {
        return Promise.reject(new Error('Invalid Priority'));
      }
    }

    const parsedBoards = this.parseOptions(boards);

    let dueTime;
    if (dueDate) {
      try {
        dueTime = this.parseDate(dueDate, dateformat)
      } catch (error) {
        return Promise.reject(new Error('Invalid Date Format'));
      }
    }

    const task = new Task({
      id,
      description,
      boards: parsedBoards,
      priority: validatedPriority,
      duedate: dueTime,
    })

    data.push(task);
    await this.save(data);
    Renderer.instance.successCreate(task);
  }

  public async createNote(description, boards: string) {
    Renderer.instance.startLoading();
    const id = await this.generateID();
    const data = await this.getData();

    const parsedBoards = this.parseOptions(boards);

    const note = new Note({
      id,
      description,
      boards: parsedBoards
    });

    data.push(note);
    await this.save(data);
    Renderer.instance.successCreate(note);
  }

  public async copyToClipboard(ids: string) {
    Renderer.instance.startLoading();

    let parsedIDs: Array<number>;

    try {
      parsedIDs = this.parseIDs(ids);
    } catch (error) {
      return Promise.reject(new Error('Invalid Input ID Range'));
    }

    const items = await this.getData(parsedIDs)
    const description: Array<string> = new Array<string>();

    items.forEach(item => {
      return description.push(item.description);
    });

    clipboardy.writeSync(description.join('\n'));
    Renderer.instance.successCopyToClipboard(ids);
  }

  public async checkTasks(ids: string) {
    Renderer.instance.startLoading();

    let parsedIDs: Array<number>;

    try {
      parsedIDs = this.parseIDs(ids);
    } catch (error) {
      return Promise.reject(new Error('Invalid Input ID Range'));
    }

    const items = await this.getData(parsedIDs)

    const [checked, unchecked] = [new Array<number>(), new Array<number>()];

    items.forEach(item => {
      if (item instanceof Task) {
        return item.isComplete ? checked.push(item.id) : unchecked.push(item.id);
      };
    });

    await this.save(items);
    Renderer.instance.markComplete(checked);
    Renderer.instance.markInComplete(unchecked);
  }

  public async beginTasks(ids: string) {
    Renderer.instance.startLoading();

    let parsedIDs: Array<number>;

    try {
      parsedIDs = this.parseIDs(ids);
    } catch (error) {
      return Promise.reject(new Error('Invalid Input ID Range'));
    }

    const items = await this.getData(parsedIDs);

    const [started, paused] = [new Array<number>(), new Array<number>()];

    items.forEach((item: Item)=> {
      if (item instanceof Task) {
        return item.inProgress ? started.push(item.id) : paused.push(item.id);
      }
    })

    await this.save(items);
    Renderer.instance.markStarted(started);
    Renderer.instance.markPaused(paused);
  }

  public async cancelTasks(ids: string) {
    Renderer.instance.startLoading();

    let parsedIDs: Array<number>;

    try {
      parsedIDs = this.parseIDs(ids);
    } catch (error) {
      return Promise.reject(new Error('Invalid Input ID Range'));
    }

    const items = await this.getData(parsedIDs);

    const [canceled, revived] = [ new Array<number>(), new Array<number>()];

    items.forEach((item: Item) => {
      if (item instanceof Task) {
        return item.isCanceled ? canceled.push(item.id) : revived.push(item.id);
      }
    })
  }

  public async deleteItems(ids: string) {
    Renderer.instance.startLoading();

    let parsedIDs: Array<number>;

    try {
      parsedIDs = this.parseIDs(ids);
    } catch (error) {
      return Promise.reject(new Error('Invalid Input ID Range'))
    }

    let items = await this.getData();

    const validatedIDs = await this.validateIDs(parsedIDs).catch(() => {
      return Promise.reject(new Error('Invalid InputIDs'));
    });

    this.saveItemsToArchive(validatedIDs);

    
    items = items.filter(item => { return validatedIDs.indexOf(item.id) !== -1});
  
    await this.save(items);
    Renderer.instance.successDelete(validatedIDs);
  }

  public async displayArchive() {
    Renderer.instance.startLoading();
    const archive = await this.getArchive();
    const dates = await this.getDates(archive);

    const grouped = await this.groupByDate(archive, dates);
  }

  public async displayByBoard() {
    Renderer.instance.startLoading();
    const grouped = await this.groupByBoard();
    Renderer.instance.displayByBoard(grouped);
    return grouped;
  }

  public async displayByDate() {

  }

  public displayStats() {

  }

  public async editDescription(id, description) {

  }
}