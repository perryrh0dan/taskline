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
      },
      4: {
        _id: 4,
        _date: 'Mon Sep 02 2019',
        _timestamp: 1567434272855,
        description: 'Third Test Task',
        isStarred: false,
        boards: ['My Board'],
        _isTask: true,
        dueDate: null,
        isComplete: false,
        inProgress: false,
        isCanceled: false,
        priority: 1
      }
    });
    done();
  });

  it('should cancel one task', () => {
    return taskline.cancelTasks('2').then(() => {
      return storage.get().then(data => {
        expect(data[2].inProgress).toBe(false);
        expect(data[2].isCanceled).toBe(true);
        expect(data[2].isComplete).toBe(false);
      });
    });
  });

  it('should cancel multiple tasks', () => {
    return taskline.cancelTasks('3,4').then(() => {
      return storage.get().then(data => {
        expect(data[3].inProgress).toBe(false);
        expect(data[3].isCanceled).toBe(true);
        expect(data[3].isComplete).toBe(false);
        expect(data[4].inProgress).toBe(false);
        expect(data[4].isCanceled).toBe(true);
        expect(data[4].isComplete).toBe(false);
      });
    });
  });

  it('should cancel multiple tasks by id range', () => {
    return taskline.cancelTasks('2-4').then(() => {
      return storage.get().then(data => {
        expect(data[2].isCanceled).toBe(false);
        expect(data[3].isCanceled).toBe(false);
        expect(data[4].isCanceled).toBe(false);
      });
    });
  });

  it('should cancel multiple tasks by id range and list', () => {
    return taskline.cancelTasks('2,3-4').then(() => {
      return storage.get().then(data => {
        expect(data[2].isCanceled).toBe(true);
        expect(data[3].isCanceled).toBe(true);
        expect(data[4].isCanceled).toBe(true);
      });
    });
  });

  it('should delete all canceled tasks', () => {
    return storage.get().then(data => {
      const oldData = JSON.parse(JSON.stringify(data));

      return taskline.clear().then(() => {
        return storage.get().then(data => {
          return storage.getArchive().then(archive => {
            expect(data[2]).toBe(undefined);
            expect(data[3]).toBe(undefined);
            expect(data[4]).toBe(undefined);
            oldData[2]._id -= 1;
            expect(archive[1]).toMatchObject(oldData[2]);
            oldData[3]._id -= 1;
            expect(archive[2]).toMatchObject(oldData[3]);
            oldData[4]._id -= 1;
            expect(archive[3]).toMatchObject(oldData[4]);
          });
        });
      });
    });
  });

  it('should try to cancel a note', () => {
    return taskline.cancelTasks('1').then(() => {
      return storage.get().then(data => {
        expect(data[1].isCanceled).toBe(undefined);
      });
    });
  });

  it('should try to cancel a nonexisting item', () => {
    expect(taskline.cancelTasks('5')).rejects.toMatchObject({
      message: 'Invalid InputIDs'
    });
  });

  it('should try to cancel with invalid id range', () => {
    expect(taskline.cancelTasks('1-b')).rejects.toMatchObject({
      message: 'Invalid Input ID Range'
    });
  });

  afterAll(done => {
    helper.resetConfig();
    done();
  });
});
