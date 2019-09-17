import { Taskline } from '../dist/src/taskline';
const helper = require('./helper');

helper.setConfig();
const taskline = new Taskline();

describe('Test edit functionality', () => {
  const storage = helper.getStorage();

  //  Disable output
  process.stdout.write = jest.fn();
  //  Disable output ora problem also jest has no output than
  //  process.stderr.write = jest.fn();

  beforeAll(async done => {
    await helper.clearStorage();
    await storage.set({
      1: {
        _id: 1,
        _date: 'Mon Sep 02 2019',
        _timestamp: 1567434272855,
        description: 'Test Note',
        isStarred: false,
        boards: ['My Board'],
        _isTask: false
      },
      2: {
        _id: 2,
        _date: 'Mon Sep 02 2019',
        _timestamp: 1567434272855,
        description: 'Test Task',
        isStarred: false,
        boards: ['My Board'],
        _isTask: true,
        dueDate: null,
        isComplete: false,
        inProgress: false,
        priority: 1
      }
    });
    done();
  });

  it('should edit description of one item', () => {
    return taskline.editDescription('2', 'Edited Test Task').then(() => {
      return storage.get().then(data => {
        expect(data[2].description).toBe('Edited Test Task');
      });
    });
  });

  it('should try to edit description if nonexistent item', () => {
    return expect(
      taskline.editDescription('4', 'Try Edit Test Task')
    ).rejects.toMatchObject({
      message: 'Invalid InputIDs'
    });
  });

  afterAll(done => {
    helper.resetConfig();
    done();
  });
});
