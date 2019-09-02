'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const pkg = require('../package.json');

const {join} = path;
const {'default': defaultConfig} = pkg.configuration; //  eslint-disable-line quote-props

class Config {
  constructor() {
    this._configFile = join(os.homedir(), '.taskline.json');

    this._ensureConfigFile();
  }

  _ensureConfigFile() {
    if (fs.existsSync(this._configFile)) {
      return;
    }

    const data = JSON.stringify(defaultConfig, null, 4);
    fs.writeFileSync(this._configFile, data, 'utf8');
  }

  _formatTasklineDir(path) {
    return join(os.homedir(), path.replace(/^~/g, ''));
  }

  get() {
    let config = {};

    const content = fs.readFileSync(this._configFile, 'utf8');
    config = JSON.parse(content);

    if (config.tasklineDirectory.startsWith('~')) {
      config.tasklineDirectory = this._formatTasklineDir(config.tasklineDirectory);
    }

    return Object.assign({}, defaultConfig, config);
  }

  set(config) {
    const data = JSON.stringify(config, null, 4);
    fs.writeFileSync(this._configFile, data, 'utf8');
  }
}

module.exports = new Config();
