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

  public constructor(kwArgs: ItemProperties) {
    const now: Date = new Date();

    this.id = kwArgs.id;
    this.date = kwArgs.date || now.toDateString();
    this.timestamp = kwArgs.timestamp || now.getTime();
    this.description = kwArgs.description || '';
    this.isStarred = kwArgs.isStarred || false;
    this.boards = kwArgs.boards || ['My Board'];
  }

  public get id(): number {
    return this._id;
  }

  public set id(id: number) {
    this._id = id;
  }

  public get date(): string {
    return this._date;
  }

  public set date(date: string) {
    this._date = date;
  }

  public get timestamp(): number {
    return this._timestamp;
  }

  public set timestamp(timestamp: number) {
    this._timestamp = timestamp;
  }

  public get isTask(): boolean {
    return this._isTask;
  }

  public set isTask(isTask: boolean) {
    this._isTask = isTask;
  }

  public get description(): string {
    return this._description;
  }

  public set description(description: string) {
    this._description = description;
  }

  public get isStarred(): boolean {
    return this._isStarred;
  }

  public set isStarred(isStarred: boolean) {
    this._isStarred = isStarred;
  }

  public get boards(): Array<string> {
    return this._boards;
  }

  public set boards(boards: Array<string>) {
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
