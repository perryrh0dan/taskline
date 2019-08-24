const {
  taskbook
} = require('../src/taskbook');


test('Should convert input to an array', () => {
  const text = taskbook._arrayify('Book');
  expect(text).toBe(['Book']);
});
