#!/usr/bin/env node

'use strict';
import * as program from 'commander';
// START SNAPCRAFT IGNORE
import * as updateNotifier from 'update-notifier';
// END SNAPCRAFT IGNORE
const pkg = require('./package.json');
import { Taskline } from './src/taskline' 
const taskline = new Taskline();

program.version(pkg.version);
program.description(pkg.description);

program.name('tl').usage('[command] [options]');

// program
//   .command('archive')
//   .alias('a')
//   .description('Display archived items')
//   .action(() => {
//     taskline.displayArchive().catch(() => {});
//   });

program
  .command('begin <ids>')
  .alias('b')
  .description('Start/pause task')
  .action(ids => {
    taskline.beginTasks(ids).catch(() => {});
  });

program
  .command('cancel <ids>')
  .description('Cancel/revive task')
  .action(ids => {
    taskline.cancelTasks(ids).catch(() => {});
  });

program
  .command('check <ids>')
  .alias('c')
  .description('Check/uncheck task')
  .action(ids => {
    taskline.checkTasks(ids).catch(() => {});
  });

program
  .command('clear')
  .description('Delete all checked items')
  .action(() => {
    taskline.clear().catch(() => {});
  });

program
  .command('copy <ids>')
  .alias('y')
  .description('Copy description to clipboard')
  .action(ids => {
    taskline.copyToClipboard(ids).catch(() => {});
  });

program
  .command('delete <ids>')  
  .alias('d')
  .description('Delete item')
  .action(ids => {
    taskline.deleteItems(ids).catch(() => {});
  });

program
  .command('due <ids> <dueDate>')
  .description('Update duedateof task')
  .action((ids, dueDate) => {
    taskline.updateDueDate(ids, dueDate).catch(() => {});
  });

program
  .command('edit <id> <description>')
  .alias('e')
  .description('Edit item description')
  .action((id, description) => {
    taskline.editDescription(id, description).catch(() => {});
  });

// program
//   .command('find <terms>')
//   .alias('f')
//   .description('Search for items')
//   .action(query => {
//     taskline.findItems(query).catch(() => {});
//   });

// program
//   .command('list <terms>')
//   .alias('l')
//   .description('List items by attributes')
//   .action(terms => {
//     taskline.listByAttributes(terms).then(grouped => {
//       taskline.displayStats(grouped);
//     });
//   });

// program
//   .command('move <ids> <boards')
//   .alias('m')
//   .description('Move item between boards')
//   .action((ids, boards) => {
//     taskline.moveBoards(ids, boards).catch(() => {});
//   });

program
  .command('note <description>')
  .alias('n')
  .description('Create note')
  .option('-b, --board <board>', 'Board')
  .action((description, opts) => {
    taskline.createNote(description, opts.board).catch(() => {});
  });

program
  .command('priority <id> <priority>')
  .alias('p')
  .description('Update priority of task')
  .action((id, priority) => {
    taskline.updatePriority(id, priority).catch(() => {});
  });

// program
//   .command('restore <ids>')

//   .alias('r')
//   .description('Restore items from archive')
//   .action(ids => {
//     taskline.restoreItems(ids).catch(() => {});
//   });

// program
//   .command('star <ids>')
//   .alias('s')
//   .description('Star/unstar item')
//   .action(ids => {
//     taskline.starItems(ids).catch(() => {});
//   });

// program
//   .command('task <description>') // Sub-command name
//   .alias('t') // Alternative sub-command is `al`
//   .description('Create task') // Command description
//   .option('-b, --board <board>', 'Board')
//   .option('-p, --priority <priority>', 'Priority')
//   .option('-d, --due <date>', 'Due date')

//   // Function to execute when command is uses
//   .action((description, opts) => {
//     taskline
//       .createTask(description, opts.board, opts.priority, opts.due)
//       .catch(() => {});
//   });

// program
//   .command('timeline')
//   .alias('i')
//   .description('Display timeline view')
//   .action(() => {
//     taskline.displayByDate().then(grouped => {
//       taskline.displayStats(grouped);
//     });
//   });

// program.on('--help', function() {
//   console.log('');
//   console.log('Detailed description under: https://github.com/perryrh0dan/taskline#flight-manual');
// });

// if (process.argv.length === 2) {
//   taskline.displayByBoard().then(grouped => {
//     return taskline.displayStats(grouped);
//   });
// }

program.on('command:*', function() {
  console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
  process.exit(1);
});

// START SNAPCRAFT IGNORE disable this for snap
updateNotifier({
  pkg,
  isGlobal: true
}).notify();
// END SNAPCRAFT IGNORE

program.parse(process.argv);
