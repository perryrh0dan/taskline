#!/bin/bash

set -e # exit with nonzero exit code if anything fails

gulp build

# move meta files into dist
gulp buildMeta

exit 0;
