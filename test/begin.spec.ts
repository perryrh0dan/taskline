import { Taskline } from '../src/taskline';
import { Item } from '../src/item';
import { Task } from '../src/task';
import { Helper } from './helper';
import { Note } from '../src/note';

const helper = new Helper();
const taskline = new Taskline();

describe('Test begin functionality', () => {
  //  Disable output
  process.stdout.write = jest.fn();
  //  Disable output ora problem also jest has no output than
  //  process.stderr.write = jest.fn();

  beforeAll(async done => {
    await helper.clearStorage();
    const data: Array<Item> = new Array<Item>();

    data.push(
      new Note({
        id: 1,
        date: 'Mon Sep 02 2019',
        timestamp: 1567434272855,
        description: 'Test Note',
        isStarred: false,
        boards: ['My Board']
      })
    );

    data.push(
      new Task({
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
      })
    );

    data.push(
      new Task({
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
      })
    );

    await helper.setData(data);
    done();
  });

  it('should begin one task', async() => {
    const now = new Date();
    const oldData: Array<Item> = await helper.getData([2]);
    const oldTask: Task = oldData[0] as Task;

    await taskline.beginTasks('2');

    const data: Array<Item> = await helper.getData([2]);
    const task: Task = data[0] as Task;

    expect(task.inProgress).toBe(true);
    expect(task.isCanceled).toBe(false);
    expect(task.isComplete).toBe(false);
    expect(task.lastStartTime).toBeGreaterThan(now.getTime());
    expect(task.passedTime).toBe(oldTask.passedTime);
  });

  it('should pause one task', async() => {
    const now = new Date();
    const oldData: Array<Item> = await helper.getData([2]);
    const oldTask: Task = oldData[0] as Task;

    await taskline.beginTasks('2');

    const data: Array<Item> = await helper.getData([2]);
    const task: Task = data[0] as Task;

    expect(task.inProgress).toBe(false);
    expect(task.isCanceled).toBe(false);
    expect(task.isComplete).toBe(false);
    expect(task.passedTime).toBeGreaterThanOrEqual(oldTask.passedTime + now.getTime() - oldTask.lastStartTime);
    expect(task.lastStartTime).toBe(0);
  });

  it('should continue one task', async() => {
    const now = new Date();
    const oldData: Array<Item> = await helper.getData([2]);
    const oldTask: Task = oldData[0] as Task;

    await taskline.beginTasks('2');

    const data: Array<Item> = await helper.getData([2]);
    const task: Task = data[0] as Task;

    expect(task.inProgress).toBe(true);
    expect(task.isCanceled).toBe(false);
    expect(task.isComplete).toBe(false);
    expect(task.passedTime).toBe(oldTask.passedTime);
    expect(task.lastStartTime).toBeGreaterThanOrEqual(
      now.getTime()
    );
  });

  it('should begin multiple tasks', async() => {
    const now = new Date();
    const oldData: Array<Item> = await helper.getData([2, 3]);

    await taskline.beginTasks('2,3');

    const data: Array<Item> = await helper.getData([2, 3]);

    expect((data[0] as Task).inProgress).toBe(false);
    expect((data[0] as Task).isCanceled).toBe(false);
    expect((data[0] as Task).isComplete).toBe(false);
    expect((data[0] as Task).passedTime).toBeGreaterThanOrEqual((oldData[0] as Task).passedTime + now.getTime() - (oldData[0] as Task).lastStartTime);
    expect((data[0] as Task).lastStartTime).toBe(0);
    expect((data[1] as Task).inProgress).toBe(true);
    expect((data[1] as Task).isCanceled).toBe(false);
    expect((data[1] as Task).isComplete).toBe(false);
    expect((data[1] as Task).passedTime).toBe((oldData[1] as Task).passedTime);
    expect((data[1] as Task).lastStartTime).toBeGreaterThanOrEqual(
      now.getTime()
    );
  });

  it('should begin multiple tasks by id range', async() => {
    await taskline.beginTasks('2-3');
    const data: Array<Item> = await helper.getData([2, 3]);
    expect((data[0] as Task).inProgress).toBe(true);
    expect((data[0] as Task).isComplete).toBe(false);
    expect((data[1] as Task).inProgress).toBe(false);
    expect((data[1] as Task).isComplete).toBe(false);
  });

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
