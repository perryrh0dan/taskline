<h1 align="center">
  Taskbook
</h1>

<h4 align="center">
  Tasks, boards & notes for the command-line habitat
</h4>

<div align="center">
  <img alt="Boards" width="60%" src="media/header-boards.png"/>
</div>

<p align="center">
  <a href="https://travis-ci.com/klaussinani/taskbook">
    <img alt="Build Status" src="https://travis-ci.com/klaussinani/taskbook.svg?branch=master">
  </a>
</p>

## Description

By utilizing a simple and minimal usage syntax, that requires a flat learning curve, taskbook enables you to effectively manage your tasks and notes across multiple boards from within your terminal. All data are written atomically to the storage in order to prevent corruptions, and are never shared with anyone or anything. Deleted items are automatically archived and can be inspected or restored at any moment.

## Highlights

### Original

- Organize tasks & notes to boards
- Board & timeline views
- Priority & favorite mechanisms
- Search & filter items
- Archive & restore deleted items
- Lightweight & fast
- Data written atomically to storage
- Custom storage location
- Progress overview
- Simple & minimal usage syntax
- Update notifications
- Configurable through `~/.taskbook.json`
- Data stored in JSON file at `~/.taskbook/storage`

### New

- Modular data storage. 
- Firestore module to save data in google firestore.
- Sync tasks across all your devices with firestore.
- Replaced Meow with commander.js
- Set Duedate for tasks

