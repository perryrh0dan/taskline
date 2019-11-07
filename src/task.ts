import { Item, ItemProperties } from './item';

export enum TaskPriority {
  Normal = 1,
  Medium = 2,
  High = 3
}

export interface TaskProperties extends ItemProperties {
  priority?: TaskPriority;
  inProgress?: boolean;
  isCanceled?: boolean;
  isComplete?: boolean;
  dueDate?: number;
}

export class Task extends Item {
  protected _isTask: boolean;
  private _priority: number;
  private _inProgress: boolean;
  private _isCanceled: boolean;
  private _isComplete: boolean;
  private _dueDate: number;

  public constructor(kwArgs: TaskProperties) {
    super(kwArgs);
    this._isTask = true;
    this._priority = kwArgs.priority || TaskPriority.Normal;
    this._inProgress = kwArgs.inProgress || false;
    this._isCanceled = kwArgs.isCanceled || false;
    this._isComplete = kwArgs.isComplete || false;
    this._dueDate = kwArgs.dueDate || 0;
  }

  public get priority(): TaskPriority {
    return this._priority;
  }

  public set priority(priority: TaskPriority) {
    this._priority = priority;
  }

  public get inProgress(): boolean {
    return this._inProgress;
  }

  public set inProgress(inProgress: boolean) {
    this._inProgress = inProgress;
  }

  public get isCanceled(): boolean {
    return this._isCanceled;
  }

  public set isCanceled(isCanceled: boolean) {
    this._isCanceled = isCanceled;
  }

  public get isComplete(): boolean {
    return this._isComplete;
  }

  public set isComplete(isCompleted: boolean) {
    this._isComplete = isCompleted;
  }

  public get dueDate(): number {
    return this._dueDate;
  }

  public set dueDate(dueDate: number) {
    this._dueDate = dueDate;
  }

  public begin(): void {
    this._inProgress = !this._inProgress;
    this._isComplete = false;
    this._isCanceled = false;
  }

  public check(): void {
    this._isComplete = !this._isComplete;
    this._inProgress = false;
    this._isCanceled = false;
  }

  public cancel(): void {
    this._isCanceled = !this._isCanceled;
    this._inProgress = false;
    this._isComplete = false;
  }
}
