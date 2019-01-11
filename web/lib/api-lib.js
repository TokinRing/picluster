/*jshint esversion: 6 */
// This is where abstract and modular functions for the api go
// include with ```const api-lib = require("../lib/api-lib");```

const path = require('path');
const fs = require('fs');

let config = JSON.parse(fs.readFileSync((process.env.PICLUSTER_CONFIG ? process.env.PICLUSTER_CONFIG : '../config.json'), 'utf8'));
let user = config.web_username;
let password = config.web_password;
let server = config.web_connect;
const scheme = config.ssl ? 'https://' : 'http://';
const ssl_self_signed = config.ssl_self_signed === false;
const request_timeout = 5000;
let {token} = config;
let {server_port} = config;

// TODO: function needs styling correction and refactoring
function sendFile(file, temp_file) {
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
}

function getData() {
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
}

// Call get data to initialize view
getData();

function display_log(callback) {
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
}

function clear_log(callback) {
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
}