View highlights in a [taskbook board](https://raw.githubusercontent.com/klaussinani/taskbook/master/media/highlights.png).

## Contents

- [Description](#description)
- [Highlights](#highlights)
- [Install](#install)
- [Usage](#usage)
- [Views](#views)
- [Configuration](#configuration)
- [Flight Manual](#flight-manual)
- [Development](#development)
- [Related](#related)
- [Team](#team)
- [License](#license)

## Install

### Yarn

```bash
yarn global add taskbook
```

### NPM

```bash
npm install --global taskbook
```

## Usage

```
$ tb --help
Usage: tb [options] [command]

Tasks, boards & notes for the command-line habitat

Options:
  -V, --version                   output the version number
  -h, --help                      output usage information

Commands:
  archive|a                       Display archived items
  begin|b <ids>                   Start/pause task
  check|c <ids>                   Check/uncheck task
  clear                           Delete all checked items
  copy|y <ids>                    Copy description to clipboard
  delete|d <ids>                  Delete item
  due <ids> <dueDate>             Update duedateof task
  edit|e <id> <description>       Edit item description
  find|f <terms>                  Search for items
  list|l <terms>                  List items by attributes
  move|m <ids> <board>            Move item between boards
  note|n [options] <description>  Create note
  priority|p <id> <priority>      Update priority of task
  restore|r <ids>                 Restore items from archive
  star|s <ids>                    Star/unstar item
  task|t [options] <description>  Create task
  timeline|i                      Display timeline view
```
# Views

### Board View

Invoking taskbook without any options will display all saved items grouped into their respective boards.

<div align="center">
  <img alt="Boards" width="60%" src="media/header-boards.png"/>
</div>

### Timeline View

In order to display all items in a timeline view, based on their creation date, the `--timeline`/`-i` option can be used.

<div align="center">
  <img alt="Timeline View" width="62%" src="media/timeline.png"/>
</div>

## Configuration

To configure taskbook navigate to the `~/.taskbook.json` file and modify any of the options to match your own preference. To reset back to the default values, simply delete the config file from your home directory.

The following illustrates all the available options with their respective default values.

```json
{
  "taskbookDirectory": "~",
  "displayCompleteTasks": true,
  "displayProgressOverview": true`,
  "storageModule": "local",
  "firestoreConfig": {
        "type": "",
        "project_id": "",
        "private_key_id": "",
        "private_key": "",
        "client_email": "",
        "client_id": "",
        "auth_uri": "",
        "token_uri": "",
        "auth_provider_x509_cert_url": "",
        "client_x509_cert_url": "",
      },
	"dateformat": "dd.mm.yyyy"
}
```

### In Detail

##### `taskbookDirectory`

- Type: `String`
- Default: `~`

Filesystem path where the storage will be initialized, i.e: `/home/username/the-cloud` or `~/the-cloud`

If left undefined the home directory `~` will be used and taskbook will be set-up under `~/.taskbook/`.

##### `displayCompleteTasks`

- Type: `Boolean`
- Default: `true`

Display tasks that are marked as complete.

##### `displayProgressOverview`

- Type: `Boolean`
- Default: `true`

Display progress overview below the timeline and board views.

##### `storageModule`

- Type: `Enum`
- Default: `local`
- Values: `local`, `firestore`

##### `firestoreConfig`

- Type: `Google Dienstkontoschlüssel`
- Default: `Empty`

## Flight Manual

The following is a minor walkthrough containing a set of examples on how to use taskbook.
In case you spotted an error or think that an example is not to clear enough and should be further improved, please feel free to open an [issue](https://github.com/perryrh0dan/taskline/issues/new/choose) or [pull request](https://github.com/perryrh0dan/taskline/compare).

### Setup Firestore
Follow this instructions:
https://cloud.google.com/docs/authentication/production#providing_credentials_to_your_application

### Create Task

To create a new task use the `task`/`t` command with your task's description following right after.

```
$ tb t "Improve documentation"
```

### Create Note

To create a new note use the `note`/`n` command with your note's body following right after.

```
$ tb n "Mergesort worse-case O(nlogn)"
```

### Create Board

Boards are automatically initialized when creating a new task or note. To create one or more boards, use the `--board`/`-b` option, followed by a list of boardnames, after the description of the about-to-be created item. As a result the newly created item will belong to all of the given boards. By default, items that do not contain any board option are automatically added to the general purpose; `My Board`.

```
$ tb t "Update contributing guidelines" -b coding,docs
```

### Check Task

To mark a task as complete/incomplete, use the `check`/`c` command followed by the ids of the target tasks. Note that the option will update to its opposite the `complete` status of the given tasks, thus checking a complete task will render it as pending and a pending task as complete. Duplicate ids are automatically filtered out.

```
$ tb c 1,3
```

### Begin Task

To mark a task as started/paused, use the `begin`/`b` command followed by the ids of the target tasks. The functionality of this option is the same as the one of the above described `check` command.

```
$ tb b 2,3
```

### Star Item

To mark one or more items as favorite, use the `star`/`s` command followed by the ids of the target items. The functionality of this option is the same as the one of the above described `check` command.

```
$ tb s 1,2,3
```

### Copy Item Description

To copy to your system's clipboard the description of one or more items, use the `copy`/`y` option followed by the ids of the target items. Note that the option will also include the newline character as a separator to each pair of adjacent copied descriptions, thus resulting in a clear and readable stack of sentences on paste.

```
$ tb y 1,2,3
```

### Display Boards

Invoking taskbook without any commands and options will display all of saved items grouped into their respective boards.

```
$ tb
```

### Display Timeline

In order to display all items in a timeline view, based on their creation date, the `timeline`/`i` command can be used.

```
$ tb i
```

### Set Priority

To set a priority level for a task while initializing it, use the `-p` option followed by the priority. Priority can be an integer of value `1`, `2` or `3`. Note that all tasks by default are created with a normal priority - `1`.

- `1` - Normal priority
- `2` - Medium priority
- `3` - High priority

```
$ tb t "Fix issue `#42`" -b coding -p 3
```

To update the priority level of a specific task after its creation, use the `priority`/`p` command along with the ids of the target tasks and an integer of value `1`, `2` or `3`.

```
$ tb p 1,2,23 2
```

### Move Item

To move items to one or more boards, use the `move`/`m` command, followed by the target items ids and the name of the destination boards. The default `My board` can be accessed through the `myboard` keyword.

```
$ tb m 1,2 myboard,reviews
```

### Delete Item

To delete one or more items, use the `delete`/`d` command followed by the ids of the target items. Note that deleted items are automatically archived, and can be inspected or restored at any moment. Duplicate ids are automatically filtered out.

```
$ tb d 1,2
```

### Delete Checked Tasks

To delete/clear all complete tasks at once across all boards, use the `clear` command. Note that all deleted tasks are automatically archived, and can be inspected or restored at any moment. In order to discourage any possible accidental usage, the `clear` command has no available shorter alias.

```
$ tb clear
```

### Display Archive

To display all archived items, use the `archive`/`a` command. Note that all archived items are displayed in timeline view, based on their creation date.

```
$ tb a
```

### Restore Items

To restore one or more items, use the `restore`/`r` command followed by the id of the target items. Note that the ids of all archived items can be seen when invoking the `archive`/`a` option. Duplicate ids are automatically filtered out.

```
$ tb r 1,2
```

### List Items

To list a group of items where each item complies with a specific set of attributes, use the `list`/`l` command followed by the desired attributes. Board names along with item traits can be considered valid listing attributes. For example to list all items that belong to the default `myboard` and are pending tasks, the following could be used;

```
$ tb l myboard,pending
```

The by default supported listing attributes, together with their respective aliases, are the following;

- `myboard` - Items that belong to `My board`
- `task`, `tasks`, `todo` - Items that are tasks.
- `note`, `notes` - Items that are notes.
- `pending`, `unchecked`, `incomplete` - Items that are pending tasks.
- `progress`, `started`, `begun` - Items that are in-progress tasks.
- `done`, `checked`, `complete` - Items that complete tasks.
- `star`, `starred` - Items that are starred.

### Search Items

To search for one of more items, use the `find`/`f` command, followed by your search terms.

```
$ tb f documentation
```

## Development

For more info on how to contribute to the project, please read the [contributing guidelines](https://github.com/perryrh0dan/taskline/blob/master/contributing.md).

- Fork the repository and clone it to your machine
- Navigate to your local fork: `cd taskbook`
- Install the project dependencies: `npm install` or `yarn install`
- Lint the code for errors: `npm test` or `yarn test`

## Related

- [signale](https://github.com/klaussinani/signale) - Highly configurable logging utility

## Team

- Thomas Pöhlmann [(@perryrh0dan)](https://github.com/perryrh0dan)

## License

[MIT](https://github.com/perryrh0dan/taskline/blob/master/license.md)
