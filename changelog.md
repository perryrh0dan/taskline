# What's New in Taskline
Changelog for npm and snapcraft

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
