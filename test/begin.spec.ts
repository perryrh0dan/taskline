import { Taskline } from '../src/taskline';
import { Item } from '../src/item';
import { Task } from '../src/task';
import { Helper } from './helper';
import { Note } from '../src/note';

const helper = new Helper();
helper.setConfig();
const taskline = new Taskline();

describe('Test begin functionality', () => {
  //  Disable output
  process.stdout.write = jest.fn();
  //  Disable output ora problem also jest has no output than
  //  process.stderr.write = jest.fn();

  beforeAll(async done => {
    await helper.clearStorage();
    const data: Array<Item> = new Array<Item>();
    data.push(new Note({
      id: 1,
      date: 'Mon Sep 02 2019',
      timestamp: 1567434272855,
      description: 'Test Note',
      isStarred: false,
      boards: ['My Board']
    }));
    data.push(new Task({
      id: 2,
      date: 'Mon Sep 02 2019',
      timestamp: 1567434272855,
      description: 'Test Task',
      isStarred: false,
      boards: ['My Board'],
      dueDate: 0,
      isComplete: false,
      inProgress: false,
      priority: 1
    }));
    data.push(new Task({
      id: 3,
      date: 'Mon Sep 02 2019',
      timestamp: 1567434272855,
      description: 'Second Test Task',
      isStarred: false,
      boards: ['My Board'],
      dueDate: 0,
      isComplete: false,
      inProgress: false,
      priority: 1
    }));

    await helper.setData(data);
    done();
  });

  it('should begin one task', () => {
    return taskline.beginTasks('2').then(() => {
      return helper.getData().then((data: Array<Item>) => {
        const item_2: Task = data.find((x: Item) => { return x.id === 2 }) as Task;
        expect(item_2.inProgress).toBe(true);
        expect(item_2.isCanceled).toBe(false);
        expect(item_2.isComplete).toBe(false);
      });
    });
  });

  it('should begin multiple tasks', () => {
    return taskline.beginTasks('2,3').then(() => {
      return helper.getData().then((data: any) => {
        const item_2: Task = data.find((x: Item) => { return x.id === 2 }) as Task;
        const item_3: Task = data.find((x: Item) => { return x.id === 3 }) as Task;
        expect(item_2.inProgress).toBe(false);
        expect(item_2.isCanceled).toBe(false);
        expect(item_2.isComplete).toBe(false);
        expect(item_3.inProgress).toBe(true);
        expect(item_3.isCanceled).toBe(false);
        expect(item_3.isComplete).toBe(false);
      });
    });
  });

  it('should begin multiple tasks by id range', () => {
    return taskline.beginTasks('2-3').then(() => {
      return helper.getData().then((data: any) => {
        const item_2: Task = data.find((x: Item) => { return x.id === 2 }) as Task;
        const item_3: Task = data.find((x: Item) => { return x.id === 3 }) as Task;
        expect(item_2.inProgress).toBe(true);
        expect(item_2.isComplete).toBe(false);
        expect(item_3.inProgress).toBe(false);
        expect(item_3.isComplete).toBe(false);
      });
    });
  });

  // it('should try to begin a note', () => {
  //   return taskline.beginTasks('1').then(() => {
  //     return helper.getData().then((data: any) => {
  //       const item_1: Note = data.find(x => { return x.id === 1 }) as Task;        
  //       expect(data[1].inProgress).toBe(undefined);
  //       expect(data[1].isComplete).toBe(undefined);
  //     });
  //   });
  // });

  it('should try to begin nonexisting item', () => {
    expect(taskline.beginTasks('4')).rejects.toMatchObject({
      message: 'Invalid InputIDs'
    });
  });

  it('should try to begin with invalid id range', () => {
    expect(taskline.checkTasks('1-b')).rejects.toMatchObject({
      message: 'Invalid Input ID Range'
    });
  });

  it('should try to begin with invalid character as id', () => {
    expect(taskline.checkTasks('ö')).rejects.toMatchObject({
      message: 'Invalid InputIDs'
    });
  });

  afterAll(done => {
    helper.resetConfig();
    done();
  });
});
