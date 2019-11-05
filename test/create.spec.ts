import { Taskline } from '../src/taskline';
import { Task } from '../src/task';
import { Helper } from './helper';
import { Note } from '../src/note';

const helper = new Helper();
const taskline = new Taskline();

describe('Test create functionality', () => {
  //  Disable output
  process.stdout.write = jest.fn();
  //  Disable output ora problem also jest has no output than
  //  process.stderr.write = jest.fn();

  beforeAll(async done => {
    await helper.clearStorage();
    helper.setConfig();
    done();
  });

  it('should create note', () => {
    return taskline.createNote('Test Note', undefined).then(() => {
      return helper.getData().then(data => {
        expect(data[0] instanceof Note).toBe(true);
        expect(data[0].isTask).toBe(false);
        expect(data[0].description).toBe('Test Note');
        expect(data[0].boards.toString()).toBe('My Board');
      });
    });
  });

  it('should create simple task', () => {
    return taskline.createTask('Test Task', undefined, undefined, undefined).then(() => {
      return helper.getData().then(data => {
        expect(data[1] instanceof Task).toBe(true);
        expect(data[1].isTask).toBe(true);
        expect(data[1].description).toBe('Test Task');
        expect(data[1].boards).toMatchObject(['My Board']);
        expect((data[1] as Task).dueDate).toBe(0);
        expect((data[1] as Task).isComplete).toBe(false);
        expect((data[1] as Task).inProgress).toBe(false);
        expect(data[1].isStarred).toBe(false);
        expect((data[1] as Task).priority).toBe(1);
      });
    });
  });

  it('should create a task with boards', () => {
    return taskline.createTask('Second Test Task', 'test2,test3', undefined, undefined).then(() => {
      return helper.getData().then(data => {
        expect(data[2].isTask).toBe(true);
        expect(data[2].description).toBe('Second Test Task');
        expect(data[2].boards).toMatchObject(['test2', 'test3']);
        expect((data[2] as Task).dueDate).toBe(0);
        expect((data[2] as Task).isComplete).toBe(false);
        expect((data[2] as Task).inProgress).toBe(false);
        expect(data[2].isStarred).toBe(false);
        expect((data[2] as Task).priority).toBe(1);
      });
    });
  });

  it('should create a task with priority', () => {
    return taskline.createTask('Third Test Task', undefined, '3', undefined).then(() => {
      return helper.getData().then(data => {
        expect(data[3].isTask).toBe(true);
        expect(data[3].description).toBe('Third Test Task');
        expect(data[3].boards).toMatchObject(['My Board']);
        expect((data[3] as Task).dueDate).toBe(0);
        expect((data[3] as Task).isComplete).toBe(false);
        expect((data[3] as Task).inProgress).toBe(false);
        expect(data[3].isStarred).toBe(false);
        expect((data[3] as Task).priority).toBe(3);
      });
    });
  });

  it('should create a task with a duedate according to "dd:mm:yyyy"', () => {
    return taskline
      .createTask('Fourth Test Task', undefined, undefined, '02.09.2019')
      .then(() => {
        return helper.getData().then(data => {
          expect(data[4].isTask).toBe(true);
          expect(data[4].description).toBe('Fourth Test Task');
          expect(data[4].boards).toMatchObject(['My Board']);
          expect((data[4] as Task).dueDate).toBe(new Date('2019-09-02').setHours(0));
          expect((data[4] as Task).isComplete).toBe(false);
          expect((data[4] as Task).inProgress).toBe(false);
          expect(data[4].isStarred).toBe(false);
          expect((data[4] as Task).priority).toBe(1);
        });
      });
  });

  it('should create a task with a duedate according to "dd.mm.yyyy HH:MM:SS"', () => {
    helper.changeConfig('dateformat', 'dd.mm.yyyy HH:MM:SS');
    return taskline
      .createTask('Fifth Test Task', undefined, undefined, '02.09.2019 7:13:45')
      .then(() => {
        return helper.getData().then(data => {
          expect(data[5].isTask).toBe(true);
          expect(data[5].description).toBe('Fifth Test Task');
          expect(data[5].boards).toMatchObject(['My Board']);
          expect((data[5] as Task).dueDate).toBe(
            new Date('2019-09-02').setHours(7, 13, 45)
          );
          expect((data[5] as Task).isComplete).toBe(false);
          expect((data[5] as Task).inProgress).toBe(false);
          expect(data[5].isStarred).toBe(false);
          expect((data[5] as Task).priority).toBe(1);
        });
      });
  });

  it('should create a task with duedate, priority and boards', () => {
    return taskline
      .createTask('Sixth Test Task', 'test2,test3', '2', '03.09.2019')
      .then(() => {
        return helper.getData().then(data => {
          expect(data[6].isTask).toBe(true);
          expect(data[6].description).toBe('Sixth Test Task');
          expect(data[6].boards).toMatchObject(['test2', 'test3']);
          expect((data[6] as Task).dueDate).toBe(new Date('2019-09-03').setHours(0));
          expect((data[6] as Task).isComplete).toBe(false);
          expect((data[6] as Task).inProgress).toBe(false);
          expect(data[6].isStarred).toBe(false);
          expect((data[6] as Task).priority).toBe(2);
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
