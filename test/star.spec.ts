import { Taskline } from '../src/taskline';
import { Item } from '../src/item';
import { Task } from '../src/task';
import { Helper } from './helper';
import { Note } from '../src/note';

const helper = new Helper();
const taskline = new Taskline();

describe('Test Taskline module', () => {
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

  it('should star one item', async () => {
    await taskline.starItems('1');
    const data = await helper.getData([1]);
    expect(data[0].isStarred).toBe(true);
  });

  it('should star multiple items', async () => {
    await taskline.starItems('1,2');
    const data = await helper.getData([1, 2]);
    expect(data[0].isStarred).toBe(false);
    expect(data[1].isStarred).toBe(true);
  });

  it('should try to star nonexisting item', () => {
    expect(taskline.starItems('3')).rejects.toMatchObject({
      message: 'Invalid InputIDs',
    });
  });

  afterAll(() => {
    helper.resetConfig();
  });
});
