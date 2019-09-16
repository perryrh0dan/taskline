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
  private priority: number;
  private inProgress: Boolean;
  private isCanceled: Boolean;
  private isCompleted: Boolean;
  private duedate: number;

  constructor(options: TaskOptions) {
    super(options);
    this.isTask = true;
    this.priority = options.priority || TaskPriority.Normal;
    this.inProgress = options.inProgress || false;
    this.isCanceled = options.isCanceled || false;
    this.isCompleted = options.isCompleted || false;
    this.duedate = options.duedate || null;
  }

  begin() {
    this.inProgress = !this.inProgress;
  }

  check() {
    this.isCompleted = !this.isCompleted;
  }
}