import { addDays, addWeeks, startOfWeek } from 'date-fns';

import { Taskline } from '../src/taskline';
import { Item } from '../src/item';
import { Task } from '../src/task';
import { Helper } from './helper';
import { Note } from '../src/note';

const helper = new Helper();
const taskline = new Taskline();

describe('Test duedate functionality', () => {
  //  Disable output
  process.stdout.write = jest.fn();
  //  Disable output ora problem also jest has no output than
  //  process.stderr.write = jest.fn();

  beforeAll(async done => {
    await helper.init();
    await helper.clearStorage();
    await taskline.init();

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

    data.push(new Task({
      id: 3,
      date: 'Mon Sep 02 2019',
      timestamp: 1567434272855,
      description: 'Second Test Task',
      isStarred: false,
      boards: ['My Board'],
      dueDate: undefined,
      isComplete: false,
      inProgress: false,
      priority: 1
    }));

    await helper.setData(data);
    done();
  });

  it('should update duedate of a task', async() => {
    await taskline.updateDueDate('2', '02.09.2019');
    const data = await helper.getData([2]);
    expect((data[0] as Task).dueDate).toBe(new Date('2019-09-02').setHours(0));
  });

  it('should update duedate of a task with hours and minutes', async() => {
    helper.changeConfig('dateformat', 'dd.mm.yyyy HH:MM');
    await taskline.updateDueDate('2', '02.09.2019 12:30');
    const data = await helper.getData([2]);
    expect((data[0] as Task).dueDate).toBe(new Date('2019-09-02').setHours(12, 30));
  });

  it('should update duedate of a task to tommorrow', async() => {
    await taskline.updateDueDate('2', 'tomorrow');
    const data = await helper.getData([2]);
    expect((data[0] as Task).dueDate).toBe(addDays(new Date(), 1).setHours(18, 0, 0, 0));
  });

  it('should update duedate of a task to next week', async() => {
    await taskline.updateDueDate('2', 'next week');
    const data = await helper.getData([2]);
    expect((data[0] as Task).dueDate).toBe(addWeeks(addDays(startOfWeek(new Date()), 1), 1).setHours(0, 0, 0, 0));
  });

  it('should try to update duedate of a note', async() => {
    await taskline.updateDueDate('1', '02.09.2019');
    const data = await helper.getData([1]);
    expect(data[0] instanceof Note).toBe(true);
  });

  it('should try to update duedate of nonexisting item', () => {
    return expect(
      taskline.updateDueDate('4', '02.09.2019')
    ).rejects.toMatchObject({
      message: 'Invalid InputIDs'
    });
  });

  it('should try to update to invalid duedate', () => {
    return expect(taskline.updateDueDate('2', 'test')).rejects.toMatchObject({
      message: 'Invalid Date Format'
    });
  });

  afterAll(done => {
    helper.resetConfig();
    done();
  });
});
