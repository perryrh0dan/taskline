# What's New in Taskline

Changelog for npm and snapcraft

## Version 1.4.0
- Add timeloggin feature for tasks
- Add spanisch language support
- Add localization to help menu

## Version 1.3.0

- Dependency updates
- Add new logger module for better debugging

## Version 1.2.2

- Removed debug commands

## Version 1.2.1

- Fixed package.json. Added i18n directory to release build.

## Version 1.2.0

- Added possibility to use humanized dates (big thanks to [Aditya Sriram](https://github.com/aditya95sriram) for contributing this feature). Complete list of all commands can be found in the readme.

```bash
tl t "humanized" -d tomorrow
tl t "thats cool" -d next monday
```

- Added localization feature. Default language is english. This can be changed in the configuration file under `language`.
- Decreased app size from 55mb to 25mb.

## Version 1.1.3

- Added seperat color for errors
- Small bug fixes

## Version 1.1.2

- Fixed date parse bug for december. 

## Version 1.1.1

- Canceled task texts have the same color as completed task texts.
- Added 'config' command to display active configuration.

## Version 1.1.0

- Colors can now be customized in `.taskline.json`. Possible are all foreground colors of [chalk](https://github.com/chalk/chalk#colors), rgb and hex colors.

```json
"theme": {
  "colors": {
    "pale": "grey",
    "task": {
      "priority": {
        "medium": "yellow",
        "high": "red"
      }
    },
    "icons": {
      "note": "blue",
      "success": "green",
      "star": "yellow",
      "progress": "blue",
      "pending": "magenta",
      "canceled": "red"
    }
  }
}
```

## Version 1.0.6

- Add functionality to refactor the IDs of items

Before (Simplified):

```
Items: [{
  id: 34
  description: "Test 1"
},{
  id: 107
  description: "Test 2"
},{
  id: 114
  description: "Test 2"
}]
```

After (Simplified):

```
Items: [{
  id: 1
  description: "Test 1"
},{
  id: 2
  description: "Test 2"
},{
  id: 3
  description: "Test 2"
}]
```

- Items in boards are now sorted by ID

## Version 1.0.5

- Fixed issue that lead to problems during deletion and recovery of items.

## Version 1.0.4

### Fixes

- Fixed bug that `clear` command deleted pending tasks

## Version 1.0.1

### Features

- Complete rebuild in typescript
- Possibility to cancel tasks
- Possibility to use id ranges

It is possible to mix the old list functionality with the new id ranges like you need it. Following are some examples how you can combine them.

```
tl c 1,2,3,4,5 === tl c 1-5 === tl c 1-3,4,5 === tl c 1-2,3,4-5
```

- Heavy improved Duedate functionality
  - Display duedate with nice humanized text
  - Possibility to maintain time
- Armhf support
- Snap optimization

### Fixes

- Fixed the issue that a task could be created with a priority higher than 3. That lead to an error message when displaying the board.
