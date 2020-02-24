#!/bin/bash

# exit with nonzero exit code if anything fails
set -e

# run the prod build
npm run build:prod

# deploy with semantic-release
npm run semantic-release

# just to be sure we exit cleanly
exit 0;
