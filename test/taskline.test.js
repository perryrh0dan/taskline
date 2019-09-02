const Taskline = require('../src/taskline');
const helper = require('./helper');

helper.setConfig();
const taskline = new Taskline();

describe('Test Taskline module', () => {
  const storage = helper.getStorage();

  // Disable output
  process.stdout.write = jest.fn();
  // Disable output ora
  process.stderr.write = jest.fn();

  beforeAll(done => {
    helper.clearStorage().then(() => {
      done();
    });
  });

  it('should create note', () => {
    return taskline.createNote('Test Note').then(() => {
      return storage.get().then(data => {
        expect(data[1]._isTask).toBe(false);
        expect(data[1].description).toBe('Test Note');
        expect(data[1].boards.toString()).toBe('My Board');
        expect(data[1].isComplete).toBe(undefined);
        expect(data[1].priority).toBe(undefined);
      });
    });
  });

  it('should create task', () => {
    return taskline.createTask('Test Task').then(() => {
      return storage.get().then(data => {
        expect(data[2]._isTask).toBe(true);
        expect(data[2].description).toBe('Test Task');
        expect(data[2].boards.toString()).toBe('My Board');
        expect(data[2].dueDate).toBe(null);
        expect(data[2].isComplete).toBe(false);
        expect(data[2].inProgress).toBe(false);
        expect(data[2].isStarred).toBe(false);
        expect(data[2].priority).toBe(1);
      });
    });
  });

  it('should change priority of task', () => {
    return taskline.updatePriority('2', '3').then(() => {
      return storage.get().then(data => {
        expect(data[2].priority).toBe(3);
      });
    });
  });

  it('should change duedate of task', () => {
    return taskline.updateDueDate('2', '22.06.2019').then(() => {
      return storage.get().then(data => {
        expect(data[2].dueDate).toBe(1561240799000);
      });
    });
  });

  it('should change the board of a task', () => {
    return taskline.moveBoards('1', 'test,test2').then(() => {
      return storage.get().then(data => {
        expect(data[1].boards.toString()).toBe('test,test2');
      });
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

  it('should begin a task', () => {
    return taskline.beginTasks('2').then(() => {
      return storage.get().then(data => {
        expect(data[2].inProgress).toBe(true);
        expect(data[2].isComplete).toBe(false);
      });
    });
  });

  it('should try to begin a note', () => {
    return taskline.beginTasks('1').then(() => {
      return storage.get().then(data => {
        expect(data[1].inProgress).toBe(undefined);
        expect(data[1].isComplete).toBe(undefined);
      });
    });
  });

  it('should delete an item', () => {
    return taskline.deleteItems('1').then(() => {
      return storage.get().then(data => {
        expect(data[1]).toBe(undefined);
      });
    });
  });

  it('should find item in archive', () => {
    return storage.getArchive().then(data => {
      expect(data[1].description).toBe('Test Note');
      expect(data[1]._isTask).toBe(false);
    });
  });

  it('should restore item from archive', () => {
    return taskline.restoreItems('1').then(() => {
      return storage.get().then(data => {
        expect(data[3].description).toBe('Test Note');
      });
    });
  });

  it('should update duedate of task', () => {
    return taskline.updateDueDate('2', '02.09.2019').then(() => {
      return storage.get().then(data => {
        expect(data[2].dueDate).toBe(1567461599000);
      });
    });
  });

  it('should try to update duedate of note', () => {
    return taskline.updateDueDate('3', '02.09.2019').then(() => {
      return storage.get().then(data => {
        expect(data[3].dueDate).toBe(undefined);
      });
    });
  });

  it('should edit description of item', () => {
    return taskline.editDescription('2', 'Edited Test Task').then(() => {
      return storage.get().then(data => {
        expect(data[2].description).toBe('Edited Test Task');
      });
    });
  });

  it('should star an item', () => {
    return taskline.starItems('2,3').then(() => {
      return storage.get().then(data => {
        expect(data[2].isStarred).toBe(true);
        expect(data[3].isStarred).toBe(true);
      });
    });
  });

  afterAll(done => {
    helper.resetConfig();
    done();
  });
  // It("should display By Board", () => {
  //   process.stdout.write = jest.fn();

  //   taskline.displayByBoard().then(() => {
  //     expect(process.stdout.write.mock.calls[0][0]).toBe("\n  [4mMy Board[24m [90m[0/0][39m\n")
  //     expect(process.stdout.write.mock.calls[1][0]).toBe("    [90m1.[39m [34m* [39m Test Note\n")
  //   })
  // })
});
