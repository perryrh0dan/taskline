#!/bin/bash
set -e #stop on error
echo 'Build Snap Package...'

# Check if temp already exists if yes delete
if [ -d temp ]; then rm -r temp; fi;

# Creating a temp directory for the build and navigate in
echo 'Creating temp directory'
mkdir temp
cd temp

# Copy all necessery files to the temp directory
echo 'Copying all necessery files to temp directory'
cp ../package.json ./
cp ../package-lock.json ./
cp ../snapcraft.yaml ./
cp -r ../src ./src
cp -r ../i18n ./i18n
cp ../cli.ts ./
cp ../license.md ./
cp ../readme.md ./
cp ../tsconfig.json ./

# Copy extra files
cp -r ../scripts/ ./scripts
cp ../gulpfile.js ./

# Comment out update notifier for snap
echo 'Comment out update notifier'
sed -i "/START SNAPCRAFT IGNORE/,/END SNAPCRAFT IGNORE/"' s/^/\/\/ /' cli.ts
# sed -i '2,4 s/^/#/' cli.js

# Install npm packages
echo 'Run npm install'
npm install

# Compile Typescript
echo 'Compile typescript'
npm run build:prod:snapcraft

# Delete source files and copy compiled code to snap main
echo 'Delete source files and copy compiled code to snap main'
rm -r ./src
rm tsconfig.json
cp -r dist/. .
rm -r dist
rm cli.ts

# Delete dev dependencies
echo 'Removing dev dependencies'
rm -r ./node_modules
rm -r package-lock.json

# Delete seperate files
rm -r ./scripts
rm ./gulpfile.js

# Build Snap
echo 'Build snap'
sudo snapcraft clean
sudo snapcraft

# Copy snap to main directory
echo 'Copy snap to main directory'
find ./ -iname '*.snap' -exec cp {} ../ \;
# find ./ -iname '*.bz2' -exec cp {} ../ \;
# for /R ./ %%f in (*.snap) do copy %%f ../

# Navigate out and delete temp directory
echo 'Delete temp directory'
cd ..
# sudo rm -r ./temp

