const now = new Date();

export type ItemOptions = {
  id?: number;
  date?: string;
  timestamp?: number;
  description?: string;
  isStarred?: Boolean;
  boards?: Array<string>;
}

export abstract class Item {
  protected id: number;
  protected date: string;
  protected timestamp: number;
  protected isTask: Boolean;
  protected description: string;
  protected isStarred: Boolean;
  protected boards: Array<string>;

  constructor(options: ItemOptions) {
    this.id = options.id;
    this.date = options.date || now.toDateString();
    this.timestamp = options.timestamp || now.getTime();
    this.description = options.description || '';
    this.isStarred = options.isStarred || false;
    this.boards = options.boards || ['My Board'];
  }
}
