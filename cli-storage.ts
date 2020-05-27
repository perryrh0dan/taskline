#!/usr/bin/env node
import * as program from 'commander';

import { StorageManager } from './src/manager';
const storageManager = new StorageManager();

program
  .command('add <name> <type>')
  .description('Add new storage module')
  .action(async(name, type) => {
    await storageManager.addStorage(name, type);
  });

program
  .command('remove <name>')
  .description('Delete storage module')
  .action(() => {
    console.log('Called delete');
  });

program.parse(process.argv);
