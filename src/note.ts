import { Item } from './item';

type NoteOptions = {
  id?: number;
  date?: string;
  timestamp?: number;
  description?: string;
  isStarred?: Boolean;
  boards?: Array<string>;
}

export class Note extends Item {
  constructor(options: NoteOptions) {
    super(options);
    this.isTask = false;
  }
}
