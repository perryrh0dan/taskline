#!/usr/bin/env node
import * as program from 'commander';

// START SNAPCRAFT IGNORE
import { UpdateNotifier } from 'update-notifier';
// END SNAPCRAFT IGNORE

import { Taskline } from './src/taskline';
import { Localization } from './src/localization';
import logger from './src/utils/logger';
import pkg = require('./package.json');
const taskline = new Taskline();

program.version(pkg.version);
program.description(pkg.description);

logger.info('Starting in Debug Mode');

program.name('tl').usage('[command] [options]');

program
  .command('archive')
  .alias('a')
  .description(Localization.instance.get('help.archive'))
  .action(async() => {
    await taskline.init();
    taskline.displayArchive().catch(() => {});
  });

program
  .command('begin <ids>')
  .alias('b')
  .description(Localization.instance.get('help.begin'))
  .action(async ids => {
    await taskline.init();
    taskline.beginTasks(ids).catch(() => {});
  });

program
  .command('cancel <ids>')
  .description(Localization.instance.get('help.cancel'))
  .action(async ids => {
    await taskline.init();
    taskline.cancelTasks(ids).catch(() => {});
  });

program
  .command('check <ids>')
  .alias('c')
  .description(Localization.instance.get('help.check'))
  .action(async ids => {
    await taskline.init();
    taskline.checkTasks(ids).catch(() => {});
  });

program
  .command('clear')
  .description(Localization.instance.get('help.clear'))
  .action(async() => {
    await taskline.init();
    taskline.clear().catch(() => {});
  });

program
  .command('config')
  .description(Localization.instance.get('help.config'))
  .action(async() => {
    await taskline.init();
    taskline.displayConfig();
  });

program
  .command('copy <ids>')
  .alias('y')
  .description(Localization.instance.get('help.copy'))
  .action(async ids => {
    await taskline.init();
    taskline.copyToClipboard(ids).catch(() => {});
  });

program
  .command('delete <ids>')
  .alias('d')
  .description(Localization.instance.get('help.delete'))
  .action(async ids => {
    await taskline.init();
    taskline.deleteItems(ids).catch(() => {});
  });

program
  .command('due <ids> <dueDate>')
  .description(Localization.instance.get('help.due'))
  .action(async(ids, dueDate) => {
    await taskline.init();
    taskline.updateDueDate(ids, dueDate).catch(() => {});
  });

program
  .command('edit <id> <description>')
  .alias('e')
  .description(Localization.instance.get('help.edit'))
  .action(async(id, description) => {
    await taskline.init();
    taskline.editDescription(id, description).catch(() => {});
  });

program
  .command('find <terms>')
  .alias('f')
  .description(Localization.instance.get('help.find'))
  .action(async query => {
    await taskline.init();
    taskline.findItems(query).catch(() => {});
  });

program
  .command('list <terms>')
  .alias('l')
  .description(Localization.instance.get('help.list'))
  .action(async terms => {
    await taskline.init();
    taskline.listByAttributes(terms).then(grouped => {
      taskline.displayStats(grouped);
    });
  });

program
  .command('move <ids> <boards')
  .alias('m')
  .description(Localization.instance.get('help.move'))
  .action(async(ids, boards) => {
    await taskline.init();
    taskline.moveBoards(ids, boards).catch(() => {});
  });

program
  .command('note <description>')
  .alias('n')
  .description(Localization.instance.get('help.note'))
  .option('-b, --board <board>', 'Board')
  .action(async(description, opts) => {
    await taskline.init();
    taskline.createNote(description, opts.board).catch(() => {});
  });

program
  .command('priority <id> <priority>')
  .alias('p')
  .description(Localization.instance.get('help.priority'))
  .action(async(id, priority) => {
    await taskline.init();
    taskline.updatePriority(id, priority).catch(() => {});
  });

program
  .command('restore <ids>')

  .alias('r')
  .description(Localization.instance.get('help.restore'))
  .action(async ids => {
    await taskline.init();
    taskline.restoreItems(ids).catch(() => {});
  });

program
  .command('star <ids>')
  .alias('s')
  .description(Localization.instance.get('help.star'))
  .action(async ids => {
    await taskline.init();
    taskline.starItems(ids).catch(() => {});
  });

program
  .command('storage <name>')
  .description(Localization.instance.get('help.storage'))
  .action(async name => {
    await taskline.init();
    taskline.storage(name);
  });

program
  .command('task <description>') // Sub-command name
  .alias('t') // Alternative sub-command is `al`
  .description(Localization.instance.get('help.task')) // Command description
  .option('-b, --board <board>', 'Board')
  .option('-p, --priority <priority>', 'Priority')
  .option('-d, --due <date>', 'Due date')

  // Function to execute when command is uses
  .action(async(description, opts) => {
    await taskline.init();
    taskline
      .createTask(description, opts.board, opts.priority, opts.due)
      .catch(() => {});
  });

program
  .command('timeline')
  .alias('i')
  .description(Localization.instance.get('help.timeline'))
  .action(async() => {
    await taskline.init();
    taskline.displayByDate().then(grouped => {
      taskline.displayStats(grouped);
    });
  });

program
  .command('refactor')
  .description(Localization.instance.get('help.refactor'))
  .action(async() => {
    await taskline.init();
    taskline.refactorIDs().catch(() => {});
  });

program.on('--help', function() {
  console.log('');
  console.log('Detailed description under: https://github.com/perryrh0dan/taskline#flight-manual');
});

if (process.argv.length === 2) {
  taskline.init().then(() => {
    taskline.displayByBoard().then(async grouped => {
      return taskline.displayStats(grouped);
    });
  });
}

program.on('command:*', function() {
  console.error(Localization.instance.getf('errors.invalidCommand', { params: program.args }));
  process.exit(1);
});

// START SNAPCRAFT IGNORE disable this for snap
new UpdateNotifier({
  pkg,
}).notify({ isGlobal: true });
// END SNAPCRAFT IGNORE

program.parse(process.argv);
