import { Taskline } from '../dist/src/taskline';
const helper = require('./helper');

helper.setConfig();
const taskline = new Taskline();

const now = new Date();
const yesterday = new Date(now.getTime() - 1000 * 60 * 60 * 24);

describe('Test output functionality', () => {
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
        _date: now.toDateString(),
        _timestamp: now.getTime(),
        description: 'Test Note',
        isStarred: false,
        boards: ['My Board'],
        _isTask: false
      },
      2: {
        _id: 2,
        _date: now.toDateString(),
        _timestamp: now.getTime(),
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
        _date: now.toDateString(),
        _timestamp: now.getTime(),
        description: 'Second Test Task',
        isStarred: true,
        boards: ['My Board'],
        _isTask: true,
        dueDate: null,
        isComplete: false,
        inProgress: false,
        priority: 1
      },
      4: {
        _id: 4,
        _date: yesterday.toDateString(),
        _timestamp: yesterday.getTime(),
        description: 'Third Test Task',
        isStarred: true,
        boards: ['Other Board'],
        _isTask: true,
        dueDate: null,
        isComplete: false,
        inProgress: false,
        priority: 3
      }
    });
    await storage.setArchive({
      1: {
        _id: 1,
        _date: now.toDateString(),
        _timestamp: now.getTime(),
        description: 'Deleted Task',
        isStarred: false,
        boards: ['My Board'],
        _isTask: true,
        dueDate: null,
        isComplete: true,
        inProgress: false,
        priority: 1
      }
    });
    done();
  });

  it('should display by board', () => {
    process.stdout.write = jest.fn();

    return taskline.displayByBoard().then(() => {
      expect(process.stdout.write.mock.calls.length).toBe(6);
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
      expect(process.stdout.write.mock.calls[4][0]).toBe(
        '\n  [4mOther Board[24m [90m[0/1][39m\n'
      );
      expect(process.stdout.write.mock.calls[5][0]).toBe(
        '    [90m4.[39m [35m☐ [39m [4m[31mThird Test Task[39m[24m [31m(!!)[39m [90m1d[39m [33m★[39m\n'
      );
    });
  });

  it('should display by date', () => {
    process.stdout.write = jest.fn();

    return taskline.displayByDate().then(() => {
      expect(process.stdout.write.mock.calls[0][0]).toBe(
        '\n  [4m' + now.toDateString() + '[24m [90m[Today][39m [90m[1/2][39m\n'
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
      expect(process.stdout.write.mock.calls[4][0]).toBe(
        '\n  [4m' + yesterday.toDateString() + '[24m [90m[0/1][39m\n'
      );
      expect(process.stdout.write.mock.calls[5][0]).toBe(
        '    [90m4.[39m [35m☐ [39m [4m[31mThird Test Task[39m[24m [31m(!!)[39m [90mOther Board[39m [33m★[39m\n'
      );
    });
  });

  it('should display stats', () => {
    return taskline.displayByBoard().then(grouped => {
      process.stdout.write = jest.fn();

      taskline.displayStats(grouped);
      expect(process.stdout.write.mock.calls[0][0]).toBe(
        '\n  [90m33% of all tasks complete.[39m\n'
      );
      expect(process.stdout.write.mock.calls[1][0]).toBe(
        '  [32m1[39m [90mdone[39m[90m · [39m[34m0[39m [90min-progress[39m[90m · [39m[35m2[39m [90mpending[39m[90m · [39m[34m1[39m [90mnote[39m \n\n'
      );
    });
  });

  it('should display archive', () => {
    process.stdout.write = jest.fn();

    return taskline.displayArchive().then(() => {
      expect(process.stdout.write.mock.calls[0][0]).toBe(
        '\n  [4m' + now.toDateString() + '[24m [90m[Today][39m [90m[1/1][39m\n'
      );
      expect(process.stdout.write.mock.calls[1][0]).toBe(
        '    [90m1.[39m [32m✔ [39m [90mDeleted Task[39m  \n'
      );
    });
  });

  it('should display only tasks', () => {
    process.stdout.write = jest.fn();

    return taskline.listByAttributes('tasks').then(grouped => {
      expect(grouped['My Board'].length).toBe(2);
    });
  });

  it('should display only notes', () => {
    process.stdout.write = jest.fn();

    return taskline.listByAttributes('note').then(grouped => {
      expect(grouped['My Board'].length).toBe(1);
    });
  });

  it('should display only starred items', () => {
    process.stdout.write = jest.fn();

    return taskline.listByAttributes('star').then(grouped => {
      expect(grouped).toMatchObject({});
    });
  });

  it('should display only done tasks', () => {
    process.stdout.write = jest.fn();

    return taskline.listByAttributes('done').then(grouped => {
      expect(grouped['My Board'].length).toBe(1);
    });
  });

  it('should display only high priority tasks', () => {
    process.stdout.write = jest.fn();

    return taskline.listByAttributes('high').then(grouped => {
      expect(grouped['My Board']).toBe(undefined);
      expect(grouped['Other Board'].length).toBe(1);
    });
  });

  it('should display only pending tasks', () => {
    process.stdout.write = jest.fn();

    return taskline.listByAttributes('pending').then(grouped => {
      expect(grouped['My Board'].length).toBe(1);
      expect(grouped['Other Board'].length).toBe(1);
    });
  });

  it('should display only items with the keyword Third', () => {
    process.stdout.write = jest.fn();

    return taskline.findItems('Third').then(grouped => {
      expect(grouped['Other Board'].length).toBe(1);
      expect(grouped['My Board']).toBe(undefined);
    });
  });

  it('should try to display items with the keyword Fourth', () => {
    process.stdout.write = jest.fn();

    return taskline.findItems('Fourth').then(grouped => {
      expect(grouped['My Board']).toBe(undefined);
      expect(grouped['Other Board']).toBe(undefined);
    });
  });

  afterAll(done => {
    helper.resetConfig();
    done();
  });
});
