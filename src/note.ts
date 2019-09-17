import { Item, ItemProperties } from './item';

export interface NoteProperties extends ItemProperties {

}

export class Note extends Item {
  protected _isTask: Boolean;

  constructor(kwArgs: NoteProperties) {
    super(kwArgs);
    this._isTask = false;
  }
}
