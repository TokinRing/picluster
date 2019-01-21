/*jshint esversion: 6 */
const path = require('path');
const fs = require('fs');

////
// TODO: sendFile needs refactoring
///

// Parse JSON config and set variable
let config = JSON.parse(fs.readFileSync((process.env.PICLUSTER_CONFIG ? process.env.PICLUSTER_CONFIG : '../config.json'), 'utf8'));
let {
  theme
} = config;

// Require libs and middleware
const lib = require("../lib/libpicluster");
const is_authenticated = require('../middleware/is_authenticated');

// Middleware to handle async errors (DRY way to catch errors)
const await_error_handler = middleware => {
  return async (req, res, next) => {
    try {
      await middleware(req, res, next);
    } catch (err) {
      next(err);
    }
  };
};

// Logo slug used for themes
let logo_slug = path.join(__dirname, '../assets/images/theme/', theme, '/logo.png');

// Export the html routes to main app
module.exports = (app) => {

  ////
  // Unauthenticated pages
  ////

  // Handle base requests, defaults to login page
  app.get('/', await_error_handler(async (req, res) => {
    if (req.user) {
      return res.redirect("/admin");
    }

    return res.redirect("/login");
  }));

  // Handle favicon
  app.get('/favicon.ico', await_error_handler(async (req, res) => {
    return res.sendFile(path.join(__dirname, '../assets/images/favicon.ico'));

  }));

  // Handle logo
  app.get('/logo.png', await_error_handler(async (req, res) => {
    return res.sendFile(logo_slug);
  }));

  ////
  // Authenticated pages
  ////
  app.get('/admin', is_authenticated, await_error_handler(async (req, res) => {
    return res.sendFile(path.join(__dirname, '../index.html'));
  }));

  app.get('/blank.html', is_authenticated, await_error_handler(async (req, res) => {
    return res.sendFile(path.join(__dirname, '../views/blank.html'));
  }));

  app.get('/config-system.html', is_authenticated, await_error_handler(async (req, res) => {
    return res.sendFile(path.join(__dirname, '../views/config-system.html'));
  }));

  app.get('/config-reload.html', is_authenticated, await_error_handler(async (req, res) => {
    return res.sendFile(path.join(__dirname, '../views/config-reload.html'));
  }));

  app.get('/containers-layout.html', is_authenticated, await_error_handler(async (req, res) => {
    return res.sendFile(path.join(__dirname, '../views/containers-layout.html'));
  }));

  app.get('/containers-manage.html', is_authenticated, await_error_handler(async (req, res) => {
    return res.sendFile(path.join(__dirname, '../views/containers-manage.html'));
  }));

  // TODO: Add or remove? not used anywhere, but is defined
  app.get('/containers-add.html', is_authenticated, await_error_handler(async (req, res) => {
    return res.sendFile(path.join(__dirname, '../views/containers-add.html'));
  }));

  app.get('/docs.html', is_authenticated, await_error_handler(async (req, res) => {
    return res.sendFile(path.join(__dirname, '../views/docs.html'));
  }));

  app.get('/elasticsearch.html', is_authenticated, await_error_handler(async (req, res) => {
    return res.sendFile(path.join(__dirname, '../views/elasticsearch.html'));
  }));

  app.get('/exec.html', is_authenticated, await_error_handler(async (req, res) => {
    return res.sendFile(path.join(__dirname, '../views/exec.html'));
  }));

  app.get('/functions-clear.html', is_authenticated, await_error_handler(async (req, res) => {
    return res.sendFile(path.join(__dirname, '../views/functions-clear.html'));
  }));

  app.get('/functions-create.html', is_authenticated, await_error_handler(async (req, res) => {
    return res.sendFile(path.join(__dirname, '../views/functions-create.html'));
  }));

  app.get('/functions-current.html', is_authenticated, await_error_handler(async (req, res) => {
    return res.sendFile(path.join(__dirname, '../views/functions-current.html'));
  }));

  app.get('/functions-viewer.html', is_authenticated, await_error_handler(async (req, res) => {
    return res.sendFile(path.join(__dirname, '../views/functions-viewer.html'));
  }));

  app.get('/heartbeat.html', is_authenticated, await_error_handler(async (req, res) => {
    return res.sendFile(path.join(__dirname, '../views/heartbeat.html'));
  }));

  app.get('/images-layout.html', is_authenticated, await_error_handler(async (req, res) => {
    return res.sendFile(path.join(__dirname, '../views/images-layout.html'));
  }));

  app.get('/images-manage.html', is_authenticated, await_error_handler(async (req, res) => {
    return res.sendFile(path.join(__dirname, '../views/images-manage.html'));
  }));

  app.get('/images-prune.html', is_authenticated, await_error_handler(async (req, res) => {
    return res.sendFile(path.join(__dirname, '../views/images-prune.html'));
  }));

  // TODO: Add or remove? not used anywhere, but is defined
  app.get('/images-pull.html', is_authenticated, await_error_handler(async (req, res) => {
    return res.sendFile(path.join(__dirname, '../views/images-pull.html'));
  }));

  // TODO: Add or remove? not used anywhere, but is defined
  app.get('/images-upload.html', is_authenticated, await_error_handler(async (req, res) => {
    return res.sendFile(path.join(__dirname, '../views/images-upload.html'));
  }));

  app.get('/log.html', is_authenticated, await_error_handler(async (req, res) => {
    return res.sendFile(path.join(__dirname, '../views/log.html'));
  }));

  app.get('/menu.html', is_authenticated, await_error_handler(async (req, res) => {
    return res.sendFile(path.join(__dirname, '../views/menu.html'));
  }));

  app.get('/nodes-list.html', is_authenticated, await_error_handler(async (req, res) => {
    return res.sendFile(path.join(__dirname, '../views/nodes-list.html'));
  }));

  app.get('/nodes-manage.html', is_authenticated, await_error_handler(async (req, res) => {
    return res.sendFile(path.join(__dirname, '../views/nodes-manage.html'));
  }));

  // TODO: Add or remove? not used anywhere, but is defined
  app.get('/nodes-add.html', is_authenticated, await_error_handler(async (req, res) => {
    return res.sendFile(path.join(__dirname, '../views/nodes-add.html'));
  }));

  // TODO: Add or remove? not used anywhere, but is defined
  app.get('/nodes-remove.html', is_authenticated, await_error_handler(async (req, res) => {
    return res.sendFile(path.join(__dirname, '../views/nodes-remove.html'));
  }));

  app.get('/rsyslog.html', is_authenticated, await_error_handler(async (req, res) => {
    return res.sendFile(path.join(__dirname, '../views/rsyslog.html'));
  }));

  app.get('/swarm.html', is_authenticated, await_error_handler(async (req, res) => {
    return res.sendFile(path.join(__dirname, '../views/swarm.html'));
  }));

  app.get('/syslog.html', is_authenticated, await_error_handler(async (req, res) => {
    return res.sendFile(path.join(__dirname, '../views/syslog.html'));
  }));

  app.get('/terminal.html', is_authenticated, await_error_handler(async (req, res) => {
    return res.sendFile(path.join(__dirname, '../views/terminal.html'));
  }));

  app.get('/user.html', is_authenticated, await_error_handler(async (req, res) => {
    return res.sendFile(path.join(__dirname, '../views/user.html'));
  }));

  // TODO: Migrate to html routes, once that goddamn iframe is removed
  // serve_doc_pages();
};
