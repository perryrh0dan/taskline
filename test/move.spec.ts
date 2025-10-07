import { Taskline } from '../src/taskline';
import { Task } from '../src/task';
import { Helper } from './helper';
import { Note } from '../src/note';
import { Item } from '../src/item';

const helper = new Helper();
const taskline = new Taskline();

describe('Test move functionality', () => {
  //  Disable output
  process.stdout.write = jest.fn();
  //  Disable output ora problem also jest has no output than
  //  process.stderr.write = jest.fn();

  beforeAll(async () => {
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
      dueDate: undefined,
      isComplete: false,
      inProgress: false,
      priority: 1
    }));

    await helper.setData(data);
  });

  it('should move an item to one board', async () => {
    await taskline.moveBoards('1', 'test');
    const data = await helper.getData([1]);
    expect(data[0].boards.toString()).toBe('test');
  });

  it('should move an item to multiple boards', async () => {
    await taskline.moveBoards('1', 'test,test2');
    const data = await helper.getData([1]);
    expect(data[0].boards.toString()).toBe('test,test2');
  });

  it('should move multiple items to multiple boards', async () => {
    await taskline.moveBoards('1,2', 'test,test2');
    const data = await helper.getData([1, 2]);
    expect(data[0].boards).toMatchObject(['test', 'test2']);
    expect(data[1].boards).toMatchObject(['test', 'test2']);
  });

  it('should try to move nonexisting item', () => {
    expect(taskline.moveBoards('5', 'test')).rejects.toMatchObject({
      message: 'Invalid InputIDs',
    });
  });

  afterAll(() => {
    helper.resetConfig();
  });
});
