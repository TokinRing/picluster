/*jshint esversion: 6 */
const path = require('path');
const fs = require('fs');

////
// TODO: saveFile needs refactoring
///

// Parse JSON config
let config = JSON.parse(fs.readFileSync((process.env.PICLUSTER_CONFIG ? process.env.PICLUSTER_CONFIG : '../config.json'), 'utf8'));

// Require middleware to check user login status
const is_authenticated = require('../config/middleware/is_authenticated');

// Require api libs
const apilib = require("../lib/api-lib");

// See! With ONE LINE! How hard is that? :p
let theme = config.theme;

// Logo slug used for themes
let logo_slug = path.join(__dirname, '../assets/images/theme/', theme, '/logo.png');

// Export the html routes to main app
module.exports = (app) => {
  // Handle favicon
  app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, '../assets/images/favicon.ico'));
  });

  // Handle logo
  app.get('/logo.png', (req, res) => {
    res.sendFile(logo_slug);
  });

  // Handle base requests, defaults to login page
  app.get('/', (req, res) => {
    // If user logged in redirect to admin page
    if (req.user) {
      res.redirect("/admin");
    }

    // Fall through to login page
    res.sendFile(path.join(__dirname, '../views/login.html'));
  });

  // Handle login page
  app.get('/login', (req, res) => {
    // If user logged in redirect to admin page
    if (req.user) {
      res.redirect("/admin");
    }

    // Fall through to login page
    res.sendFile(path.join(__dirname, '../views/login.html'));
  });

  // Handle login page
  app.get('/login', (req, res) => {
    // If user logged in redirect to admin page
    if (req.user) {
      res.redirect("/admin");
    }

    // Fall through to login page
    res.sendFile(path.join(__dirname, '../views/login.html'));
  });

  // Handle signup page
  app.get('/login', (req, res) => {
    // If user logged in redirect to admin page
    if (req.user) {
      res.redirect("/admin");
    }

    // Fall through to signup page
    res.sendFile(path.join(__dirname, '../views/signup.html'));
  });

  // Admin page for logged in users
  app.get('/admin', is_authenticated, (req,res) => {
    res.sendFile(path.join(__dirname, '../views/index.html'));
  });

  app.get('/blank.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/blank.html'));
  });

  app.get('/config-edit.html', is_authenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/config-edit.html'));
  });

  app.get('/config-reload.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/config-reload.html'));
  });

  app.get('/containers-layout.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/containers-layout.html'));
  });

  app.get('/containers-manage.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/containers-manage.html'));
  });

  // TODO: Add or remove? not used anywhere, but is defined
  app.get('/containers-add.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/containers-add.html'));
  });

  app.get('/docs.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/docs.html'));
  });

  app.get('/elasticsearch.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/elasticsearch.html'));
  });

  app.get('/exec.html', is_authenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/exec.html'));
  });

  app.get('/functions-clear.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/functions-clear.html'));
  });

  app.get('/functions-create.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/functions-create.html'));
  });

  app.get('/functions-current.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/functions-current.html'));
  });

  app.get('/functions-viewer.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/functions-viewer.html'));
  });

  app.get('/heartbeat.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/heartbeat.html'));
  });

  app.get('/images-layout.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/images-layout.html'));
  });

  app.get('/images-manage.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/images-manage.html'));
  });

  app.get('/images-prune.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/images-prune.html'));
  });

  // TODO: Add or remove? not used anywhere, but is defined
  app.get('/images-pull.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/images-pull.html'));
  });

  // TODO: Add or remove? not used anywhere, but is defined
  app.get('/images-upload.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/images-upload.html'));
  });

  app.get('/log.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/log.html'));
  });

  app.get('/nodes-list.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/nodes-list.html'));
  });

  app.get('/nodes-manage.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/nodes-manage.html'));
  });

  // TODO: Add or remove? not used anywhere, but is defined
  app.get('/nodes-add.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/nodes-add.html'));
  });

  // TODO: Add or remove? not used anywhere, but is defined
  app.get('/nodes-remove.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/nodes-remove.html'));
  });

  app.get('/rsyslog.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/rsyslog.html'));
  });

  app.get('/swarm.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/swarm.html'));
  });

  app.get('/syslog.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/syslog.html'));
  });

  app.get('/terminal.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/terminal.html'));
  });

  // TODO: Migrate to html routes, once that goddamn iframe is removed
  // serve_doc_pages();
};
