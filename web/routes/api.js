// Web Console backen API handles
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const request = require("request-promise");
const hostname = require("os").hostname();

// Require passport and libs
const lib = require("../lib/libpicluster");
const is_authenticated = require("../middleware/is_authenticated");
const has_jwt = require("../middleware/has_jwt");
const {
  err_catcher,
  //config_update,
  create_jwt,
  //generate_token,
  get_file_list_by_extention,
  //host_add,
  //host_remove,
  init,
  query_config,
  query_host,
  query_hosts,
  upgrade,
  //user_add
} = lib;
const upload = multer({
  dest: "../"
});

module.exports = (app) => {
  ////
  // Config API Handles
  ////

  //[ ] Return the results of /api/config backend API call
  // NOTE: Used for client-side jquery/ajax requests
  app.get("/api/config", is_authenticated, err_catcher(async (req, res) => {
    Promise.all([
      query_config(),
      query_host(hostname),
      create_jwt()
    ]).then((result) => {
      const {
        tls_self_signed,
        tls_enabled,
      } = result[0][0];
      const {
        address,
        master_port
      } = result[1][0];
      const token = result[2];
      const proto = tls_enabled ? "https://" : "http://";
      const master = `${proto}${address}:${master_port}`;
      const options = {
        url: `${master}/api/config/backend`,
        rejectUnauthorized: tls_self_signed,
        headers: {
          "x-access-token":  token
        }
      };

      request(options, (err, result) => {
        if (err) throw (err);
        res.send(result.body);
      });
    });
  }));

  //[ ] Get the json object of the config table
  app.get("/api/config/backend", has_jwt, err_catcher(async (req, res) => {
    await query_config().then(async (config) => await res.json(config));
  }));

  //[X] Web API handle to reset Config table
  app.get("/api/config/reset", is_authenticated, err_catcher(async (req, res) => {
    await init().then(res.redirect("/ops/config"));
  }));

  //[X] Web API handle to upgrade Config table
  app.get("/api/config/upgrade", is_authenticated, err_catcher(async (req, res) => {
    upgrade();
    await res.redirect("/ops/config");
  }));

  //////
  // Host API handles
  //////

  //[ ] Return array of all hosts in Host table
  app.get("/api/hosts/list", is_authenticated, err_catcher(async (req, res) => {
    return await query_hosts().then(async (results) => {
      res.send(await results);
    }).catch((err) => {
      throw err;
    });
  }));

  // TODO: Refactor to handle offline/non-existent hosts
  // NOTE: Function is an effective rewrite of the /nodes API handle
  //[ ] Function to request /api/host/info from server API on every host in db
  // Returns array of results containing aggregated host_info of all hosts
  app.get("/api/hosts/info", is_authenticated, err_catcher((req, res) => {
    Promise.all([
      query_config(),
      query_hosts(),
      create_jwt()
    ]).then(async (results) => {
      const {
        tls_enabled,
        tls_self_signed
      } = results[0][0];
      const hosts = results[1];
      const token = results[2];
      let requests = [];

      // Loop through all found hosts and push the request_promise into requests array
      for (let i in hosts) {
        const proto = tls_enabled ? "https://" : "http://";
        const target = proto + hosts[i].address + ":" + hosts[i].port;
        const options = {
          url: `${target}/api/host/info`,
          rejectUnauthorized: tls_self_signed,
          headers: {
            "x-access-token": token
          }
        };

        requests.push(request(options));
      }

      // Run all request_promises in the requests array and return an array of results
      await Promise.all(requests).then(async (results) => {
        return await res.json(results);
      }).catch((err) => {
        throw err;
      });
    }).catch((err) => {
      throw err;
    });
  }));

  // Handle POSTs to exec
  app.post("/exec", is_authenticated, (req, res) => {
    query_config().then((config) => {
      let {
        server_port,
        tls_self_signed,
        tls_enabled,
        master_address,
      } = config[0];

      const proto = tls_enabled ? "https://" : "http://";
      const server_host = proto + master_address + ":" + server_port;
      const {
        node
      } = req.body;

      const command = JSON.stringify({
        command: req.body.command,
        node
      });

      const options = {
        url: `${server_host}/exec`,
        rejectUnauthorized: tls_self_signed,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": command.length
        },
        body: command
      };

      request(options, (error, response) => {
        try {
          res.end(response.body);
        } catch (err) {
          res.end("\nAn error has occurred while retrieving the command.\n" + err);
        }
      });
    });
  });

  app.post("/changehost", is_authenticated, (req, res) => {
    query_config().then((config) => {
      let {
        server_port,
        tls_self_signed,
        tls_enabled,
        master_address,
      } = config[0];

      const proto = tls_enabled ? "https://" : "http://";
      const server_host = proto + master_address + ":" + server_port;
      const {
        newhost
      } = req.body;

      let container;

      if (req.body.container) {
        container = req.body.container;
        if (container.indexOf("Everything") > -1) {
          container = "";
        }
      }

      const options = {
        url: `${server_host}/changehost?token=${token}&container=${container}&newhost=${newhost}`,
        rejectUnauthorized: tls_self_signed
      };

      request(options, (error, response) => {
        if (!error && response.statusCode === 200) {
          lib.display_log(data => {
            res.end(data);
          });
        } else {
          res.end("\nError connecting with server.");
        }
      });
    });
  });

  app.post("/update-container", is_authenticated, (req, res) => {
    query_config().then((config) => {
      let {
        server_port,
        tls_self_signed,
        tls_enabled,
        master_address,
      } = config[0];

      const proto = tls_enabled ? "https://" : "http://";
      const server_host = proto + master_address + ":" + server_port;

      const {
        container,
        container_args,
        heartbeat_args,
        failover_constraints
      } = req.body;

      if (container) {
        const options = {
          url: `${server_host}/update-container?token=${token}&container=${container}&container_args=${container_args}&heartbeat_args=${heartbeat_args}&failover_constraints=${failover_constraints}`,
          rejectUnauthorized: tls_self_signed
        };

        request(options, (error, response) => {
          if (!error && response.statusCode === 200) {
            lib.display_log(data => {
              res.end(data);
            });
          } else {
            res.end("\nError connecting with server.");
          }
        });
      } else {
        res.end("\nError missing some parameters.");
      }
    });
  });

  app.post("/addcontainer", is_authenticated, (req, res) => {
    query_config().then((config) => {
      let {
        server_port,
        tls_self_signed,
        tls_enabled,
        master_address,
      } = config[0];

      const proto = tls_enabled ? "https://" : "http://";
      const server_host = proto + master_address + ":" + server_port;

      const {
        container,
        container_args,
        host,
        heartbeat_args,
        failover_constraints
      } = req.body;

      if (failover_constraints) {
        if (failover_constraints.indexOf("none") > -1) {
          failover_constraints = "";
        }
      }

      if ((container) && (container_args) && (host)) {
        const options = {
          url: `${server_host}/addcontainer?token=${token}&container=${container}&host=${host}&container_args=${container_args}&heartbeat_args=${heartbeat_args}&failover_constraints=${failover_constraints}`,
          rejectUnauthorized: tls_self_signed
        };

        request(options, (error, response) => {
          if (!error && response.statusCode === 200) {
            lib.display_log(data => {
              res.end(data);
            });
          } else {
            res.end("\nError connecting with server.");
          }
        });
      } else {
        res.end("\nError missing some parameters.");
      }
    });
  });

  // WHOA! WTF!!! upload a file to a given filepath without sanitization?
  // TODO: refactor to handle proper file sharing between users, master and slaves
  app.post("/upload", is_authenticated, upload.single("file"), (req, res) => {
    fs.readFile(req.file.path, (err, data) => {
      if (err) {
        console.log("\nReadFile Error:" + err);
      }
      const newPath = path.join("../", req.file.originalname);
      fs.writeFile(newPath, data, () => {
        lib.sendFile(newPath, req.file.path);
        res.end("");
      });
    });
  });

  app.post("/image/manage", is_authenticated, (req, res) => {
    query_config().then((config) => {
      let {
        server_port,
        tls_self_signed,
        tls_enabled,
        master_address,
      } = config[0];

      const proto = tls_enabled ? "https://" : "http://";
      const server_host = proto + master_address + ":" + server_port;
      const {
        no_cache,
        operation
      } = req.body;
      let container;

      if (req.body.container) {
        container = req.body.container;
        if (container.indexOf("Everything") > -1) {
          container = "";
        }
      }

      const options = {
        url: `${server_host}/image/manage?token=${token}&container=${container}&operation=${operation}&no_cache=${no_cache}`,
        rejectUnauthorized: tls_self_signed
      };

      request(options, (error, response) => {
        try {
          res.end(response.body);
        } catch (err) {
          res.end("\nAn error has occurred while trying to manage the container(s).\n" + err);
        }
      });
    });
  });

  // Handle POSTs to elasticsearch
  app.post("/elasticsearch", is_authenticated, (req, res) => {
    query_config().then((config) => {
      let {
        server_port,
        tls_self_signed,
        tls_enabled,
        master_address,
      } = config[0];

      const proto = tls_enabled ? "https://" : "http://";
      const server_host = proto + master_address + ":" + server_port;
      const {
        mode,
        elasticsearch_url
      } = req.body;
      const command = JSON.stringify({
        command: req.body.command,
        elasticsearch_url,
        mode
      });

      const options = {
        url: `${server_host}/elasticsearch`,
        rejectUnauthorized: tls_self_signed,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": command.length,
          "x-access-token": create_jwt()
        },
        body: command
      };

      request(options, error => {
        if (error) res.end(error);

        lib.display_log(data => {
          res.end(data);
        });
      });
    });
  });

  // Handle POSTs to list commands
  app.post("/listcommands", (req, res) => {
    query_config().then((config) => {
      let {
        server_port,
        tls_self_signed,
        tls_enabled,
        master_address,
      } = config[0];

      const proto = tls_enabled ? "https://" : "http://";
      const server_host = proto + master_address + ":" + server_port;
      const options = {
        url: `${server_host}/listcommands`,
        rejectUnauthorized: tls_self_signed,
        headers: {
          "x-access-token": create_jwt()
        }
      };

      request(options, (error, response, body) => {
        if (error) res.end(error);

        res.end(body);
      });
    });
  });

  // Return user object from sent request
  app.get("/api/user/info", is_authenticated, err_catcher(async (req, res) => {
    res.json(req.user);
  }));

  // List registries from docker hub
  app.get("/listregistries", is_authenticated, (req, res) => {
    query_config().then((config) => {
      let {
        docker_registries
      } = config[0];

      // Registries to pull from
      const registries = [{
        name: "hub.docker.com"
      }];

      // TODO: Add field in Config table and default value
      if (docker_registries && docker_registries.length > 0) {
        docker_registries.forEach(registry => {
          registries.push({
            name: registry
          });
        });
      }

      // Respond with json formatted registry list
      res.json(registries);
    });
  });

  // Handle remote image tags from docker hub
  app.get("/remoteimagetags", is_authenticated, (req, res) => {
    const {
      registry,
      image,
      page,
      username,
      password
    } = req.query;
    let endpoint;

    if (!registry || !image) {
      return res.status(400).end("\nError: Invalid Credentials");
    }

    switch (registry) {
    case "hub.docker.com":
      endpoint = "https://hub.docker.com/v2/repositories/" + ((image.indexOf("/") === -1) ? ("library/" + image) : image) + "/tags/?page=" + page + "&page_size=500";
      break;
    default:
      // Custom registries
      endpoint = ((registry.startsWith("http://") || registry.startsWith("https://")) ? registry : "https://" + registry) + "/v2/" + image + "/tags/list";
      break;
    }

    const options = {
      url: endpoint,
      headers: ((username && password)) ? {
        Authorization: "Basic " + Buffer.from(`${username}:${password}`).toString("base64")
      } : {}
    };

    request(options, (error, response, body) => {
      if (!error && response.statusCode !== 200) {
        error = body;
      }

      // TODO: This could be refactored more efficiently
      res.status(response.statusCode).end((error) ? JSON.stringify({
        error: error.toString()
      }) : body);
    });
  });

  // List remote images from docker hub
  app.get("/remoteimages", is_authenticated, (req, res) => {
    const {
      image,
      page,
      registry,
      username,
      password
    } = req.query;

    if (!registry || !image) {
      return res.status(400).end("\nError: Bad Request");
    }

    let endpoint;
    switch (registry) {
      case "hub.docker.com":
        endpoint = "https://hub.docker.com/v2/search/repositories/?page=" + page + "&query=" + image;
        break;
      default:
        // Custom registries
        endpoint = ((registry.startsWith("http://") || registry.startsWith("https://")) ? registry : "https://" + registry) + "/v2/_catalog";
        break;
    }

    const options = {
      url: endpoint,
      headers: ((username && password)) ? {
        Authorization: "Basic " + Buffer.from(`${username}:${password}`).toString("base64")
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

  app.get("/syslog", is_authenticated, (req, res) => {
    query_config().then((config) => {
      let {
        server_port,
        tls_self_signed,
        tls_enabled,
        master_address,
      } = config[0];

      const proto = tls_enabled ? "https://" : "http://";
      const server_host = proto + master_address + ":" + server_port;

      const command = JSON.stringify({
        token
      });

      const options = {
        url: `${server_host}/syslog`,
        rejectUnauthorized: tls_self_signed,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": command.length
        },
        body: command
      };

      request(options, (error, response) => {
        try {
          res.end(response.body);
        } catch (err) {
          res.end("\nAn error has occurred while retrieving the Syslog.\n" + err);
        }
      });
    });
  });

  app.get("/rsyslog", is_authenticated, (req, res) => {
    query_config().then((config) => {
      let {
        server_port,
        tls_self_signed,
        tls_enabled,
        master_address,
      } = config[0];

      const proto = tls_enabled ? "https://" : "http://";
      const server_host = proto + master_address + ":" + server_port;

      const options = {
        url: `${server_host}/rsyslog?token=${token}`,
        rejectUnauthorized: tls_self_signed
      };

      request(options, (error, response, body) => {
        if (!error && response.statusCode === 200) {
          res.end(body);
        } else {
          res.end("\nError connecting with server.");
        }
      });
    });
  });

  app.get("/prune", is_authenticated, (req, res) => {
    query_config().then((config) => {
      let {
        server_port,
        tls_self_signed,
        tls_enabled,
        master_address,
      } = config[0];

      const proto = tls_enabled ? "https://" : "http://";
      const server_host = proto + master_address + ":" + server_port;

      const command = JSON.stringify({
        token
      });
      const options = {
        url: `${server_host}/prune`,
        rejectUnauthorized: tls_self_signed,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": command.length
        },
        body: command
      };
      request(options, (error, response) => {
        // TODO: needs refactoring
        try {
          res.end(response.body);
        } catch (err) {
          res.end("\nAn error has occurred while cleaning Docker.\n" + err);
        }
      });
    });
  });

  app.get("/clear-functions", is_authenticated, (req, res) => {
    query_config().then((config) => {
      let {
        server_port,
        tls_self_signed,
        tls_enabled,
        master_address,
      } = config[0];

      const proto = tls_enabled ? "https://" : "http://";
      const server_host = proto + master_address + ":" + server_port;

      const options = {
        url: `${server_host}/clear-functions?token=${token}`,
        rejectUnauthorized: tls_self_signed
      };

      request(options, (error, response, body) => { // eslint-disable-line no-unused-vars
        if (!error && response.statusCode === 200) {
          res.end("Sent request to delete functions.");
        } else {
          res.end("\nError connecting with server.");
        }
      });
    });
  });

  app.get("/function", is_authenticated, (req, res) => {
    query_config().then((config) => {
      let {
        server_port,
        tls_self_signed,
        tls_enabled,
        master_address,
      } = config[0];

      const proto = tls_enabled ? "https://" : "http://";
      const server_host = proto + master_address + ":" + server_port;

      const get_function = req.query.function;
      let get_args = req.query.container_args;

      //TODO: refactor into a ternary
      if (req.query.container_args) {
        get_args = req.query.container_args;
      }

      const options = {
        // TODO: needs refactoring
        url: server_host + "/function?token=" + token + "&function=" + get_function + "&container_args=" + get_args,
        rejectUnauthorized: tls_self_signed
      };

      request(options, (error, response, body) => { // eslint-disable-line no-unused-vars
        if (!error && response.statusCode === 200) {
          res.end("");
        } else {
          console.log("\n" + error);
        }
      });
    });
  });

  app.get("/heartbeat", is_authenticated, (req, res) => {
    query_config().then((config) => {
      let {
        server_port,
        tls_self_signed,
        tls_enabled,
        master_address,
      } = config[0];

      const proto = tls_enabled ? "https://" : "http://";
      const server_host = proto + master_address + ":" + server_port;

      const options = {
        url: `${server_host}/heartbeat?token=${token}`,
        rejectUnauthorized: tls_self_signed
      };

      request(options, (error, response) => {
        if (!error && response.statusCode === 200) {
          lib.display_log(data => {
            res.end(data);
          });
        } else {
          res.end("\nError connecting with server.");
        }
      });
    });
  });

  app.get("/log", is_authenticated, (req, res) => {
    query_config().then((config) => {
      let {
        server_port,
        tls_self_signed,
        tls_enabled,
        master_address,
      } = config[0];

      const proto = tls_enabled ? "https://" : "http://";
      const server_host = proto + master_address + ":" + server_port;

      const options = {
        url: `${server_host}/log?token=${token}`,
        rejectUnauthorized: tls_self_signed
      };

      request(options, (error, response, body) => {
        if (!error && response.statusCode === 200) {
          res.end(body);
        } else {
          res.end("\nError connecting with server.");
        }
      });
    });
  });

  //////
  // Misc API Handles
  //////

  //[X] Return object containing navmenu structure
  app.get("/api/links", err_catcher(async (req, res) => {
    const links_group = {
      "hosts": ["manage", "swarm"],
      "containers": ["manage"],
      "images": ["manage"],
      "functions": ["create", "remove", "viewer"],
      "ops": ["config", "command", "heartbeat", "clean", "terminal", "elasticsearch"],
      "logs": ["syslog", "rsyslog"],
      "user": ["logout"]
    };

    res.json(await links_group);
  }));

  // Handle sending list of .md files in docs
  app.get("/api/docs/list", (req, res) => {
    query_config().then((config) => {
      res.json(get_file_list_by_extention(path.join(__dirname, config[0].doc_dir.toString()), ".md"));
    });
  });
};
