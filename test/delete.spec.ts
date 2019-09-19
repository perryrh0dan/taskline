import { Taskline } from '../src/taskline';
import { Task } from '../src/task';
import { Helper } from './helper';
import { Note } from '../src/note';
import { Item } from '../src/item';

const helper = new Helper();
const taskline = new Taskline();

describe('Test delete, archive and restore functionality', () => {
  //  Disable output
  process.stdout.write = jest.fn();
  //  Disable output ora problem also jest has no output than
  //  process.stderr.write = jest.fn();

  beforeAll(async done => {
    await helper.clearStorage();
    const data: Array<Item> = new Array<Item>();

    data.push(new Note({
      id: 1,
      date: 'Mon Sep 02 2019',
      timestamp: 1567434272855,
      description: 'Test Note',
      isStarred: false,
      boards: ['My Board']
    }));

    data.push(new Task({
      id: 2,
      date: 'Mon Sep 02 2019',
      timestamp: 1567434272855,
      description: 'Test Task',
      isStarred: false,
      boards: ['My Board'],
      dueDate: undefined,
      isComplete: false,
      inProgress: false,
      priority: 1
    }));

    await helper.setData(data);
    done();
  });

  it('should delete an item', () => {
    return taskline.deleteItems('1').then(() => {
      return helper.getData().then(data => {
        expect(data.length).toBe(1);
      });
    });
  });

  it('should find item in archive', () => {
    return helper.getArchive([1]).then(data => {
      expect(data[0].description).toBe('Test Note');
      expect(data[0] instanceof Note).toBe(true);
    });
  });

  it('should restore item from archive', () => {
    return taskline.restoreItems('1').then(() => {
      return helper.getData([3]).then(data => {
        return helper.getArchive([1]).then(archive => {
          expect(data[0].description).toBe('Test Note');
          expect(archive.length).toBe(0)
        });
      });
    });
  });

  afterAll(done => {
    helper.resetConfig();
    done();
  });
});
