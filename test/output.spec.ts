import { Taskline } from '../src/taskline';
import { Item } from '../src/item';
import { Task } from '../src/task';
import { Helper } from './helper';
import { Note } from '../src/note';

const helper = new Helper();
const taskline = new Taskline();

const now = new Date();
const yesterday = new Date(now.getTime() - 1000 * 60 * 60 * 24);

describe('Test output functionality', () => {
  //  Disable output
  process.stdout.write = jest.fn();
  // Mock process.stdout.write
  const mockWrite = jest.spyOn(process.stdout, 'write');
  //  Disable output ora problem also jest has no output than
  //  process.stderr.write = jest.fn();

  beforeAll(async done => {
    await helper.clearStorage();
    const promises: Array<Promise<any>> = new Array<Promise<any>>();
    const data: Array<Item> = new Array<Item>();

    data.push(new Note({
      id: 1,
      date: now.toDateString(),
      timestamp: now.getTime(),
      description: 'Test Note',
      isStarred: false,
      boards: ['My Board']
    }));

    data.push(new Task({
      id: 2,
      date: now.toDateString(),
      timestamp: now.getTime(),
      description: 'Test Task',
      isStarred: false,
      boards: ['My Board'],
      dueDate: undefined,
      isComplete: true,
      inProgress: false,
      priority: 1
    }));

    data.push(new Task({
      id: 3,
      date: now.toDateString(),
      timestamp: now.getTime(),
      description: 'Second Test Task',
      isStarred: true,
      boards: ['My Board'],
      dueDate: undefined,
      isComplete: false,
      inProgress: false,
      priority: 1
    }));

    data.push(new Task({
      id: 4,
      date: yesterday.toDateString(),
      timestamp: yesterday.getTime(),
      description: 'Third Test Task',
      isStarred: true,
      boards: ['Other Board'],
      dueDate: undefined,
      isComplete: false,
      inProgress: false,
      priority: 3
    }));

    promises.push(helper.setData(data));
    const archive: Array<Item> = new Array<Item>();

    archive.push(new Task({
      id: 1,
      date: now.toDateString(),
      timestamp: now.getTime(),
      description: 'Deleted Task',
      isStarred: false,
      boards: ['My Board'],
      dueDate: undefined,
      isComplete: true,
      inProgress: false,
      priority: 1
    }))

    promises.push(helper.setArchive(archive));
    await Promise.all(promises)
    done();
  });

  // Run only under linux
  if (process.platform === "linux") {
    it('should display by board', () => {
      mockWrite.mockClear();

      return taskline.displayByBoard().then(() => {
        expect(mockWrite.mock.calls.length).toBe(6);
        expect(mockWrite.mock.calls[0][0]).toBe(
          '\n  [4mMy Board[24m [90m[1/2][39m\n'
        );
        expect(mockWrite.mock.calls[1][0]).toBe(
          '    [90m1.[39m [34m● [39m Test Note\n'
        );
        expect(mockWrite.mock.calls[2][0]).toBe(
          '    [90m2.[39m [32m✔ [39m [90mTest Task[39m\n'
        );
        expect(mockWrite.mock.calls[3][0]).toBe(
          '    [90m3.[39m [35m☐ [39m Second Test Task [33m★[39m\n'
        );
        expect(mockWrite.mock.calls[4][0]).toBe(
          '\n  [4mOther Board[24m [90m[0/1][39m\n'
        );
        expect(mockWrite.mock.calls[5][0]).toBe(
          '    [90m4.[39m [35m☐ [39m [31m[4mThird Test Task[24m[39m [31m(!!)[39m [90m1d[39m [33m★[39m\n'
        );
      });
    });

    it('should display by date', () => {
      mockWrite.mockClear();

      return taskline.displayByDate().then(() => {
        expect(mockWrite.mock.calls[0][0]).toBe(
          '\n  [4m' + now.toDateString() + '[24m [90m[Today][39m [90m[1/2][39m\n'
        );
        expect(mockWrite.mock.calls[1][0]).toBe(
          '    [90m1.[39m [34m● [39m Test Note  \n'
        );
        expect(mockWrite.mock.calls[2][0]).toBe(
          '    [90m2.[39m [32m✔ [39m [90mTest Task[39m  \n'
        );
        expect(mockWrite.mock.calls[3][0]).toBe(
          '    [90m3.[39m [35m☐ [39m Second Test Task  [33m★[39m\n'
        );
        expect(mockWrite.mock.calls[4][0]).toBe(
          '\n  [4m' + yesterday.toDateString() + '[24m [90m[0/1][39m\n'
        );
        expect(mockWrite.mock.calls[5][0]).toBe(
          '    [90m4.[39m [35m☐ [39m [31m[4mThird Test Task[24m[39m [31m(!!)[39m [90mOther Board[39m [33m★[39m\n'
        );
      });
    });

    it('should display stats', () => {
      return taskline.displayByBoard().then(grouped => {
        mockWrite.mockClear();

        taskline.displayStats(grouped);
        expect(mockWrite.mock.calls[0][0]).toBe(
          '\n  [90m33% of all tasks complete.[39m\n'
        );
        expect(mockWrite.mock.calls[1][0]).toBe(
          '  [32m1[39m [90mdone[39m[90m · [39m[31m0[39m [90mcanceled[39m[90m · [39m[34m0[39m [90min-progress[39m[90m · [39m[35m2[39m [90mpending[39m[90m · [39m[34m1[39m [90mnote[39m \n\n'
        );
      });
    });

    it('should display archive', () => {
      mockWrite.mockClear();

      return taskline.displayArchive().then(() => {
        expect(mockWrite.mock.calls[0][0]).toBe(
          '\n  [4m' + now.toDateString() + '[24m [90m[Today][39m [90m[1/1][39m\n'
        );
        expect(mockWrite.mock.calls[1][0]).toBe(
          '    [90m1.[39m [32m✔ [39m [90mDeleted Task[39m  \n'
        );
      });
    });
  }

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
      expect(grouped['My Board'].length).toBe(1);
      expect(grouped['Other Board'].length).toBe(1);
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

  it('should display only canceled tasks', () => {
    process.stdout.write = jest.fn();

    return taskline.listByAttributes('canceled').then(grouped => {
      expect(grouped['My Baard']).toBe(undefined);
      expect(grouped['Other Board']).toBe(undefined);
    })
  })

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
