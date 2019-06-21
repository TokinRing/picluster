#!/usr/bin/env node
// Import configured libs and args
const arg = process.argv[2];
const lib = require("./lib/libpicluster");
const {
  slave_bootstrap,
  slave_spawn
} = lib;

// NOTE: Setup to handle future argument handling
switch(arg) {
default:
  slave_bootstrap().then(
    slave_spawn()
  );
}
