import { Item, ItemProperties } from './item';

export enum TaskPriority {
  Normal = 1,
  Medium = 2,
  High = 3
}

export interface TaskProperties extends ItemProperties {
  priority?: TaskPriority;
  inProgress?: Boolean;
  isCanceled?: Boolean;
  isComplete?: Boolean;
  dueDate?: number;
}

export class Task extends Item {
  protected _isTask: Boolean;
  private _priority: number;
  private _inProgress: Boolean;
  private _isCanceled: Boolean;
  private _isComplete: Boolean;
  private _dueDate: number;

  constructor(kwArgs: TaskProperties) {
    super(kwArgs);
    this._isTask = true;
    this._priority = kwArgs.priority || TaskPriority.Normal;
    this._inProgress = kwArgs.inProgress || false;
    this._isCanceled = kwArgs.isCanceled || false;
    this._isComplete = kwArgs.isComplete || false;
    this._dueDate = kwArgs.dueDate || 0;
  }

  public get priority() {
    return this._priority;
  }

  public set priority(priority: TaskPriority) {
    this._priority = priority;
  }

  public get inProgress() {
    return this._inProgress;
  }

  public set inProgress(inProgress: Boolean) {
    this._inProgress = inProgress;
  }

  public get isCanceled() {
    return this._isCanceled;
  }

  public set isCanceled(isCanceled: Boolean) {
    this._isCanceled = isCanceled;
  }

  public get isComplete() {
    return this._isComplete;
  }

  public set isComplete(isCompleted: Boolean) {
    this._isComplete = isCompleted;
  }

  public get dueDate() {
    return this._dueDate
  }

  public set dueDate(dueDate: number) {
    this._dueDate = dueDate;
  }

  public begin() {
    this._inProgress = !this._inProgress;
    this._isComplete = false;
    this._isCanceled = false;
  }

  public check() {
    this._isComplete = !this._isComplete;
    this._inProgress = false;
    this._isCanceled = false;
  }

  public cancel() {
    this._isCanceled = !this._isCanceled;
    this._inProgress = false;
    this._isComplete = false;
  }
}