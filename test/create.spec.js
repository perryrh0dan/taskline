const Taskline = require('../src/taskline');
const helper = require('./helper');

helper.setConfig();
const taskline = new Taskline();

describe('Test create functionality', () => {
  const storage = helper.getStorage();

  //  Disable output
  process.stdout.write = jest.fn();
  //  Disable output ora problem also jest has no output than
  //  process.stderr.write = jest.fn();

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

  it('should create simple task', () => {
    return taskline.createTask('Test Task').then(() => {
      return storage.get().then(data => {
        expect(data[2]._isTask).toBe(true);
        expect(data[2].description).toBe('Test Task');
        expect(data[2].boards).toMatchObject(['My Board']);
        expect(data[2].dueDate).toBe(null);
        expect(data[2].isComplete).toBe(false);
        expect(data[2].inProgress).toBe(false);
        expect(data[2].isStarred).toBe(false);
        expect(data[2].priority).toBe(1);
      });
    });
  });

  it('should create a task with boards', () => {
    return taskline.createTask('Second Test Task', 'test2,test3').then(() => {
      return storage.get().then(data => {
        expect(data[3]._isTask).toBe(true);
        expect(data[3].description).toBe('Second Test Task');
        expect(data[3].boards).toMatchObject(['test2', 'test3']);
        expect(data[3].dueDate).toBe(null);
        expect(data[3].isComplete).toBe(false);
        expect(data[3].inProgress).toBe(false);
        expect(data[3].isStarred).toBe(false);
        expect(data[3].priority).toBe(1);
      });
    });
  });

  it('should create a task with duedate', () => {
    return taskline.createTask('Second Test Task').then(() => {
      return storage.get().then(data => {
        expect(data[4]._isTask).toBe(true);
        expect(data[4].description).toBe('Second Test Task');
        expect(data[4].boards).toMatchObject(['My Board']);
        expect(data[4].dueDate).toBe(null);
        expect(data[4].isComplete).toBe(false);
        expect(data[4].inProgress).toBe(false);
        expect(data[4].isStarred).toBe(false);
        expect(data[4].priority).toBe(1);
      });
    });
  });

  it('should create a task with boards', () => {
    return taskline.createTask('Second Test Task').then(() => {
      return storage.get().then(data => {
        expect(data[5]._isTask).toBe(true);
        expect(data[5].description).toBe('Second Test Task');
        expect(data[5].boards).toMatchObject(['My Board']);
        expect(data[5].dueDate).toBe(null);
        expect(data[5].isComplete).toBe(false);
        expect(data[5].inProgress).toBe(false);
        expect(data[5].isStarred).toBe(false);
        expect(data[5].priority).toBe(1);
      });
    });
  });

  it('should create a task with duedate, priority and boards', () => {
    return taskline.createTask('Second Test Task').then(() => {
      return storage.get().then(data => {
        expect(data[6]._isTask).toBe(true);
        expect(data[6].description).toBe('Second Test Task');
        expect(data[6].boards).toMatchObject(['My Board']);
        expect(data[6].dueDate).toBe(null);
        expect(data[6].isComplete).toBe(false);
        expect(data[6].inProgress).toBe(false);
        expect(data[6].isStarred).toBe(false);
        expect(data[6].priority).toBe(1);
      });
    });
  });

  afterAll(done => {
    helper.resetConfig();
    done();
  });
});
