import { Taskline } from '../src/taskline';
import { Item } from '../src/item';
import { Task } from '../src/task';
import { Helper } from './helper';
import { Note } from '../src/note';

const helper = new Helper();
helper.setConfig();
const taskline = new Taskline();

describe('Test check functionality', () => {
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
    data.push(new Task({
      id: 4,
      date: 'Mon Sep 02 2019',
      timestamp: 1567434272855,
      description: 'Third Test Task',
      isStarred: false,
      boards: ['My Board'],
      dueDate: 0,
      isComplete: false,
      inProgress: false,
      isCanceled: false,
      priority: 1
    }));
    await helper.setData(data);
    done();
  });

  it('should cancel one task', () => {
    return taskline.cancelTasks('2').then(() => {
      return helper.getData().then(data => {
        const item_2: Task = data.find((x: Item) => { return x.id === 2 }) as Task;
        expect(item_2.inProgress).toBe(false);
        expect(item_2.isCanceled).toBe(true);
        expect(item_2.isComplete).toBe(false);
      });
    });
  });

  it('should cancel multiple tasks', () => {
    return taskline.cancelTasks('3,4').then(() => {
      return helper.getData().then(data => {
        const item_3: Task = data.find((x: Item) => { return x.id === 3 }) as Task;
        const item_4: Task = data.find((x: Item) => { return x.id === 4 }) as Task;
        expect(item_3.inProgress).toBe(false);
        expect(item_3.isCanceled).toBe(true);
        expect(item_3.isComplete).toBe(false);
        expect(item_4.inProgress).toBe(false);
        expect(item_4.isCanceled).toBe(true);
        expect(item_4.isComplete).toBe(false);
      });
    });
  });

  it('should cancel multiple tasks by id range', () => {
    return taskline.cancelTasks('2-4').then(() => {
      return helper.getData().then(data => {
        const item_2: Task = data.find((x: Item) => { return x.id === 2 }) as Task;
        const item_3: Task = data.find((x: Item) => { return x.id === 3 }) as Task;
        const item_4: Task = data.find((x: Item) => { return x.id === 4 }) as Task;
        expect(item_2.isCanceled).toBe(false);
        expect(item_3.isCanceled).toBe(false);
        expect(item_4.isCanceled).toBe(false);
      });
    });
  });

  it('should cancel multiple tasks by id range and list', () => {
    return taskline.cancelTasks('2,3-4').then(() => {
      return helper.getData().then(data => {
        const item_2: Task = data.find((x: Item) => { return x.id === 2 }) as Task;
        const item_3: Task = data.find((x: Item) => { return x.id === 3 }) as Task;
        const item_4: Task = data.find((x: Item) => { return x.id === 4 }) as Task;
        expect(item_2.isCanceled).toBe(true);
        expect(item_3.isCanceled).toBe(true);
        expect(item_4.isCanceled).toBe(true);
      });
    });
  });

  it('should delete all canceled tasks', () => {
    return helper.getData().then(data => {
      const oldData_2: Task = data.find((x: Item) => { return x.id === 2 }) as Task;
      const oldData_3: Task = data.find((x: Item) => { return x.id === 3 }) as Task;
      const oldData_4: Task = data.find((x: Item) => { return x.id === 4 }) as Task;

      return taskline.clear().then(() => {
        return helper.getData().then(data => {
          return helper.getArchive().then(archive => {
            const data_2: Task = data.find((x: Item) => { return x.id === 2 }) as Task;
            const data_3: Task = data.find((x: Item) => { return x.id === 3 }) as Task;
            const data_4: Task = data.find((x: Item) => { return x.id === 4 }) as Task;
            const archive_1: Task = data.find((x: Item) => { return x.id === 1 }) as Task;
            const archive_2: Task = data.find((x: Item) => { return x.id === 2 }) as Task;
            const archive_3: Task = data.find((x: Item) => { return x.id === 3 }) as Task;
            expect(data_2).toBe(undefined);
            expect(data_3).toBe(undefined);
            expect(data_4).toBe(undefined);
            oldData_2.id -= 1;
            expect(archive_1).toMatchObject(oldData_2);
            oldData_3.id -= 1;
            expect(archive_2).toMatchObject(oldData_3);
            oldData_4.id -= 1;
            expect(archive_3).toMatchObject(oldData_4);
          });
        });
      });
    });
  });

  // it('should try to cancel a note', () => {
  //   return taskline.cancelTasks('1').then(() => {
  //     return helper.getData().then(data => {
  //       expect(data[1].isCanceled).toBe(undefined);
  //     });
  //   });
  // });

  it('should try to cancel a nonexisting item', () => {
    expect(taskline.cancelTasks('5')).rejects.toMatchObject({
      message: 'Invalid InputIDs'
    });
  });

  it('should try to cancel with invalid id range', () => {
    expect(taskline.cancelTasks('1-b')).rejects.toMatchObject({
      message: 'Invalid Input ID Range'
    });
  });

  afterAll(done => {
    helper.resetConfig();
    done();
  });
});
