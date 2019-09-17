import { Item } from './item';

export enum TaskPriority {
  Normal = 1,
  Medium = 2,
  High = 3
}

export type TaskOptions = {
  id?: number;
  date?: string;
  timestamp?: number;
  description?: string;
  isStarred?: Boolean;
  boards?: Array<string>;
  priority?: TaskPriority;
  inProgress?: Boolean;
  isCanceled?: Boolean;
  isCompleted?: Boolean;
  duedate?: number;
}

export class Task extends Item {
  private _priority: number;
  private _inProgress: Boolean;
  private _isCanceled: Boolean;
  private _isCompleted: Boolean;
  private _duedate: number;

  constructor(options: TaskOptions) {
    super(options);
    this._isTask = true;
    this._priority = options.priority || TaskPriority.Normal;
    this._inProgress = options.inProgress || false;
    this._isCanceled = options.isCanceled || false;
    this._isCompleted = options.isCompleted || false;
    this._duedate = options.duedate || null;
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
    return this._isCompleted;
  }

  public set isComplete(isCompleted: Boolean) {
    this._isCanceled = isCompleted;
  }

  public get duedate() {
    return this._duedate
  }

  public set duedate(duedate: number) {
    this._duedate = duedate;
  }  

  public begin() {
    this._inProgress = !this._inProgress;
  }

  public check() {
    this._isCompleted = !this._isCompleted;
  }
}