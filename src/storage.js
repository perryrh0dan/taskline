#!/usr/bin/env node
"use strict";
const fs = require("fs");

class Storage {
  constructor() {
    this.data = null
    this.archive = null
  }

  get() {}

  getArchive() {}

  set() {}

  setArchive() {}
}

module.exports = Storage;
