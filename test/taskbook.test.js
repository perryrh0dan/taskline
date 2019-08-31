const {
  taskline
} = require('../src/taskline');

test('Should convert input to an array', () => {
  const text = taskline._arrayify('Book');
  expect(text).toBe(['Book']);
});
