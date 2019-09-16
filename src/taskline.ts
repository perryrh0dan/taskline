import { LocalStorage } from './local'

// const render = require('./render')

export class Taskline {
  private storage;

  constructor() {
    this.storage = LocalStorage.getInstance();
  }

  private getData() {
    return this.storage.get()
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

  private async validateIDs(inputIDs: Array<number>, existingIDs?) {
    if (!existingIDs) {
      existingIDs = await this.getIDs();
    }

    inputIDs = this.removeDuplicates(inputIDs);
  }

  async checkTasks(ids: string) {
    // render.startLoading();

    let parsedIDs: Array<number>;

    try {
      parsedIDs = this.parseIDs(ids);
    } catch (error) {
      return Promise.reject(new Error('Invalid Input ID Range'));
    }

    const data = await this.getData()

    const validatedIDs = await this.validateIDs(parsedIDs).catch(() => {
      return Promise.reject(new Error('Invalid InputIDs'));
    });

    const [checked, unchecked] = [[], []];


  }
}