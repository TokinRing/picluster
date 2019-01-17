/*jshint esversion: 6 */
// This is where abstract and modular functions for the web gui go
// include with ```const weblib = require("../lib/web");```

const path = require('path');
const fs = require('fs');

module.exports = {
  generate_token: () => {
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const api_token_length = 32;
    let api_token = "";

    for (let i = 0; i <= api_token_length; i++) {
      api_token += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return api_token;
  },

  get_file_list_by_extension: (dirpath, extention) => {
    const files = fs.readdirSync(dirpath);
    let file_list = [];

    for (const i in files) {
      if (path.extname(files[i]) === extention) {
        file_list.push(files[i]);
      }
    }

    return file_list;
  },

  /*
  Removing for now

  function serve_doc_pages() {
    const doc_pages = get_file_list_by_extention(path.join(__dirname, doc_dir.toString()), '.md');

    for (const i in doc_pages) {
      if (i) {
        app.get('/doc' + i, (req, res) => {
          res.sendFile(path.join(__dirname + '/' + doc_dir + '/' + doc_pages[i]));
        });
      }
    }
  }
    */

  reloadVariables: () => {
    try {
      config = JSON.parse(fs.readFileSync((process.env.PICLUSTER_CONFIG ? process.env.PICLUSTER_CONFIG : '../config.json'), 'utf8'));
      token = config.token;
      server = config.web_connect;
      server_port = config.server_port;
      syslog = config.syslog;
      theme = config.theme;
      logo_slug = path.join(__dirname, '/assets/images/theme/', theme, '/logo.png');
    } catch (error) {
      console.log('\nError parsing JSON while trying to update config');
    }
  },

  updateConfig: (payload) => {
    let updated_config_file = '';

    if (process.env.PICLUSTER_CONFIG) {
      updated_config_file = process.env.PICLUSTER_CONFIG;
    } else {
      updated_config_file = '../config.json';
    }

    setTimeout(() => {
      fs.writeFile(updated_config_file, payload, err => {
        if (err) {
          console.log(err);
        } else {
          reloadVariables();
        }
      });
    }, 10000);
  }

};
