#!/usr/bin/env node
// Import configured libs and args
const arg = process.argv[2];
const lib = require("./lib/libpicluster");
const {
  web_bootstrap,
  web_spawn,
  init,
  upgrade,
} = lib;

// Handle passed arguments
switch (arg) {
case "init":
  init();
  break;
case "upgrade":
  upgrade();
  break;
default:
  web_bootstrap().then(
    web_spawn()
  );
}
