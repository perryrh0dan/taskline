const Taskline = require('../src/taskline');
const helper = require('./helper');

helper.setConfig();
const taskline = new Taskline();

describe('Test move functionality', () => {
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
      }
    });
  });

  it('should move an item to one board', () => {
    return taskline.moveBoards('1', 'test').then(() => {
      return storage.get().then(data => {
        expect(data[1].boards.toString()).toBe('test');
      });
    });
  });

  it('should move an item to multiple boards', () => {
    return taskline.moveBoards('1', 'test,test2').then(() => {
      return storage.get().then(data => {
        expect(data[1].boards.toString()).toBe('test,test2');
      });
    });
  });

  it('should move multiple items to multiple boards', () => {
    return taskline.moveBoards('1,2', 'test,test2').then(() => {
      return storage.get().then(data => {
        expect(data[1].boards).toMatchObject(['test', 'test2']);
        expect(data[2].boards).toMatchObject(['test', 'test2']);
      });
    });
  });

  afterAll(done => {
    helper.resetConfig();
    done();
  });
});
