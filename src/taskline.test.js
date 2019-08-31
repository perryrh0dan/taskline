const taskline = require('./taskline');
const LocalStorage = require('./local');

describe("Taskline test", () => {
  const storage = new LocalStorage()
  storage.init()
  storage.set({})
  storage.setArchive({})

  it("should create note", () => {
    process.stdout.write = jest.fn();
    return taskline.createNote("Test Note").then(() => {
      return storage.get().then(data => {
        expect(data[1]._isTask).toBe(false)
        expect(data[1].description).toBe("Test Note")
        expect(data[1].priority).toBe(undefined)
      })
    })
  });

  it("should create task", () => {
    process.stdout.write = jest.fn();
    return taskline.createTask("Test Task").then(() => {
      return storage.get().then(data => {
        expect(data[2]._isTask).toBe(true)
        expect(data[2].description).toBe("Test Task")
        expect(data[2].priority).toBe(1)
      })
    })
  })

  it("should change priority of task", () => {
    process.stdout.write = jest.fn();
    return taskline.updatePriority("2", "3").then(() => {
      return storage.get().then(data => {
        expect(data[2].priority).toBe(3)
      })
    })
  })

  it("should change duedate of task", async () => {
    process.stdout.write = jest.fn();
    return taskline.updateDueDate("2", "22.06.2019").then(() => {
      return storage.get().then(data => {
        expect(data[2].dueDate).toBe(1561240799000)
      })
    })
  })

  // it("should display By Board", () => {
  //   process.stdout.write = jest.fn();

  //   taskline.displayByBoard().then(() => {
  //     expect(process.stdout.write.mock.calls[0][0]).toBe("\n  [4mMy Board[24m [90m[0/0][39m\n")
  //     expect(process.stdout.write.mock.calls[1][0]).toBe("    [90m1.[39m [34m* [39m Test Note\n")
  //   })
  // })
});
