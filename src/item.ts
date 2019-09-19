const now: Date = new Date();

export interface ItemProperties {
  id: number;
  date?: string;
  timestamp?: number;
  description?: string;
  isStarred?: boolean;
  boards?: Array<string>;
}

export abstract class Item {
  protected _id: number;
  protected _date: string;
  protected _timestamp: number;
  protected abstract _isTask: boolean;
  protected _description: string;
  protected _isStarred: boolean;
  protected _boards: Array<string>;

  constructor(kwArgs: ItemProperties) {
    this._id = kwArgs.id;
    this._date = kwArgs.date || now.toDateString();
    this._timestamp = kwArgs.timestamp || now.getTime();
    this._description = kwArgs.description || '';
    this._isStarred = kwArgs.isStarred || false;
    this._boards = kwArgs.boards || ['My Board'];
  }

  get id(): number {
    return this._id;
  }

  set id(id: number) {
    this._id = id;
  }

  get date(): string {
    return this._date;
  }

  set date(date: string) {
    this._date = date;
  }

  get timestamp(): number {
    return this._timestamp;
  }

  set timestamp(timestamp: number) {
    this._timestamp = timestamp;
  }

  get isTask(): boolean {
    return this._isTask;
  }

  set isTask(isTask: boolean) {
    this._isTask = isTask;
  }

  get description(): string {
    return this._description;
  }

  set description(description: string) {
    this._description = description;
  }

  get isStarred(): boolean {
    return this._isStarred;
  }

  set isStarred(isStarred: boolean) {
    this._isStarred = isStarred;
  }

  get boards(): Array<string> {
    return this._boards;
  }

  set boards(boards: Array<string>) {
    this._boards = boards;
  }

  public toJSON(): any {
    const protos: Array<any> = new Array<any>();
    protos.push(Object.getPrototypeOf(Object.getPrototypeOf(this)));
    protos.push(Object.getPrototypeOf(this));
    const jsonObj: any = {};
    // const jsonObj: any = Object.assign({}, this);

    protos.forEach(proto => {
      Object.entries(Object.getOwnPropertyDescriptors(proto))
        .filter(([key, descriptor]) => typeof descriptor.get === 'function')
        .map(([key, descriptor]) => {
          if (descriptor && key[0] !== '_') {
            try {
              const val: string = (this as any)[key];
              jsonObj[key] = val;
            } catch (error) {
              console.error(`Error calling getter ${key}`, error);
            }
          }
        });
    });

    return jsonObj;
  }

  public star(): void {
    this._isStarred = !this.isStarred;
  }
}
