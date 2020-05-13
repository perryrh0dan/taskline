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
  passedTime?: number;
  lastStartTime?: number;
}

export class Task extends Item {
  protected _isTask: boolean;
  private _priority: number;
  private _inProgress: boolean;
  private _isCanceled: boolean;
  private _isComplete: boolean;
  private _dueDate: number;
  private _passedTime: number; //milliseconds
  private _lastStartTime: number;

  public constructor(kwArgs: TaskProperties) {
    super(kwArgs);
    this.isTask = true;
    this.priority = kwArgs.priority || TaskPriority.Normal;
    this.inProgress = kwArgs.inProgress || false;
    this.isCanceled = kwArgs.isCanceled || false;
    this.isComplete = kwArgs.isComplete || false;
    this.dueDate = kwArgs.dueDate || 0;
    this._passedTime = kwArgs.passedTime || 0;
    this._lastStartTime = kwArgs.lastStartTime || 0;
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

  public get passedTime(): number {
    return this._passedTime;
  }

  public getRealPassedTime(): number {
    if(this.lastStartTime != 0) {
      return this.passedTime + (new Date().getTime() - this.lastStartTime);
    }
    return this.passedTime;
  }

  public get lastStartTime(): number {
    return this._lastStartTime;
  }

  public begin(): void {
    debugger;
    const now: Date = new Date();

    // check if task is started or paused
    if(this.inProgress == true) {
      // just for backwards compatibility
      if (this.lastStartTime != 0) {
        this._passedTime += now.getTime() - this.lastStartTime;
      }
      this._lastStartTime = 0;
    } else {
      this._lastStartTime = now.getTime();
    }

    this.inProgress = !this.inProgress;
    this.isComplete = false;
    this.isCanceled = false;
  }

  public check(): void {
    const now: Date = new Date();

    if(this.inProgress == true) {
      // just for backwards compatibility
      if (this.lastStartTime != 0) {
        this._passedTime += now.getTime() - this.lastStartTime;
      }
      this._lastStartTime = 0;
    }

    this.isComplete = !this._isComplete;
    this.inProgress = false;
    this.isCanceled = false;
  }

  public cancel(): void {
    const now: Date = new Date();

    if(this.inProgress == true) {
      // just for backwards compatibility
      if (this.lastStartTime != 0) {
        this._passedTime += now.getTime() - this.lastStartTime;
      }
      this._lastStartTime = 0;
    }

    this.isCanceled = !this._isCanceled;
    this.inProgress = false;
    this.isComplete = false;
  }
}
