import * as clipboardy from 'clipboardy';

import { Storage } from './storage';
import { LocalStorage } from './local';
import { FirestoreStorage } from './firestore';
import { Item } from './item';
import { Task, TaskPriority } from './task';
import { Renderer } from './renderer';
import { Config } from './config';
import { Note } from './note';
import { parseDate } from './libs/date';

export class Taskline {
  private storage: Storage;

  public constructor() {
    const { storageModule } = Config.instance.get();
    if (storageModule === 'firestore') {
      this.storage = FirestoreStorage.instance;
    } else if (storageModule === 'local') {
      this.storage = LocalStorage.instance;
    }
  }

  private getData(): Promise<Array<Item>> {
    return this.storage.get();
  }

  private getArchive(): Promise<Array<Item>> {
    return this.storage.getArchive();
  }

  private save(data: Array<Item>): Promise<void> {
    return this.storage.set(data);
  }

  private saveArchive(archive: Array<Item>): Promise<void> {
    return this.storage.setArchive(archive);
  }

  private arrayify(x: any): Array<any> {
    return Array.isArray(x) ? x : [x];
  }

  private removeDuplicates(x: Array<any>): Array<any> {
    return [...new Set(this.arrayify(x))];
  }

  private async getBoards(): Promise<Array<string>> {
    const data = await this.getData();
    const boards = ['My Board'];

    data.forEach(item => {
      boards.push(...item.boards.filter(x => boards.indexOf(x) === -1));
    });

    return boards;
  }

  private async getDates(data?: Array<Item>): Promise<Array<string>> {
    if (!data) {
      data = await this.getData();
    }

    const dates: Array<string> = new Array<string>();

    data.sort((one, two) => (one.timestamp > two.timestamp ? 1 : -1));

    data.forEach(item => {
      if (dates.indexOf(item.date) === -1) {
        dates.push(item.date);
      }
    });

    return dates;
  }

  private async groupByBoard(
    data?: Array<Item>,
    boards?: Array<string>
  ): Promise<any> {
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
            return grouped[board].push(item);
          }

