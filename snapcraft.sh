#!/bin/bash
set -e #stop on error

# Creating a temp directory for the build and navigate in
echo 'Creating temp directory'
mkdir temp
cd temp

# Copy all necessery files to the temp directory
echo 'Copying all necessery files to temp directory'
cp ../package.json ./
cp ../snapcraft.yaml ./
cp -r ../src ./src
cp ../cli.js ./
cp ../license.md ./

# Comment out update notifier for snap
echo 'Comment out update notifier'
sed -i "/START SNAPCRAFT IGNORE/,/END SNAPCRAFT IGNORE/"' s/^/\/\/ /' cli.js
# sed -i '2,4 s/^/#/' cli.js

# Install npm packages
echo 'Run npm install'
npm install

# Build Snap
echo 'Build snap'
sudo snapcraft cleanbuild

# Copy snap to main directory
echo 'Copy snap to main directory'
find ./ -iname '*.snap' -exec cp {} ../ \;
# find ./ -iname '*.bz2' -exec cp {} ../ \;
# for /R ./ %%f in (*.snap) do copy %%f ../

# Navigate out and delete temp directory
echo 'Delete temp directory'
cd ..
sudo rm -r ./temp

