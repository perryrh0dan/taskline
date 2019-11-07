import { Item, ItemProperties } from './item';

export class Note extends Item {
  protected _isTask: boolean;

  public constructor(kwArgs: ItemProperties) {
    super(kwArgs);
    this._isTask = false;
  }
}
