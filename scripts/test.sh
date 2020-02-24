#!bin/bash

# exit with nonzero exit code if anything fails
set -e

# run tests
npm run test

# send coverage to codecov using npm package
codecov

# just to be sure we exit cleanly
exit 0;

