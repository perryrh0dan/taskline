#!/bin/bash

set -e # exit with nonzero exit code if anything fails

# run build
gulp build

# move meta files into dist
gulp buildMeta

# just to be sure we exit cleanly
exit 0;