          grouped[board] = [item];
          return grouped[board];
        }
      });
    });

    const ordered: any = {};

    // Sort boards
    Object.keys(grouped)
      .sort()
      .forEach((key: string) => {
        ordered[key] = grouped[key];
      });

    // Sort items in boards
    Object.keys(grouped).forEach((key: string) => {
      ordered[key] = ordered[key].sort((one: Item, two: Item) => { return one.id > two.id ? 1 : -1; });
    });

    return ordered;
  }

  private async groupByDate(
    data?: Array<Item>,
    dates?: Array<string>
  ): Promise<any> {
    if (!data) {
      data = await this.getData();
    }

    if (!dates) {
      dates = await this.getDates();
    }

    const grouped: any = {};

    data.forEach((item: Item): void => {
      dates!.forEach((date: string) => {
        if (item.date === date) {
          if (Array.isArray(grouped[date])) {
            return grouped[date].push(item);
          }

          grouped[date] = [item];
          return grouped[date];
        }
      });
    });

    return grouped;
  }

  private copyItem(item?: Item): Item | undefined {
    if (item instanceof Task) {
      return new Task(item.toJSON());
    } else if (item instanceof Note) {
      return new Note(item.toJSON());
    } else {
      return undefined;
    }
  }

  private async saveItemsToArchive(ids: Array<number>): Promise<void> {
    const data = await this.getData();
    const archive = await this.getArchive();

    for (const id of ids) {
      const archiveID = await this.generateID(archive);
      const item = this.copyItem(data.find(x => x.id === id));
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
      const item = this.copyItem(archive.find(x => x.id === id));
      if (!item) continue;
      item.id = restoreID;
      data.push(item);
    }

    await this.save(data);
  }

  private parseOptions(options: string): Array<string> {
    return options.split(',');
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

  private getStats(grouped: any): any {
    let [complete, canceled, inProgress, pending, notes] = [0, 0, 0, 0, 0];

    Object.keys(grouped).forEach(group => {
      grouped[group].forEach((item: Item) => {
        if (item instanceof Task) {
          return item.isComplete
            ? complete++
            : item.inProgress
              ? inProgress++
              : item.isCanceled
                ? canceled++
                : pending++;
        }

        return notes++;
      });
    });

    const total = complete + canceled + pending + inProgress;
    const percent = total === 0 ? 0 : Math.floor((complete * 100 + canceled * 100) / total);

    return {
      percent,
      complete,
      canceled,
      inProgress,
      pending,
      notes
    };
  }

  private hasTerms(string: string, terms: Array<string>): boolean {
    for (const term of terms) {
      if (string.toLocaleLowerCase().indexOf(term.toLocaleLowerCase()) > -1) {
        return true;
      }
    }
    return false;
  }

  private filterTask(data: Array<Item>): Array<Item> {
    data = data.filter((item: Item) => {
      return item instanceof Task;
    });

    return data;
  }

  private filterStarred(data: Array<Item>): Array<Item> {
    data = data.filter((item: Item) => {
      return item.isStarred;
    });

    return data;
  }

  private filterInProgress(data: Array<Item>): Array<Item> {
    data = data.filter((item: Item) => {
      return item instanceof Task && item.inProgress;
    });

    return data;
  }

  private filterComplete(data: Array<Item>): Array<Item> {
    data = data.filter((item: Item) => {
      return item instanceof Task && item.isComplete;
    });

    return data;
  }

  private filterCanceled(data: Array<Item>): Array<Item> {
    data = data.filter((item: Item) => {
      return item instanceof Task && item.isCanceled;
    });

    return data;
  }

  private filterPending(data: Array<Item>): Array<Item> {
    data = data.filter((item: Item) => {
      return item instanceof Task && !item.isComplete;
    });

    return data;
  }

  private filterNote(data: Array<Item>): Array<Item> {
    data = data.filter((item: Item) => {
      return item instanceof Note;
    });

    return data;
  }

  private filterPriority(
    data: Array<Item>,
    priority: TaskPriority
  ): Array<Item> {
    data = data.filter((item: Item) => {
      return item instanceof Task && item.priority === priority;
    });

    return data;
  }

  private async filterByAttributes(attr: Array<string>): Promise<Array<Item>> {
    let data = await this.getData();

    if (data.length === 0) {
      return data;
    }

    debugger;

    attr.forEach((x: string) => {
      switch (x) {
        case 'star':
        case 'starred':
          data = this.filterStarred(data);
          break;

        case 'done':
        case 'checked':
        case 'complete':
          data = this.filterComplete(data);
          break;

        case 'canceled':
          data = this.filterCanceled(data);
          break;

        case 'progress':
        case 'started':
        case 'begun':
          data = this.filterInProgress(data);
          break;

        case 'pending':
        case 'unchecked':
        case 'incomplete':
          data = this.filterPending(data);
          break;

        case 'todo':
        case 'task':
        case 'tasks':
          data = this.filterTask(data);
          break;

        case 'note':
        case 'notes':
          data = this.filterNote(data);
          break;

        case 'normal':
        case 'medium':
        case 'high':
          const priority: TaskPriority =
            x === 'normal'
              ? TaskPriority.Normal
              : x === 'medium'
                ? TaskPriority.Medium
                : TaskPriority.High;
          data = this.filterPriority(data, priority);
          break;

        default:
          break;
      }
    });

    return data;
  }

  private async generateID(data?: Array<Item>): Promise<number> {
    if (!data) {
      data = await this.getData();
    }

    const max = data.length
      ? Math.max(
        ...data.map((item: Item) => {
          return item.id;
        })
      )
      : 0;
    return max + 1;
  }

  private async validateIDs(
    inputIDs: Array<number>,
    existingIDs?: Array<number>
  ): Promise<Array<number>> {
    if (!existingIDs) {
      existingIDs = await this.getIDs();
    }

    inputIDs = this.removeDuplicates(inputIDs);

    try {
      inputIDs.forEach((id: number) => {
        if (existingIDs!.indexOf(id) === -1) {
          Renderer.instance.invalidID(id);
          throw new Error('Invalid InputIds');
        }
      });
    } catch (error) {
      return Promise.reject(new Error('Invalid InputIDs'));
    }

    return inputIDs;
  }

  private validatePriority(priority: string): TaskPriority {
    const level = Number(priority);
    if (!Object.values(TaskPriority).includes(level)) {
      Renderer.instance.invalidPriority();
      throw new Error('Invalid  Priority');
    }

    return level;
  }

  public async createTask(
    description: string,
    boards?: string,
    priority?: string,
    dueDate?: string
  ): Promise<void> {
    Renderer.instance.startLoading();

    const id = await this.generateID();
    const data = await this.getData();
    const { dateformat } = Config.instance.get();

    let validatedPriority: number | undefined;
    if (priority) {
      try {
        validatedPriority = this.validatePriority(priority);
      } catch (error) {
        return Promise.reject(new Error('Invalid Priority'));
      }
    }

    let parsedBoards: Array<string> | undefined;
    if (boards) {
      parsedBoards = this.parseOptions(boards);
    }

    let dueTime: number | undefined;
    if (dueDate) {
      try {
        dueTime = parseDate(dueDate, dateformat).getTime();
      } catch (error) {
        Renderer.instance.invalidDateFormat(dueDate);
        return Promise.reject(new Error('Invalid Date Format'));
      }
    }

    const task = new Task({
      id: id,
      description: description,
      boards: parsedBoards,
      priority: validatedPriority,
      dueDate: dueTime
    });

    data.push(task);
    await this.save(data);
    Renderer.instance.successCreate(task);
  }

  public async createNote(description: string, boards?: string): Promise<void> {
    Renderer.instance.startLoading();
    const id = await this.generateID();
    const data = await this.getData();

    let parsedBoards: Array<string> | undefined;
    if (boards) {
      parsedBoards = this.parseOptions(boards);
    }
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

    const items = await this.getData();
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

    const items = await this.getData();

    const [checked, unchecked] = [new Array<number>(), new Array<number>()];

    items.forEach((item: Item): void => {
      if (validatedIDs.indexOf(item.id) === -1) return;
      if (item instanceof Task) {
        item.check();
        item.isComplete ? checked.push(item.id) : unchecked.push(item.id);
      }
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
    });

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
        item.cancel();
        item.isCanceled ? canceled.push(item.id) : revived.push(item.id);
      }
    });

    await this.save(data);
    Renderer.instance.markCanceled(canceled);
    Renderer.instance.markRevived(revived);
  }

  public async deleteItems(ids: string): Promise<void> {
    Renderer.instance.startLoading();

    let parsedIDs: Array<number>;

    try {
      parsedIDs = this.parseIDs(ids);
    } catch (error) {
      return Promise.reject(new Error('Invalid Input ID Range'));
    }

    let data = await this.getData();

    const validatedIDs = await this.validateIDs(parsedIDs).catch(() => {
      return Promise.reject(new Error('Invalid InputIDs'));
    });

    await this.saveItemsToArchive(validatedIDs);

    data = data.filter(item => {
      return validatedIDs.indexOf(item.id) === -1;
    });

    await this.save(data);
    Renderer.instance.successDelete(validatedIDs);
  }

  public async clear(): Promise<void> {
    Renderer.instance.startLoading();
    const data = await this.getData();

    const ids: Array<number> = new Array<number>();

    data.forEach(item => {
      if (item instanceof Task && (item.isComplete || item.isCanceled)) {
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
    });

    const data = await this.getData();
    let dueTime: number, parsedDueDate: Date;

    try {
      parsedDueDate = parseDate(dueDate, dateformat);
      dueTime = parsedDueDate.getTime();
    } catch (error) {
      Renderer.instance.invalidDateFormat(dueDate);
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

  public async findItems(terms: string): Promise<any> {
    Renderer.instance.startLoading();

    const parsedTerms = this.parseOptions(terms);
    const data = await this.getData();
    const result: Array<Item> = new Array<Item>();

    data.forEach((item: Item) => {
      if (!this.hasTerms(item.description, parsedTerms)) {
        return;
      }

      result.push(item);
    });

    const grouped = await this.groupByBoard(result);
    Renderer.instance.displayByBoard(grouped);
    return grouped;
  }

  public async listByAttributes(terms: string): Promise<any> {
    Renderer.instance.startLoading();

    const parsedTerms = this.parseOptions(terms);
    let [boards, attributes] = [new Array<string>(), new Array<string>()];

    const storedBoards = await this.getBoards();

    parsedTerms.forEach((term: string) => {
      if (storedBoards.indexOf(term) === -1) {
        return term === 'myboards'
          ? boards.push('My Boards')
          : attributes.push(term);
      }

      return boards.push(term);
    });

    [boards, attributes] = [boards, attributes].map((x: Array<string>) => {
      return this.removeDuplicates(x);
    });

    const data = await this.filterByAttributes(attributes);
    const grouped = await this.groupByBoard(data, boards);
    Renderer.instance.displayByBoard(grouped);
    return grouped;
  }

  public async moveBoards(ids: string, boards: string): Promise<void> {
    Renderer.instance.startLoading();

    let parsedIDs: Array<number> = new Array<number>();
    try {
      parsedIDs = this.parseIDs(ids);
    } catch (error) {
      return Promise.reject(new Error('Invalid Input ID Range'));
    }

    const validatedIDs = await this.validateIDs(parsedIDs).catch(() => {
      return Promise.reject(new Error('Invalid InputIDs'));
    });

    let parsedBoards = this.parseOptions(boards);
    parsedBoards = this.removeDuplicates(parsedBoards);

    const data = await this.getData();

    data.forEach((item: Item): void => {
      if (validatedIDs.indexOf(item.id) === -1) return;
      item.boards = parsedBoards;
    });

    await this.save(data);
    Renderer.instance.successMove(validatedIDs, parsedBoards);
  }

  public async restoreItems(ids: string): Promise<void> {
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

    archive = archive.filter(item => {
      return validatedIDs.indexOf(item.id) === -1;
    });

    await this.saveArchive(archive);
    Renderer.instance.successRestore(validatedIDs);
  }

  public async starItems(ids: string): Promise<void> {
    Renderer.instance.startLoading();

    let parsedIDs: Array<number>;
    try {
      parsedIDs = this.parseIDs(ids);
    } catch (error) {
      return Promise.reject(new Error('Invalid Input ID Range'));
    }

    let validatedIDs: Array<number>;
    validatedIDs = await this.validateIDs(parsedIDs).catch(() => {
      return Promise.reject(new Error('Invalid InputIDs'));
    });

    const data = await this.getData();

    const [starred, unstarred] = [new Array<number>(), new Array<number>()];

    data.forEach((item: Item): void => {
      if (validatedIDs.indexOf(item.id) === -1) return;
      item.star();
      item.isStarred ? starred.push(item.id) : unstarred.push(item.id);
    });

    await this.save(data);
    Renderer.instance.markStarred(starred);
    Renderer.instance.markUnstarred(unstarred);
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
    Renderer.instance.successPriority(updated, level);
  }

  public async editDescription(id: string, description: string): Promise<void> {
    Renderer.instance.startLoading();
    const parsedID: Array<number> = [parseInt(id)];

    const validatedID = await this.validateIDs(parsedID).catch(() => {
      return Promise.reject(new Error('Invalid InputID'));
    });

    const data = await this.getData();

    data.find(x => x.id === validatedID[0])!.description = description;
    await this.save(data);
    Renderer.instance.successEdit(parsedID[0]);
  }

  public async displayArchive(): Promise<void> {
    Renderer.instance.startLoading();
    const archive = await this.getArchive();
    const dates = await this.getDates(archive);

    const grouped = await this.groupByDate(archive, dates);
    Renderer.instance.displayByDate(grouped);
  }

  public async displayByBoard(): Promise<any> {
    Renderer.instance.startLoading();
    const grouped = await this.groupByBoard();
    Renderer.instance.displayByBoard(grouped);
    return grouped;
  }

  public async displayByDate(): Promise<any> {
    Renderer.instance.startLoading();
    const grouped = await this.groupByDate();
    Renderer.instance.displayByDate(grouped);
    return grouped;
  }

  public displayStats(grouped: any): void {
    const states = this.getStats(grouped);
    Renderer.instance.displayStats(
      states.percent,
      states.complete,
      states.canceled,
      states.inProgress,
      states.pending,
      states.notes
    );
  }

  public async refactorIDs(): Promise<void> {
    Renderer.instance.startLoading();

    const data = await this.getData();
    data.sort((one, two) => (one.id > two.id ? 1 : -1));

    let nextID = 1;
    data.forEach((item: Item) => {
      item.id = nextID;
      nextID += 1;
    });

    await this.save(data);

    Renderer.instance.successRearrangeIDs();
  }

  public async displayConfig(): Promise<void> {
    const config = Config.instance.get();
    const path = Config.instance.getConfigPath();

    Renderer.instance.displayConfig(config, path);
  }
}
