/*jshint esversion: 6 */
// This is where abstract and modular functions for the api go
// include with ```const lib = require("../lib/libpicluster");```

const path = require('path');
const fs = require('fs');
const request = require('request');
const ip = require('ip');

let config = JSON.parse(fs.readFileSync((process.env.PICLUSTER_CONFIG ? process.env.PICLUSTER_CONFIG : '../config.json'), 'utf8'));
let server = config.web_connect;
const scheme = config.ssl ? 'https://' : 'http://';
const ssl_self_signed = config.ssl_self_signed === false;
const request_timeout = 5000;
let {token} = config;
let {server_port} = config;

module.exports = {
  // TODO: function needs styling correction and refactoring
  sendFile: (file, temp_file) => {
    const formData = {
      name: 'file',
      token,
      file: fs.createReadStream(file)
    };

    const options = {
      url: `${scheme}${server}:${server_port}/receive-file`,
      rejectUnauthorized: ssl_self_signed,
      formData
    };

    request.post(options, err => {
      if (err) {
        console.error('upload failed:', err);
      } else {
        fs.unlink(temp_file, error => {
          if (error) {
            console.log(error);
          }
        });
        console.log('Upload successful!');
      }
    });
  },

  getData: () => {
    setTimeout(() => {
      const options = {
        url: `${scheme}${server}:${server_port}/nodes?token=${token}`,
        rejectUnauthorized: ssl_self_signed
      };

      request(options, (error, response) => {
        if (!error && response.statusCode === 200) {
          try {
            nodedata = JSON.parse(response.body);
          } catch (error2) {
            console.error(error2);
          }
        } else {
          console.log('\nError connecting with server. ' + error);
        }
      });
      getData();
    }, 5000); // TODO: Change to a constant from a config value
  },
  async_handler: fn = (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next)
  display_log: (callback) => {
    const options = {
      url: `${scheme}${server}:${server_port}/log?token=${token}`,
      rejectUnauthorized: ssl_self_signed
    };

    clear_log(() => {
      setTimeout(() => {
        request(options, (error, response, body) => {
          if (!error && response.statusCode === 200) {
            callback(body);
          } else {
            callback('\nError connecting with server.');
          }
        });
      }, request_timeout);
    });
  },

  clear_log: (callback) => {
    const options = {
      url: `${scheme}${server}:${server_port}/clearlog?token=${token}`,
      rejectUnauthorized: ssl_self_signed
    };

    request(options, (error, response) => {
      if (!error && response.statusCode === 200) {
        callback('');
      } else {
        console.log('\nError clearing log: ' + error);
      }
    });
  },

  get_ip: () => {
    return ip.address();
  },

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
