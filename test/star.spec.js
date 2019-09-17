import { Taskline } from '../dist/src/taskline';
const helper = require('./helper');

helper.setConfig();
const taskline = new Taskline();

describe('Test Taskline module', () => {
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

  it('should star one item', () => {
    return taskline.starItems('1').then(() => {
      return storage.get().then(data => {
        expect(data[1].isStarred).toBe(true);
      });
    });
  });

  it('should star multiple items', () => {
    return taskline.starItems('1,2').then(() => {
      return storage.get().then(data => {
        expect(data[1].isStarred).toBe(false);
        expect(data[2].isStarred).toBe(true);
      });
    });
  });

  it('should try to star nonexisting item', () => {
    expect(taskline.starItems('3')).rejects.toMatchObject({
      message: 'Invalid InputIDs'
    });
  });

  afterAll(done => {
    helper.resetConfig();
    done();
  });
});
