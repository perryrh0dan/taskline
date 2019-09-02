const Taskline = require('../src/taskline');
const helper = require('./helper');

helper.setConfig();
const taskline = new Taskline();

describe('Test Taskline module', () => {
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

  it('should display By Board', () => {
    process.stdout.write = jest.fn();

    taskline.displayByBoard().then(() => {
      expect(process.stdout.write.mock.calls.length).toBe(4);
      expect(process.stdout.write.mock.calls[0][0]).toBe(
        '\n  [4mMy Board[24m [90m[0/2][39m\n'
      );
      expect(process.stdout.write.mock.calls[1][0]).toBe(
        '    [90m1.[39m [34m* [39m Test Note\n'
      );
    });
  });

  afterAll(done => {
    helper.resetConfig();
    done();
  });
});
