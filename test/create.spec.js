import { Taskline } from '../dist/src/taskline';
const helper = require('./helper');

helper.setConfig();
const taskline = new Taskline();

describe('Test create functionality', () => {
  const storage = helper.getStorage();

  //  Disable output
  process.stdout.write = jest.fn();
  //  Disable output ora problem also jest has no output than
  //  process.stderr.write = jest.fn();

  beforeAll(async done => {
    await helper.clearStorage();
    done();
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

  it('should create a task with priority', () => {
    return taskline.createTask('Third Test Task', undefined, '3').then(() => {
      return storage.get().then(data => {
        expect(data[4]._isTask).toBe(true);
        expect(data[4].description).toBe('Third Test Task');
        expect(data[4].boards).toMatchObject(['My Board']);
        expect(data[4].dueDate).toBe(null);
        expect(data[4].isComplete).toBe(false);
        expect(data[4].inProgress).toBe(false);
        expect(data[4].isStarred).toBe(false);
        expect(data[4].priority).toBe(3);
      });
    });
  });

  it('should create a task with a duedate according to "dd:mm:yyyy"', () => {
    return taskline
      .createTask('Fourth Test Task', undefined, undefined, '02.09.2019')
      .then(() => {
        return storage.get().then(data => {
          expect(data[5]._isTask).toBe(true);
          expect(data[5].description).toBe('Fourth Test Task');
          expect(data[5].boards).toMatchObject(['My Board']);
          expect(data[5].dueDate).toBe(new Date('2019-09-02').setHours(0));
          expect(data[5].isComplete).toBe(false);
          expect(data[5].inProgress).toBe(false);
          expect(data[5].isStarred).toBe(false);
          expect(data[5].priority).toBe(1);
        });
      });
  });

  it('should create a task with a duedate according to "dd.mm.yyyy HH:MM:SS"', () => {
    helper.changeConfig('dateformat', 'dd.mm.yyyy HH:MM:SS');
    return taskline
      .createTask('Fifth Test Task', undefined, undefined, '02.09.2019 7:13:45')
      .then(() => {
        return storage.get().then(data => {
          expect(data[6]._isTask).toBe(true);
          expect(data[6].description).toBe('Fifth Test Task');
          expect(data[6].boards).toMatchObject(['My Board']);
          expect(data[6].dueDate).toBe(
            new Date('2019-09-02').setHours(7, 13, 45)
          );
          expect(data[6].isComplete).toBe(false);
          expect(data[6].inProgress).toBe(false);
          expect(data[6].isStarred).toBe(false);
          expect(data[6].priority).toBe(1);
        });
      });
  });

  it('should create a task with duedate, priority and boards', () => {
    return taskline
      .createTask('Sixth Test Task', 'test2,test3', '2', '03.09.2019')
      .then(() => {
        return storage.get().then(data => {
          expect(data[7]._isTask).toBe(true);
          expect(data[7].description).toBe('Sixth Test Task');
          expect(data[7].boards).toMatchObject(['test2', 'test3']);
          expect(data[7].dueDate).toBe(new Date('2019-09-03').setHours(0));
          expect(data[7].isComplete).toBe(false);
          expect(data[7].inProgress).toBe(false);
          expect(data[7].isStarred).toBe(false);
          expect(data[7].priority).toBe(2);
        });
      });
  });

  it('should try to create a task with wrong priority', () => {
    expect(taskline.createTask('Seventh Test Task', undefined, '4', undefined)).rejects.toMatchObject({
      message: 'Invalid Priority'
    });
  });

  it('should try to create a task with wrong duedate', () => {
    expect(taskline.createTask('Eighth Test Task', undefined, undefined, '2019-30-3')).rejects.toMatchObject({
      message: 'Invalid Date Format'
    });
  });

  afterAll(done => {
    helper.resetConfig();
    done();
  });
});
