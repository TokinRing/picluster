/*jshint esversion: 6 */
// API calls stored here. Broken down into 2 sections:
// GET and POST
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Require models, configured passport and libs
const models = require("../models");
const passport = require("../passport");
const lib = require("../lib/libpicluster");
const is_authenticated = require('../middleware/is_authenticated');

// Specify upload destination path
const upload = multer({
  dest: '../'
});

let nodedata = '';

const config = models.Config.all;

console.log(config);

module.exports = (app) => {
  ////
  // POST Section
  ////

  // Use passport.authenticate middleware with local strategy
  // If credentials are valid send to admin page
  app.route('/login')
    .get(async_handler((req, res) => {
      await res.sendFile(path.join(__dirname, '../login.html'));
    }))
    .post(passport.authenticate("local"), async_handler((req, res) => {
      await res.redirect("/admin");
    }));

  // Route for user register. If successfully created, login else throw error
  app.route('/register')
    .get(async (req, res) => {
      await res.sendFile(path.join(__dirname, '../register.html'));
    })
    .post(async (req, res) => {
      models.User.create({
        username: req.body.new_username,
        password: req.body.new_password,
        api_token: lib.generate_token()
      }).then(async () => {
        await res.redirect("/admin");
      }).catch(async (err) => {
        await res.json(err);
      });
    });

  // Handle POSTing new config data
  // TODO: Remove this API handle once system config view is made
  app.post('/sendconfig', is_authenticated, (req, res) => {
    // wtf is this stored as an object? wtf expand on 3 lines what can be done in 1?
    const {
      payload
    } = req.body;

    const command = JSON.stringify({
      payload,
      token
    });

    const options = {
      url: `${scheme}${server}:${server_port}/updateconfig`,
      rejectUnauthorized: ssl_self_signed,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': command.length
      },
      body: command,
      token
    };

    request(options, (error, response, body) => {
      if (error) {
        res.end(error);
      } else {
        updateConfig(payload);
        res.end(body);
      }
    });
  });

  // Handle POSTs to elasticsearch
  app.post('/elasticsearch', is_authenticated, (req, res) => {
    // wtf is this stored as an object? wtf expand on 3 lines what can be done in 1?
    const {
      elasticsearch_url
    } = req.body;

    // wtf is this stored as an object? wtf expand on 3 lines what can be done in 1?
    const {
      mode
    } = req.body;

    const command = JSON.stringify({
      command: req.body.command,
      token,
      elasticsearch_url,
      mode
    });

    const options = {
      url: `${scheme}${server}:${server_port}/elasticsearch`,
      rejectUnauthorized: ssl_self_signed,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': command.length
      },
      body: command
    };

    request(options, error => {
      if (error) {
        res.end(error);
      } else {
        display_log(data => {
          res.end(data);
        });
      }
    });
  });

  // Handle POSTs to list commands
  app.post('/listcommands', (req, res) => {
    const token_body = JSON.stringify({
      token
    });

    const options = {
      url: `${scheme}${server}:${server_port}/listcommands`,
      rejectUnauthorized: ssl_self_signed,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': token_body.length
      },
      body: token_body
    };

    request(options, (error, response, body) => {
      if (error) {
        res.end(error);
      } else {
        res.end(body);
      }
    });
  });

  // Handle POSTs to exec
  app.post('/exec', is_authenticated, (req, res) => {
    const {
      node
    } = req.body;

    const command = JSON.stringify({
      command: req.body.command,
      token,
      node
    });

    const options = {
      url: `${scheme}${server}:${server_port}/exec`,
      rejectUnauthorized: ssl_self_signed,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': command.length
      },
      body: command
    };

    request(options, (error, response) => {
      try {
        if (error) {
          res.end(error);
        } else {
          res.end(response.body);
        }
      } catch (error2) {
        res.end('\nAn error has occurred while retrieving the command.');
      }
    });
  });

  app.post('/changehost', is_authenticated, (req, res) => {
    const {
      newhost
    } = req.body;

    let container;

    if (req.body.container) {
      container = req.body.container;
      if (container.indexOf('Everything') > -1) {
        container = '';
      }
    }

    const options = {
      url: `${scheme}${server}:${server_port}/changehost?token=${token}&container=${container}&newhost=${newhost}`,
      rejectUnauthorized: ssl_self_signed
    };

    request(options, (error, response) => {
      if (!error && response.statusCode === 200) {
        display_log(data => {
          res.end(data);
        });
      } else {
        res.end('\nError connecting with server.');
      }
    });
  });

  app.post('/update-container', is_authenticated, (req, res) => {
    // wtf is this stored as an object? wtf expand on 3 lines what can be done in 1?
    const {
      container_args
    } = req.body;

    // wtf is this stored as an object? wtf expand on 3 lines what can be done in 1?
    const {
      container
    } = req.body;

    // wtf is this stored as an object? wtf expand on 3 lines what can be done in 1?
    const {
      heartbeat_args
    } = req.body;

    // wtf is this stored as an object? wtf expand on 3 lines what can be done in 1?
    const {
      failover_constraints
    } = req.body;

    if (container) {
      const options = {
        url: `${scheme}${server}:${server_port}/update-container?token=${token}&container=${container}&container_args=${container_args}&heartbeat_args=${heartbeat_args}&failover_constraints=${failover_constraints}`,
        rejectUnauthorized: ssl_self_signed
      };

      request(options, (error, response) => {
        if (!error && response.statusCode === 200) {
          display_log(data => {
            res.end(data);
          });
        } else {
          res.end('\nError connecting with server.');
        }
      });
    } else {
      res.end('\nError missing some parameters.');
    }
  });

  app.post('/addcontainer', is_authenticated, (req, res) => {
    // wtf is this stored as an object? wtf expand on 3 lines what can be done in 1?
    const {
      host
    } = req.body;

    // wtf is this stored as an object? wtf expand on 3 lines what can be done in 1?
    const {
      container_args
    } = req.body;

    // wtf is this stored as an object? wtf expand on 3 lines what can be done in 1?
    const {
      heartbeat_args
    } = req.body;

    // wtf is this stored as an object? wtf expand on 3 lines what can be done in 1?
    let {
      failover_constraints
    } = req.body;

    // wtf is this stored as an object? wtf expand on 3 lines what can be done in 1?
    const {
      container
    } = req.body;

    if (failover_constraints) {
      if (failover_constraints.indexOf('none') > -1) {
        failover_constraints = '';
      }
    }

    if ((container) && (container_args) && (host)) {
      const options = {
        url: `${scheme}${server}:${server_port}/addcontainer?token=${token}&container=${container}&host=${host}&container_args=${container_args}&heartbeat_args=${heartbeat_args}&failover_constraints=${failover_constraints}`,
        rejectUnauthorized: ssl_self_signed
      };

      request(options, (error, response) => {
        if (!error && response.statusCode === 200) {
          display_log(data => {
            res.end(data);
          });
        } else {
          res.end('\nError connecting with server.');
        }
      });
    } else {
      res.end('\nError missing some parameters.');
    }
  });

  app.post('/upload', is_authenticated, upload.single('file'), (req, res) => {
    fs.readFile(req.file.path, (err, data) => {
      if (err) {
        console.log('\nReadFile Error:' + err);
      }
      const newPath = path.join('../', req.file.originalname);
      fs.writeFile(newPath, data, () => {
        sendFile(newPath, req.file.path);
        res.end('');
      });
    });
  });

  app.post('/removecontainerconfig', is_authenticated, (req, res) => {
    const {
      container
    } = req.body;

    if (container) {
      const options = {
        url: `${scheme}${server}:${server_port}/removecontainerconfig?token=${token}&container=${container}`,
        rejectUnauthorized: ssl_self_signed
      };

      request(options, (error, response) => {
        if (!error && response.statusCode === 200) {
          display_log(data => {
            res.end(data);
          });
        } else {
          res.end('\nError connecting with server.');
        }
      });
    } else {
      res.end('\nError container name.');
    }
  });

  app.post('/swarm-remove', is_authenticated, (req, res) => {
    const {
      host
    } = req.body;

    if (host) {
      const payload = JSON.stringify({
        host,
        token
      });

      const options = {
        url: `${scheme}${server}:${server_port}/swarm-remove`,
        rejectUnauthorized: ssl_self_signed,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': payload.length
        },
        body: payload
      };

      request(options, (error, response) => {
        if (!error && response.statusCode === 200) {
          display_log(data => {
            res.end(data);
          });
        } else {
          res.end('\nError connecting with server.');
        }
      });
    } else { // TODO: this could be validated better
      res.end('\nError missing host name.');
    }
  });

  app.post('/swarm-create', is_authenticated, (req, res) => {
    const {
      host
    } = req.body;

    if (host) {
      const payload = JSON.stringify({
        host,
        token
      });

      const options = {
        url: `${scheme}${server}:${server_port}/swarm-create`,
        rejectUnauthorized: ssl_self_signed,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': payload.length
        },
        body: payload
      };

      request(options, (error, response) => {
        if (!error && response.statusCode === 200) {
          display_log(data => {
            res.end(data);
          });
        } else {
          res.end('\nError connecting with server.');
        }
      });
    } else {
      res.end('\nError missing host name.');
    }
  });

  app.post('/swarm-network-create', is_authenticated, (req, res) => {
    const {
      host
    } = req.body;
    const {
      network
    } = req.body;
    if (host) {
      const payload = JSON.stringify({
        host,
        token,
        network
      });

      const options = {
        url: `${scheme}${server}:${server_port}/swarm-network-create`,
        rejectUnauthorized: ssl_self_signed,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': payload.length
        },
        body: payload
      };

      request(options, (error, response) => {
        if (!error && response.statusCode === 200) {
          display_log(data => {
            res.end(data);
          });
        } else {
          res.end('\nError connecting with server.');
        }
      });
    } else {
      res.end('\nError missing host name.');
    }
  });

  app.post('/addhost', is_authenticated, (req, res) => {
    const {
      host
    } = req.body;

    if (host) {
      const options = {
        url: `${scheme}${server}:${server_port}/addhost?token=${token}&host=${host}`,
        rejectUnauthorized: ssl_self_signed
      };

      request(options, (error, response) => {
        if (!error && response.statusCode === 200) {
          display_log(data => {
            res.end(data);
          });
        } else {
          res.end('\nError connecting with server.');
        }
      });
    } else {
      res.end('\nError missing host name.');
    }
  });

  app.post('/rmhost', is_authenticated, (req, res) => {
    const {
      host
    } = req.body;

    if (host) {
      const options = {
        url: `${scheme}${server}:${server_port}/rmhost?token=${token}&host=${host}`,
        rejectUnauthorized: ssl_self_signed
      };

      request(options, (error, response) => {
        if (!error && response.statusCode === 200) {
          display_log(data => {
            res.end(data);
          });
        } else {
          res.end('\nError connecting with server.');
        }
      });
    } else {
      res.end('\nError missing host name.');
    }
  });

  app.post('/manage', is_authenticated, (req, res) => {
    const {
      operation
    } = req.body;
    let container;

    if (req.body.container) {
      container = req.body.container;
      if (container.indexOf('Everything') > -1) {
        container = '';
      }
    }

    const options = {
      url: `${scheme}${server}:${server_port}/manage?token=${token}&container=${container}&operation=${operation}`,
      rejectUnauthorized: ssl_self_signed
    };

    request(options, (error, response) => {
      try {
        if (error) {
          res.end(error);
        } else {
          res.end(response.body);
        }
      } catch (error2) {
        res.end('\nAn error has occurred while trying to manage the container(s).');
      }
    });
  });

  app.post('/manage-image', is_authenticated, (req, res) => {
    const {
      operation
    } = req.body;
    let container;
    const {
      no_cache
    } = req.body;

    if (req.body.container) {
      container = req.body.container;
      if (container.indexOf('Everything') > -1) {
        container = '';
      }
    }

    const options = {
      url: `${scheme}${server}:${server_port}/manage-image?token=${token}&container=${container}&operation=${operation}&no_cache=${no_cache}`,
      rejectUnauthorized: ssl_self_signed
    };

    request(options, (error, response) => {
      try {
        if (error) {
          res.end(error);
        } else {
          res.end(response.body);
        }
      } catch (error2) {
        res.end('\nAn error has occurred while trying to manage the container(s).');
      }
    });
  });

  ////
  // GET Section
  ////

  // Route for user logout
  app.get("/logout", (req, res) => {
    if (req.user && req.cookies.user_sid) {
      res.clearCookie('user_sid');
      res.redirect('/');
    }

    res.redirect('/login');
  });

  // Route for getting user data used client side
  app.get("/api/user_data", function(req, res) {
    if (!req.user) {
      // The user is not logged in, send back an empty object
      res.json({});
    } else {
      // Send back the username and id
      res.json({
        username: req.user.username,
        id: req.user.id,
        api_token: req.user.api_token
      });
    }
  });

  // Route for getting config data used client side
  app.get("/api/config_data", function(req, res) {
    if (!req.user) {
      // The user is not logged in, send back an empty object
      res.json({});
    } else {
      // Send back the username and id
      res.json({
        username: req.user.username,
        id: req.user.id,
        api_token: req.user.api_token
      });
    }
  });

  // Handle sending list of .md files in docs
  app.get('/listdocs', (req, res) => {
    res.json(get_file_list_by_extention(path.join(__dirname, doc_dir.toString()), '.md'));
  });

  // List registries from docker hub
  app.get('/listregistries', is_authenticated, (req, res) => {
    // Registries to pull from
    const registries = [{
      name: 'hub.docker.com'
    }];

    if (config.dockerRegistries && config.dockerRegistries.length > 0) {
      config.dockerRegistries.forEach(registry => {
        registries.push({
          name: registry
        });
      });
    }

    // Respond with json formatted registry list
    res.json(registries);
  });

  // Handle remote image tags from docker hub
  app.get('/remoteimagetags', is_authenticated, (req, res) => {

    const { registry, image, page, username, password } = req.query;

    if (!registry || !image) {
      return res.status(400).end('\nError: Invalid Credentials');
    }

    let endpoint;
    switch (registry) {
      case 'hub.docker.com':
        endpoint = 'https://hub.docker.com/v2/repositories/' + ((image.indexOf('/') === -1) ? ('library/' + image) : image) + '/tags/?page=' + page + '&page_size=500';
        break;
      default:
        // Custom registries
        endpoint = ((registry.startsWith('http://') || registry.startsWith('https://')) ? registry : 'https://' + registry) + '/v2/' + image + '/tags/list';
        break;
    }

    const options = {
      url: endpoint,
      headers: ((username && password)) ? {
        Authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
      } : {}
    };

    request(options, (error, response, body) => {
      if (!error && response.statusCode !== 200) {
        error = body;
      }

      res.status(response.statusCode).end((error) ? JSON.stringify({
        error: error.toString()
      }) : body);
    });
  });

  // List remote images from docker hub
  app.get('/remoteimages', is_authenticated, (req, res) => {
    // wtf is this stored as an object? wtf expand on 3 lines what can be done in 1?
    const {
      registry
    } = req.query;

    // wtf is this stored as an object? wtf expand on 3 lines what can be done in 1?
    const {
      image
    } = req.query;

    // wtf is this stored as an object? wtf expand on 3 lines what can be done in 1?
    const {
      page
    } = req.query || 1;

    // wtf is this stored as an object? wtf expand on 3 lines what can be done in 1?
    const {
      username
    } = req.query || '';

    // wtf is this stored as an object? wtf expand on 3 lines what can be done in 1?
    const {
      password
    } = req.query || '';

    if (!registry || !image) {
      return res.status(400).end('\nError: Bad Request');
    }

    let endpoint;
    switch (registry) {
      case 'hub.docker.com':
        endpoint = 'https://hub.docker.com/v2/search/repositories/?page=' + page + '&query=' + image;
        break;
      default:
        // Custom registries
        endpoint = ((registry.startsWith('http://') || registry.startsWith('https://')) ? registry : 'https://' + registry) + '/v2/_catalog';
        break;
    }

    const options = {
      url: endpoint,
      headers: ((username && password)) ? {
        Authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
      } : {}
    };

    request(options, (error, response, body) => {
      if (!error && response.statusCode !== 200) {
        error = body;
      }

      res.status(response.statusCode).end((error) ? JSON.stringify({
        error: error.toString()
      }) : body);
    });
  });

  app.get('/syslog', is_authenticated, (req, res) => {
    const check_token = req.query.token;
    const command = JSON.stringify({
      token
    });

    const options = {
      url: `${scheme}${server}:${server_port}/syslog`,
      rejectUnauthorized: ssl_self_signed,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': command.length
      },
      body: command
    };

    request(options, (error, response) => {
      // TODO: this needs refactoring
      try {
        if (error) {
          res.end(error);
        } else {
          res.end(response.body);
        }
      } catch (error2) {
        res.end('\nAn error has occurred while retrieving the Syslog.');
      }
    });
  });

  app.get('/rsyslog', is_authenticated, (req, res) => {
    const options = {
      url: `${scheme}${server}:${server_port}/rsyslog?token=${token}`,
      rejectUnauthorized: ssl_self_signed
    };

    request(options, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        res.end(body);
      } else {
        res.end('\nError connecting with server.');
      }
    });
  });

  app.get('/prune', is_authenticated, (req, res) => {
    const command = JSON.stringify({
      token
    });
    const options = {
      url: `${scheme}${server}:${server_port}/prune`,
      rejectUnauthorized: ssl_self_signed,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': command.length
      },
      body: command
    };
    request(options, (error, response) => {
      // TODO: needs refactoring
      try {
        if (error) {
          res.end(error);
        } else {
          res.end(response.body);
        }
      } catch (error2) {
        res.end('\nAn error has occurred while cleaning Docker.');
      }
    });
  });

  app.get('/clear-functions', is_authenticated, (req, res) => {
    const options = {
      url: `${scheme}${server}:${server_port}/clear-functions?token=${token}`,
      rejectUnauthorized: ssl_self_signed
    };

    request(options, (error, response, body) => { // eslint-disable-line no-unused-vars
      if (!error && response.statusCode === 200) {
        res.end('Sent request to delete functions.');
      } else {
        res.end('\nError connecting with server.');
      }
    });
  });

  app.get('/function', is_authenticated, (req, res) => {
    const get_function = req.query.function;
    let get_args = req.query.container_args;

    //TODO: refator into a ternary
    if (req.query.container_args) {
      get_args = req.query.container_args;
    }

    const options = {
      url: scheme + server + ':' + server_port + '/function?token=' + token + '&function=' + get_function + '&container_args=' + get_args,
      rejectUnauthorized: ssl_self_signed
    };

    request(options, (error, response, body) => { // eslint-disable-line no-unused-vars
      if (!error && response.statusCode === 200) {
        res.end('');
      } else {
        console.log('\n' + error);
      }
    });
  });

  app.get('/hb', is_authenticated, (req, res) => {
    const options = {
      url: `${scheme}${server}:${server_port}/hb?token=${token}`,
      rejectUnauthorized: ssl_self_signed
    };

    request(options, (error, response) => {
      if (!error && response.statusCode === 200) {
        display_log(data => {
          res.end(data);
        });
      } else {
        res.end('\nError connecting with server.');
      }
    });
  });

  app.get('/log', is_authenticated, (req, res) => {
    const options = {
      url: `${scheme}${server}:${server_port}/log?token=${token}`,
      rejectUnauthorized: ssl_self_signed
    };

    request(options, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        res.end(body);
      } else {
        res.end('\nError connecting with server.');
      }
    });
  });

  app.get('/nodes', is_authenticated, (req, res) => {
    res.json(nodedata);
  });

  app.get('/getconfig', is_authenticated, (req, res) => {
    const options = {
      url: `${scheme}${server}:${server_port}/getconfig?token=${token}`,
      rejectUnauthorized: ssl_self_signed
    };

    request(options, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        res.end(body);
      } else {
        res.end('Error connecting with server. ' + error);
      }
    });
  });

};
