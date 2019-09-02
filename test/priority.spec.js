const Taskline = require('../src/taskline');
const helper = require('./helper');

helper.setConfig();
const taskline = new Taskline();

describe('Test priority functionality', () => {
  const storage = helper.getStorage();

  //  Disable output
  process.stdout.write = jest.fn();
  //  Disable output ora problem also jest has no output than
  //  process.stderr.write = jest.fn();

  beforeAll(async done => {
    await helper.clearStorage()
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
    done();
  });

  it('should change priority of task', () => {
    return taskline.updatePriority('2', '3').then(() => {
      return storage.get().then(data => {
        expect(data[2].priority).toBe(3);
      });
    });
  });

  it('should try to change priority of task', () => {
    return taskline.updatePriority('1', '3').then(() => {
      return storage.get().then(data => {
        expect(data[1].priority).toBe(undefined);
      });
    });
  });

  it('should try to change to nonexisting priority', () => {
    return expect(taskline.updatePriority('3', '4')).rejects.toMatchObject({
      message: 'Invalid Priority'
    });
  });

  it('should try to change priority of nonexisting item', () => {
    return expect(taskline.updatePriority('4', '3')).rejects.toMatchObject({
      message: 'Invalid InputIDs'
    });
  });

  afterAll(done => {
    helper.resetConfig();
    done();
  });
});
