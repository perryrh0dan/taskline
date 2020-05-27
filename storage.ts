#!/usr/bin/env node
import * as program from 'commander';

import { StorageManager } from './src/manager';
const storageManager = new StorageManager();

program
  .arguments('<name>')
  .action(async(name: string) => {
    await storageManager.init();
    storageManager.setStorage(name);
  });

program
  .command('list')
  .description('List all storages')
  .action(async() => {
    await storageManager.init();
    storageManager.listStorages();
  });

program
  .command('add <name>')
  .description('Add new storage module')
  .action(async(name) => {
    await storageManager.addStorage(name);
  });

program
  .command('remove <name>')
  .description('Delete storage module')
  .action(() => {
    console.log('Called delete');
  });

program.parse(process.argv);
