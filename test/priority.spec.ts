import { Taskline } from '../src/taskline';
import { Item } from '../src/item';
import { Task } from '../src/task';
import { Helper } from './helper';
import { Note } from '../src/note';

const helper = new Helper();
const taskline = new Taskline();

describe('Test priority functionality', () => {
  //  Disable output
  process.stdout.write = jest.fn();
  //  Disable output ora problem also jest has no output than
  //  process.stderr.write = jest.fn();

  beforeAll(async () => {
    await helper.clearStorage();
    const data: Array<Item> = new Array<Item>();

    data.push(
      new Note({
        id: 1,
        date: 'Mon Sep 02 2019',
        timestamp: 1567434272855,
        description: 'Test Note',
        isStarred: false,
        boards: ['My Board'],
      }),
    );

    data.push(
      new Task({
        id: 2,
        date: 'Mon Sep 02 2019',
        timestamp: 1567434272855,
        description: 'Test Task',
        isStarred: false,
        boards: ['My Board'],
        dueDate: undefined,
        isComplete: false,
        inProgress: false,
        priority: 1,
      }),
    );

    data.push(
      new Task({
        id: 3,
        date: 'Mon Sep 02 2019',
        timestamp: 1567434272855,
        description: 'Second Test Task',
        isStarred: false,
        boards: ['My Board'],
        dueDate: undefined,
        isComplete: false,
        inProgress: false,
        priority: 1,
      }),
    );

    await helper.setData(data);
  });

  it('should change priority of task', async () => {
    await taskline.updatePriority('2', '3');
    const data = await helper.getData([2]);
    expect((data[0] as Task).priority).toBe(3);
  });

  it('should try to change priority of task', async () => {
    await taskline.updatePriority('1', '3');
    const data = await helper.getData([1]);
    expect(data[0] instanceof Note).toBe(true);
  });

  it('should try to change to nonexisting priority', () => {
    return expect(taskline.updatePriority('3', '4')).rejects.toMatchObject({
      message: 'Invalid Priority',
    });
  });

  it('should try to change priority of nonexisting item', () => {
    return expect(taskline.updatePriority('4', '3')).rejects.toMatchObject({
      message: 'Invalid InputIDs',
    });
  });

  afterAll((done) => {
    helper.resetConfig();
    done();
  });
});
