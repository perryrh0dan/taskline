const Taskline = require('../src/taskline');
const helper = require('./helper');

helper.setConfig();
const taskline = new Taskline();

describe('Test check functionality', () => {
  const storage = helper.getStorage();

  //  Disable output
  process.stdout.write = jest.fn();
  //  Disable output ora problem also jest has no output than
  //  process.stderr.write = jest.fn();

  beforeAll(done => {
    helper.clearStorage().then(() => {
      done();
    });
    storage.set({
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
      },
      3: {
        _id: 3,
        _date: 'Mon Sep 02 2019',
        _timestamp: 1567434272855,
        description: 'Second Test Task',
        isStarred: false,
        boards: ['My Board'],
        _isTask: true,
        dueDate: null,
        isComplete: false,
        inProgress: false,
        priority: 1
      }
    });
  });

  it('should check a task', () => {
    return taskline.checkTasks('2').then(() => {
      return storage.get().then(data => {
        expect(data[2].isComplete).toBe(true);
      });
    });
  });

  it('should try to check a note', () => {
    return taskline.checkTasks('1').then(() => {
      return storage.get().then(data => {
        expect(data[1].isComplete).toBe(undefined);
      });
    });
  });

  afterAll(done => {
    helper.resetConfig();
    done();
  });
});
