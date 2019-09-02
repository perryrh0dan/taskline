const Taskline = require('../src/taskline');
const helper = require('./helper');

helper.setConfig();
const taskline = new Taskline();

describe('Test output functionality', () => {
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
        isComplete: true,
        inProgress: false,
        priority: 1
      },
      3: {
        _id: 3,
        _date: 'Mon Sep 02 2019',
        _timestamp: 1567434272855,
        description: 'Second Test Task',
        isStarred: true,
        boards: ['My Board'],
        _isTask: true,
        dueDate: null,
        isComplete: false,
        inProgress: false,
        priority: 1
      }
    });
  });

  it('should display by board', () => {
    process.stdout.write = jest.fn();

    taskline.displayByBoard().then(() => {
      expect(process.stdout.write.mock.calls.length).toBe(4);
      expect(process.stdout.write.mock.calls[0][0]).toBe(
        '\n  [4mMy Board[24m [90m[1/2][39m\n'
      );
      expect(process.stdout.write.mock.calls[1][0]).toBe(
        '    [90m1.[39m [34m● [39m Test Note\n'
      );
      expect(process.stdout.write.mock.calls[2][0]).toBe(
        '    [90m2.[39m [32m✔ [39m [90mTest Task[39m\n'
      );
      expect(process.stdout.write.mock.calls[3][0]).toBe(
        '    [90m3.[39m [35m☐ [39m Second Test Task [33m★[39m\n'
      );
    });
  });

  it('should display by date', () => {
    process.stdout.write = jest.fn();

    taskline.displayByDate().then(() => {
      expect(process.stdout.write.mock.calls[0][0]).toBe(
        '\n  [4mMon Sep 02 2019[24m [90m[Today][39m [90m[1/2][39m\n'
      );
      expect(process.stdout.write.mock.calls[1][0]).toBe(
        '    [90m1.[39m [34m● [39m Test Note  \n'
      );
      expect(process.stdout.write.mock.calls[2][0]).toBe(
        '    [90m2.[39m [32m✔ [39m [90mTest Task[39m  \n'
      );
      expect(process.stdout.write.mock.calls[3][0]).toBe(
        '    [90m3.[39m [35m☐ [39m Second Test Task  [33m★[39m\n'
      );
    });
  });

  it('should display stats', () => {
    taskline.displayByBoard().then(grouped => {
      process.stdout.write = jest.fn();

      taskline.displayStats(grouped);
      expect(process.stdout.write.mock.calls[0][0]).toBe(
        '\n  [90m[33m50%[90m of all tasks complete.[39m\n'
      );
      expect(process.stdout.write.mock.calls[1][0]).toBe(
        '  [32m1[39m [90mdone[39m[90m · [39m[34m0[39m [90min-progress[39m[90m · [39m[35m1[39m [90mpending[39m[90m · [39m[34m1[39m [90mnote[39m \n\n');
    });
  });

  it('should display only tasks', () => {
    process.stdout.write = jest.fn();

    taskline.listByAttributes('tasks').then(grouped => {
      expect(grouped['My Board'].length).toBe(2);
    });
  });

  it('should display only notes', () => {
    process.stdout.write = jest.fn();

    taskline.listByAttributes('note').then(grouped => {
      expect(grouped['My Board'].length).toBe(1);
    });
  });

  it('should display only starred items', () => {
    process.stdout.write = jest.fn();

    taskline.listByAttributes('star').then(grouped => {
      expect(grouped).toMatchObject({});
    });
  });

  it('should display only done tasks', () => {
    process.stdout.write = jest.fn();

    taskline.listByAttributes('done').then(grouped => {
      expect(grouped['My Board'].length).toBe(1);
    });
  });

  afterAll(done => {
    helper.resetConfig();
    done();
  });
});
