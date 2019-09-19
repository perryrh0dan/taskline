import { Taskline } from '../src/taskline';
import { Task } from '../src/task';
import { Helper } from './helper';
import { Note } from '../src/note';
import { Item } from '../src/item';

const helper = new Helper();
const taskline = new Taskline();

describe('Test edit functionality', () => {
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
      dueDate: undefined,
      isComplete: false,
      inProgress: false,
      priority: 1
    }));

    await helper.setData(data);
    done();
  });

  it('should edit description of one item', () => {
    return taskline.editDescription('2', 'Edited Test Task').then(() => {
      return helper.getData([2]).then(data => {
        expect(data[0].description).toBe('Edited Test Task');
      });
    });
  });

  it('should try to edit description of nonexistent item', () => {
    return expect(
      taskline.editDescription('4', 'Try Edit Test Task')
    ).rejects.toMatchObject({
      message: 'Invalid InputID'
    });
  });

  afterAll(done => {
    helper.resetConfig();
    done();
  });
});
