import { Taskline } from '../src/taskline';
import { Item } from '../src/item';
import { Task } from '../src/task';
import { Helper } from './helper';
import { Note } from '../src/note';

const helper = new Helper();
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
      boards: ['My Board'],
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
      priority: 1
    }));

    data.push(new Task({
      id: 5,
      date: 'Mon Sep 02 2019',
      timestamp: 1567434272855,
      description: 'Third Test Task',
      isStarred: false,
      boards: ['My Board'],
      dueDate: 0,
      isComplete: false,
      inProgress: false,
      priority: 1
    }));

    data.push(new Task({
      id: 6,
      date: 'Mon Sep 02 2019',
      timestamp: 1567434272855,
      description: 'Fourth Test Task',
      isStarred: false,
      boards: ['My Board'],
      dueDate: 0,
      isComplete: false,
      inProgress: true,
      isCanceled: false,
      priority: 1,
      passedTime: 200,
      lastStartTime: new Date().getTime(),
    }));

    await helper.setData(data);
    done();
  });

  it('should check one task', async() => {
    await taskline.checkTasks('2');
    const data = await helper.getData([2]);
    expect((data[0] as Task).isComplete).toBe(true);
  });

  it('should check multiple tasks', async() => {
    await taskline.checkTasks('3,4');
    const data = await helper.getData([3, 4]);
    expect((data[0] as Task).isComplete).toBe(true);
    expect((data[1] as Task).isComplete).toBe(true);
  });

  it('should check multiple tasks by id range', async() => {
    await taskline.checkTasks('2-4');
    const data = await helper.getData([2, 3, 4]);
    expect((data[0] as Task).isComplete).toBe(false);
    expect((data[1] as Task).isComplete).toBe(false);
    expect((data[2] as Task).isComplete).toBe(false);
  });

  it('should check multiple tasks by id range and list', async() => {
    await taskline.checkTasks('2,3-4');
    const data = await helper.getData([2, 3, 4]);
    expect((data[0] as Task).isComplete).toBe(true);
    expect((data[1] as Task).isComplete).toBe(true);
    expect((data[2] as Task).isComplete).toBe(true);
  });

  it('should cancel an active task', async() => {
    await taskline.checkTasks('6');
    const data = await helper.getData([6]);
    expect((data[0] as Task).inProgress).toBe(false);
    expect((data[0] as Task).isCanceled).toBe(false);
    expect((data[0] as Task).isComplete).toBe(true);
    expect((data[0] as Task).lastStartTime).toBe(0);
    expect((data[0] as Task).passedTime).toBeGreaterThan(200);
  });


  it('should delete all checked tasks', async() => {
    const data = await helper.getData([2, 3, 4]);
    const oldData = JSON.parse(JSON.stringify(data));
    await taskline.clear();
    const data_1 = await helper.getData();
    const archive = await helper.getArchive();
    expect(data_1.length).toBe(2);
    oldData[0].id -= 1;
    expect(JSON.parse(JSON.stringify(archive[0]))).toMatchObject(oldData[0]);
    oldData[1].id -= 1;
    expect(JSON.parse(JSON.stringify(archive[1]))).toMatchObject(oldData[1]);
    oldData[2].id -= 1;
    expect(JSON.parse(JSON.stringify(archive[2]))).toMatchObject(oldData[2]);
  });

  it('should try to check a nonexisting item', () => {
    expect(taskline.checkTasks('6')).rejects.toMatchObject({
      message: 'Invalid InputIDs'
    });
  });

  it('should try to check with invalid id range', () => {
    expect(taskline.checkTasks('1-b')).rejects.toMatchObject({
      message: 'Invalid Input ID Range'
    });
  });

  afterAll(done => {
    helper.resetConfig();
    done();
  });
});
