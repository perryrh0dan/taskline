import { LocalStorage } from './local'
import { Item } from './item';
import { Task } from './task';
import { Renderer } from './renderer';
import { Config } from './config';



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

    const max = Math.max.apply(Math, data.map(function(item) { return item.id; }))
    return max + 1;
  }

  private async validateIDs(inputIDs: Array<number>, existingIDs?) {
    if (!existingIDs) {
      existingIDs = await this.getIDs();
    }

    inputIDs = this.removeDuplicates(inputIDs);
  }

  private async validatePriority(priority: string) {
    
  }

  public async createTask(description: string, boards: string, priority: string, dueDate: string) {
    Renderer.instance.startLoading();

    const id = await this.generateID();
    const data = await this.getData();
    const { dataformat } = Config.instance.get();

    try {
      priority = this.
    }
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

  public async beginTask(ids: string) {
    Renderer.instance.startLoading();

    let parsedIDs: Array<number>;

    try {
      parsedIDs = this.parseIDs(ids);
    } catch (error) {
      return Promise.reject(new Error('Invalid Input ID Range'));
    }

    const items = await this.getData(parsedIDs);

    const [ started, paused ] = [ new Array<number>(), new Array<number>()];
  
    items.forEach(item => {
      if (item instanceof Task) {
        return item.inProgress ? started.push(item.id) : paused.push(item.id);
      }
    })

    await this.save(items);
    Renderer.instance.markStarted(started);
    Renderer.instance.markPaused(paused);
  }
}