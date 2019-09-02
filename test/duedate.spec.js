const Taskline = require('../src/taskline');
const helper = require('./helper');

helper.setConfig();
const taskline = new Taskline();

describe('Test duedate functionality', () => {
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

  it('should update duedate of task', () => {
    return taskline.updateDueDate('2', '02.09.2019').then(() => {
      return storage.get().then(data => {
        expect(data[2].dueDate).toBe(1567461599000);
      });
    });
  });

  it('should try to update duedate of note', () => {
    return taskline.updateDueDate('1', '02.09.2019').then(() => {
      return storage.get().then(data => {
        expect(data[1].dueDate).toBe(undefined);
      });
    });
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
