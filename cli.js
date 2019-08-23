#!/usr/bin/env node
"use strict";
const program = require("commander");
const pkg = require("./package.json");
const updateNotifier = require('update-notifier');
const taskbook = require("./src/taskbook");

program.version(pkg.version);
program.description(pkg.description);

program
  .command("task <description>") // sub-command name
  .alias("t") // alternative sub-command is `al`
  .description("Create task") // command description
  .option("-b, --board <board>", "Board")
  .option("-p, --priority <priority>", "Priority")
  .option("-d, --due <date>", "Due date")

  // function to execute when command is uses
  .action((description, opts) => {
    taskbook.createTask(description, opts.board, opts.priority, opts.due);
  });

program
  .command("note <description>")
  .alias("n")
  .description("Create note")
  .option("-b, --board <board>", "Board")
  .action((description, opts) => {
    taskbook.createNote(description, opts.board);
  });

program
  .command("archive")
  .alias("a")
  .description("Display archived items")
  .action(() => {
    taskbook.displayArchive();
  });

program
  .command("restore <ids>")
  .alias("r")
  .description("Restore items from archive")
  .action(ids => {
    taskbook.restoreItems(ids);
  });

program
  .command("delete <ids>")
  .alias("d")
  .description("Delete item")
  .action(ids => {
    taskbook.deleteItems(ids);
  });

program
  .command("check <ids>")
  .alias("c")
  .description("Check/uncheck task")
  .action(ids => {
    taskbook.checkTasks(ids);
  });

program
  .command("clear")
  .description("Delete all checked items")
  .action(() => {
    taskbook.clear();
  })

program
  .command("begin <ids>")
  .alias("b")
  .description("Start/pause task")
  .action(ids => {
    taskbook.beginTasks(ids);
  });

program
  .command("star <ids>")
  .alias("s")
  .description("Star/unstar item")
  .action(ids => {
    taskbook.starItems(ids)
  })

program
  .command("copy <id>")
  .alias("y")
  .description("Copy description to clipboard")
  .action(id => {
    taskbook.copyToClipboard(id)
  })

program
  .command("timeline")
  .alias("i")
  .description("Display timeline view")
  .action(() => {
    taskbook.displayByDate()
  })

program
  .command("priority <id> <priority>")
  .alias("p")
  .description("Update priority of task")
  .action((id, priority) => {
    taskbook.updatePriority(id, priority)
  })

program
  .command("find <terms>")
  .alias("f")
  .description("Search for items")
  .action(query => {
    taskbook.findItems(query)
  })

program
  .command("list <terms>")
  .alias("l")
  .description("List items by attributes")
  .action(terms => {
    taskbook.listByAttributes(terms)
  })

program
  .command("edit <id> <description>")
  .alias("e")
  .description("Edit item description")
  .action((id, description) => {
    taskbook.editDescription(id, description)
  })

program
  .command("move <id> <boards")
  .alias("m")
  .description("Move item between boards")
  .action((id, boards) => {
    taskbook.moveBoards(id, boards);
  })

if (process.argv.length === 2) {
  taskbook.displayByBoard();
}

updateNotifier({pkg}).notify();

program.parse(process.argv);
