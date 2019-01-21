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

// Logo slug used for themes
let logo_slug = path.join(__dirname, '../assets/images/theme/', theme, '/logo.png');

// Export the html routes to main app
module.exports = (app) => {

  ////
  // Unauthenticated pages
  ////


  // Handle base requests, defaults to login page
  app.get('/', async (req, res) => {
    if (req.user) {
      try {
        return await res.redirect("/admin");
      } catch (err) {
        return await res.json(err);
      }
    }

    try {
      return await res.redirect("/login");
    } catch (err) {
      return await res.json(err);
    }
  });

  // Handle favicon
  app.get('/favicon.ico', async (req, res) => {
    try {
      return await res.sendFile(path.join(__dirname, '../assets/images/favicon.ico'));
    } catch (err) {
      return await res.json(err);
    }
  });

  // Handle logo
  app.get('/logo.png', async (req, res) => {
    try {
      return await res.sendFile(logo_slug);
    } catch (err) {
      return await res.json(err);
    }
  });

  ////
  // Authenticated pages
  ////
  app.get('/admin', is_authenticated, async (req, res) => {
    try {
      return await res.sendFile(path.join(__dirname, '../index.html'));
    } catch (err) {
      return await res.json(err);
    }
  });

  app.get('/blank.html', is_authenticated, async (req, res) => {
    try {
      return await res.sendFile(path.join(__dirname, '../views/blank.html'));
    } catch (err) {
      return await res.json(err);
    }
  });

  app.get('/config-system.html', is_authenticated, async (req, res) => {
    try {
      return await res.sendFile(path.join(__dirname, '../views/config-system.html'));
    } catch (err) {
      return await res.json(err);
    }
  });

  app.get('/config-reload.html', is_authenticated, async (req, res) => {
    try {
      return await res.sendFile(path.join(__dirname, '../views/config-reload.html'));
    } catch (err) {
      return await res.json(err);
    }
  });

  app.get('/containers-layout.html', is_authenticated, async (req, res) => {
    try {
      return await res.sendFile(path.join(__dirname, '../views/containers-layout.html'));
    } catch (err) {
      return await res.json(err);
    }
  });

  app.get('/containers-manage.html', is_authenticated, async (req, res) => {
    try {
      return await res.sendFile(path.join(__dirname, '../views/containers-manage.html'));
    } catch (err) {
      return await res.json(err);
    }
  });

  // TODO: Add or remove? not used anywhere, but is defined
  app.get('/containers-add.html', is_authenticated, async (req, res) => {
    try {
      return await res.sendFile(path.join(__dirname, '../views/containers-add.html'));
    } catch (err) {
      return await res.json(err);
    }
  });

  app.get('/docs.html', is_authenticated, async (req, res) => {
    try {
      return await res.sendFile(path.join(__dirname, '../views/docs.html'));
    } catch (err) {
      return await res.json(err);
    }
  });

  app.get('/elasticsearch.html', is_authenticated, async (req, res) => {
    try {
      return await res.sendFile(path.join(__dirname, '../views/elasticsearch.html'));
    } catch (err) {
      return await res.json(err);
    }
  });

  app.get('/exec.html', is_authenticated, async (req, res) => {
    try {
      return await res.sendFile(path.join(__dirname, '../views/exec.html'));
    } catch (err) {
      return await res.json(err);
    }
  });

  app.get('/functions-clear.html', is_authenticated, async (req, res) => {
    try {
      return await res.sendFile(path.join(__dirname, '../views/functions-clear.html'));
    } catch (err) {
      return await res.json(err);
    }
  });

  app.get('/functions-create.html', is_authenticated, async (req, res) => {
    try {
      return await res.sendFile(path.join(__dirname, '../views/functions-create.html'));
    } catch (err) {
      return await res.json(err);
    }
  });

  app.get('/functions-current.html', is_authenticated, async (req, res) => {
    try {
      return await res.sendFile(path.join(__dirname, '../views/functions-current.html'));
    } catch (err) {
      return await res.json(err);
    }
  });

  app.get('/functions-viewer.html', is_authenticated, async (req, res) => {
    try {
      return await res.sendFile(path.join(__dirname, '../views/functions-viewer.html'));
    } catch (err) {
      return await res.json(err);
    }
  });

  app.get('/heartbeat.html', is_authenticated, async (req, res) => {
    try {
      return await res.sendFile(path.join(__dirname, '../views/heartbeat.html'));
    } catch (err) {
      return await res.json(err);
    }
  });

  app.get('/images-layout.html', is_authenticated, async (req, res) => {
    try {
      return await res.sendFile(path.join(__dirname, '../views/images-layout.html'));
    } catch (err) {
      return await res.json(err);
    }
  });

  app.get('/images-manage.html', is_authenticated, async (req, res) => {
    try {
      return await res.sendFile(path.join(__dirname, '../views/images-manage.html'));
    } catch (err) {
      return await res.json(err);
    }
  });

  app.get('/images-prune.html', is_authenticated, async (req, res) => {
    try {
      return await res.sendFile(path.join(__dirname, '../views/images-prune.html'));
    } catch (err) {
      return await res.json(err);
    }
  });

  // TODO: Add or remove? not used anywhere, but is defined
  app.get('/images-pull.html', is_authenticated, async (req, res) => {
    try {
      return await res.sendFile(path.join(__dirname, '../views/images-pull.html'));
    } catch (err) {
      return await res.json(err);
    }
  });

  // TODO: Add or remove? not used anywhere, but is defined
  app.get('/images-upload.html', is_authenticated, async (req, res) => {
    try {
      return await res.sendFile(path.join(__dirname, '../views/images-upload.html'));
    } catch (err) {
      return await res.json(err);
    }
  });

  app.get('/log.html', is_authenticated, async (req, res) => {
    try {
      return await res.sendFile(path.join(__dirname, '../views/log.html'));
    } catch (err) {
      return await res.json(err);
    }
  });

  app.get('/menu.html', is_authenticated, async (req, res) => {
    try {
      return await res.sendFile(path.join(__dirname, '../views/menu.html'));
    } catch (err) {
      return await res.json(err);
    }
  });

  app.get('/nodes-list.html', is_authenticated, async (req, res) => {
    try {
      return await res.sendFile(path.join(__dirname, '../views/nodes-list.html'));
    } catch (err) {
      return await res.json(err);
    }
  });

  app.get('/nodes-manage.html', is_authenticated, async (req, res) => {
    try {
      return await res.sendFile(path.join(__dirname, '../views/nodes-manage.html'));
    } catch (err) {
      return await res.json(err);
    }
  });

  // TODO: Add or remove? not used anywhere, but is defined
  app.get('/nodes-add.html', is_authenticated, async (req, res) => {
    try {
      return await res.sendFile(path.join(__dirname, '../views/nodes-add.html'));
    } catch (err) {
      return await res.json(err);
    }
  });

  // TODO: Add or remove? not used anywhere, but is defined
  app.get('/nodes-remove.html', is_authenticated, async (req, res) => {
    try {
      return await res.sendFile(path.join(__dirname, '../views/nodes-remove.html'));
    } catch (err) {
      return await res.json(err);
    }
  });

  app.get('/rsyslog.html', is_authenticated, async (req, res) => {
    try {
      return await res.sendFile(path.join(__dirname, '../views/rsyslog.html'));
    } catch (err) {
      return await res.json(err);
    }
  });

  app.get('/swarm.html', is_authenticated, async (req, res) => {
    try {
      return await res.sendFile(path.join(__dirname, '../views/swarm.html'));
    } catch (err) {
      return await res.json(err);
    }
  });

  app.get('/syslog.html', is_authenticated, async (req, res) => {
    try {
      return await res.sendFile(path.join(__dirname, '../views/syslog.html'));
    } catch (err) {
      return await res.json(err);
    }
  });

  app.get('/terminal.html', is_authenticated, async (req, res) => {
    try {
      return await res.sendFile(path.join(__dirname, '../views/terminal.html'));
    } catch (err) {
      return await res.json(err);
    }
  });

  app.get('/user.html', is_authenticated, async (req, res) => {
    try {
      return await res.sendFile(path.join(__dirname, '../views/user.html'));
    } catch (err) {
      return await res.json(err);
    }
  });

  // TODO: Migrate to html routes, once that goddamn iframe is removed
  // serve_doc_pages();
};
