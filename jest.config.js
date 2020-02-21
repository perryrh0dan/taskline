module.exports = {
  verbose: true,
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
    '^.+\\.ts?$': 'ts-jest'
  },
  testEnvironment: 'node',
  testRegex: '/test/.*\\.(test|spec)?\\.(ts|tsx)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  coverageDirectory: "./coverage/",
  collectCoverage: true
};
