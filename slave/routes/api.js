// API calls stored here. Broken down into 2 sections: GET and POST
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const request = require("request");
const async = require("async");
const { exec } = require("child-process-promise");
const query_string = require("query-string");

// Require configured passport and libs
const lib = require("../lib/libpicluster");
const has_jwt = require("../middleware/has_jwt");
const {
  host_info,
  host_update,
  runner
} = lib;

// Specify upload destination path
const upload = multer({
  dest: "../"
});

let nodedata = "";

module.exports = (app) => {
  //////
  // Host server API
  ////

  // Return individual host_info json object
  app.get("/api/host/info", (req, res) => {
    host_info().then((result) => {
      res.json(result);
    });
  });

  // TODO: No swarm join handler?
  // TODO: No swarm network remove?
  //[ ] Server API handle to initialize a docker swarm on current host
  app.post("/api/host/swarm", has_jwt, (req, res) => {
    const {
      network_name,
      operation
    } = req.body;

    switch(operation) {
    case "create":
      runner("swarm_create").then(async (result) => {
        // TODO: Update swarm token and set is_swarm_master bit for current host
        let swarm_token = await result.stdout.split("--token")[1].split(" ")[1];
        console.log("swarm_token: " + swarm_token);

        res.json(result);
      }).catch((err) => {
        res.json(err);
      });
      break;
    case "leave":
      runner("swarm_leave").then(async (result) => {
        // TODO: Remove swarm token and unset is_swarm_master bit for current host

        res.json(await result);
      }).catch((err) => {
        res.json(err);
      });
      break;
    case "network":
      runner("swarm_network", { network: network_name }).then(async (result) => {
      // TODO: Remove swarm token and unset is_swarm_master bit for current host

        res.json(await result);
      }).catch((err) => {
        res.json(err);
      });
      break;
    default:
      console.error(`Unknown operation "${operation}" sent to /api/host/swarm`);
    }
  });

  //////
  // Container server API
  ////

  // Return output array of all containers on a given host(?)
  app.post("/listcontainers", has_jwt, (req, res) => {
    let {
      node
    } = req.body;
    const output = [];
    let container;

    for (let i = 0; i < config.layout.length; i++) {
      for (const key in config.layout[i]) {
        if (config.layout[i].hasOwnProperty(key)) {
          container = key;
          node = config.layout[i].node;
          const check_port = config.layout[i][key];
          if (check_port !== node) {
            output.push(container);
          }
        }
      }
    }
    res.send(output);
  });

  // TODO: ughh... enough of this random spaghetti code
  app.post("/api/container/manage", has_jwt, (req, res) => {
    const {
      container_name,
      container_image,
      operation
    } = req.body;
    let args = {};

    switch(operation) {
    case "add":
      args = {
        container_name: container_name,
        container_image: container_image
      };

      runner("container_add", args).then(async (result) => {
        res.json(await result);
      }).catch((err) => {
        res.json(err);
      });
      break;
    default:
      res.json({
        err: `Unknown operation "${operation}" sent to /api/container/manage. args: ${args}`
      });
    }
    /*
    let docker_command = "";
    let command_log = "";
    let container = "";
    const url = [];
    const what = [];
    const args = [];

    if (operation === "start") {
      docker_command = "docker container start";
    }
    if (operation === "stop") {
      docker_command = "docker container stop";
    }
    if (operation === "rm") {
      docker_command = "docker container rm -f";
    }
    if (operation === "restart") {
      docker_command = "docker container restart";
    }
    if (operation === "logs") {
      docker_command = "docker container logs";
    }
    if (operation === "create") {
      docker_command = "docker container run -d --name ";
    }

    if (req.query.container) {
      container = req.query.container;
    }

    if (container.indexOf("*") > -1 || container.length === 0) {
      container = "*";
    }

    Object.keys(config.layout).forEach((get_node, i) => {
      Object.keys(config.layout[i]).forEach(key => {
        const {
          node
        } = config.layout[i];

        if ((!config.layout[i].hasOwnProperty(key) || key.indexOf("node") > -1)) {
          return;
        }
        const make_url = `${proto}${node}:${server_port}/run`;
        if (container.indexOf("*") > -1 || container.indexOf(key) > -1) {
          what.push(key);
          url.push(make_url);
          args.push(config.layout[i][key]);
        }
      });
    });

    let i = 0;

    // Run each url request?
    async.eachSeries(url, (url, cb) => {
      let command;
      if (operation === "create") {
        command = JSON.stringify({
          command: docker_command + what[i] + " " + args[i] + " " + what[i],
          token
        });
      } else {
        command = JSON.stringify({
          command: docker_command + " " + what[i],
          token
        });
      }

      const options = {
        url,
        rejectUnauthorized: ssl_self_signed,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": command.length
        },
        body: command
      };

      request(options, (err, body) => {
        try {
          const data = JSON.parse(body.body);
          command_log += "Node: " + data.node + "\n\n" + data.output + "\n\n";
          cb(err);
        } catch (error) {
          console.log(error);
        }
      });
      i++;
    }, err => {
      if (err) {
        console.log("\nError: " + err);
      }
      res.end(command_log);
    });
    */
  });

  app.get("/addcontainer", has_jwt, (req, res) => {
    let {
      container,
      container_args,
      host,
      heartbeat_args,
      failover_constraints
    } = req.query;

    if (host.indexOf("*") > -1) {
      const min = 0;
      const max = total_nodes - 1;
      const number = Math.floor(Math.random() * (max - min + 1)) + min;
      host = config.layout[number].node;
    }

    // Ensures that the host exists
    let proceed = 0;
    for (let i = 0; i < config.layout.length; i++) {
      if (config.layout[i].node.indexOf(host) > -1) {
        proceed++;
      }
    }

    if (proceed < 1) {
      res.end("\nError: Node does not exist!");
    } else {
      // Add Data to New Host
      for (let i = 0; i < config.layout.length; i++) {
        if (config.layout[i].node.indexOf(host) > -1) {
          config.layout[i][container] = container_args;
        }
      }

      // Adds Heartbeat Data
      if (config.hb) {
        if (heartbeat_args) {
          for (let i = 0; i < config.hb.length; i++) {
            if (config.hb[i].node.indexOf(host) > -1) {
              config.hb[i][container] = heartbeat_args;
            }
          }
        }
      }

      if (config.container_host_constraints) {
        if (failover_constraints) {
          config.container_host_constraints.push({
            container: failover_constraints
          });
        }
      }

      const new_config = JSON.stringify({
        payload: JSON.stringify(config),
        token
      });

      const options = {
        url: `${proto}${server}:${server_port}/updateconfig`,
        rejectUnauthorized: ssl_self_signed,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": new_config.length
        },
        body: new_config
      };

      const container_options = {
        url: `${proto}${server}:${server_port}/changehost?token=${token}&container=${container}&newhost=${host}`,
        rejectUnauthorized: ssl_self_signed
      };

      request(options, error => {
        if (error) {
          res.end(error);
        } else {
          request(container_options, (error, response) => {
            if (!error && response.statusCode === 200) {
              res.end("\nAdded " + container + " to the configuration.");
            } else {
              res.end("\nError connecting with server.");
            }
          });
        }
      });
    }
  });

  app.get("/update-container", has_jwt, (req, res) => {
    const {
      container,
      container_args,
      heartbeat_args,
      failover_constraints
    } = req.query;

    if (container_args) {
      Object.keys(config.layout).forEach((get_node, i) => {
        Object.keys(config.layout[i]).forEach(key => {
          if (key.indexOf(container) > -1) {
            config.layout[i][key] = container_args;
          }
        });
      });
    }

    if (failover_constraints) {
      let proceed = 0;

      Object.keys(config.container_host_constraints).forEach((get_node, i) => {
        Object.keys(config.container_host_constraints[i]).forEach(key => {
          const get_container_name = failover_constraints.split(",");
          const parse_container = get_container_name[0];

          if (config.container_host_constraints[i][key].indexOf(parse_container) > -1) {
            if (failover_constraints.indexOf("none") > -1) {
              proceed = 0;
            } else {
              proceed = 1;
              config.container_host_constraints[i][key] = failover_constraints;
            }
          }
        });
      });

      if (proceed === 0) {
        if (failover_constraints.indexOf("none") > -1) {
          for (let i = 0; i < config.container_host_constraints.length; i++) {
            for (const key in config.container_host_constraints[i]) {
              if (container.length > 0) {
                const analyze = config.container_host_constraints[i][key].split(",");
                if (container.indexOf(analyze[0]) > -1) {
                  config.container_host_constraints.splice(i, i + 1);
                }
              }
            }
          }
        } else {
          config.container_host_constraints.push({
            container: failover_constraints
          });
        }
      }
    }

    if (heartbeat_args) {
      let proceed = 0;
      Object.keys(config.hb).forEach((get_node, i) => {
        Object.keys(config.hb[i]).forEach(key => {
          if (key.indexOf(container) > -1) {
            if (heartbeat_args.indexOf("delete") > -1) {
              delete config.hb[i][key];
              proceed = 1;
            } else {
              config.hb[i][key] = heartbeat_args;
              proceed = 1;
            }
          }
        });
      });

      if (proceed === 0) {
        let node = "";
        Object.keys(config.layout).forEach((get_node, i) => {
          Object.keys(config.layout[i]).forEach(key => {
            if (key.indexOf(container) > -1) {
              node = config.layout[i].node;
            }
          });
        });

        for (let i = 0; i < config.hb.length; i++) {
          if (config.hb[i].node.indexOf(node) > -1 && heartbeat_args.indexOf("delete") === -1) {
            config.hb[i][container] = heartbeat_args;
          }
        }
      }
    }

    const new_config = JSON.stringify({
      payload: JSON.stringify(config),
      token
    });

    const options = {
      url: `${proto}${server}:${server_port}/updateconfig`,
      rejectUnauthorized: ssl_self_signed,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": new_config.length
      },
      body: new_config
    };

    request(options, error => {
      if (error) {
        res.end(error);
      } else {
        res.end("\nModified Container Arguments for " + container);
      }
    });
  });

  // Move container to another host?
  // NOTE: wtf? /changehost acts as add_host stub?
  app.get("/changehost", has_jwt, (req, res) => {
    let container = "";
    let original_host = "";
    let original_container_data = "";
    let original_heartbeat_data = "";
    const new_host = req.query.newhost;

    if (req.query.container) {
      container = req.query.container;
    }

    // Ensures that the host exists
    let proceed = 0;
    for (let i = 0; i < config.layout.length; i++) {
      for (const key in config.layout[i]) {
        if (container.length > 0) {
          if (config.layout[i].node.indexOf(new_host) > -1) {
            proceed++;
          }
          if (key.indexOf(container) > -1) {
            if (key.indexOf(config.layout[i].node)) {
              proceed++;
            }
          }
        }
      }
    }

    // Find Current Host
    if (proceed < 2) {
      res.end("\nError: Node or Container does not exist!");
    } else {
      for (let i = 0; i < config.layout.length; i++) {
        for (const key in config.layout[i]) {
          if (container.length > 0) {
            if (key.indexOf(container) > -1) {
              original_host = config.layout[i].node;
              original_container_data = config.layout[i][key];
              delete config.layout[i][key];
            }
          }
        }
      }

      // Checks for HB
      if (config.hb) {
        for (let i = 0; i < config.hb.length; i++) {
          for (const key in config.hb[i]) {
            if (container.length > 0) {
              if (key.indexOf(container) > -1) {
                original_heartbeat_data = config.hb[i][key];
                delete config.hb[i][key];
              }
            }
          }
        }
      }

      for (let i = 0; i < config.layout.length; i++) {
        if (config.layout[i].node.indexOf(new_host) > -1) {
          config.layout[i][container] = original_container_data;
        }
      }

      // Adds Heartbeat Data
      if (config.hb) {
        if (original_heartbeat_data) {
          for (let i = 0; i < config.hb.length; i++) {
            if (config.hb[i].node.indexOf(new_host) > -1) {
              config.hb[i][container] = original_heartbeat_data;
            }
          }
        }
      }

      const new_config = JSON.stringify({
        payload: JSON.stringify(config),
        token
      });

      const options = {
        url: `${proto}${server}:${server_port}/updateconfig`,
        rejectUnauthorized: ssl_self_signed,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": new_config.length
        },
        body: new_config
      };

      request(options, error => {
        if (error) {
          res.end(error);
        } else {
          lib.migrate(container, original_host, new_host, original_container_data);
          res.end("\nMigration may take awhile. Please observe the logs and running containers for the latest information.");
        }
      });
    }
  });

  //////

  app.post("/pong", has_jwt, (req, res) => {
    let vip_status = "false";
    const interfaces = require("os").networkInterfaces();

    Object.keys(interfaces).forEach(devName => {
      const iface = interfaces[devName];
      iface.forEach(alias => {
        if (alias.address === vip) {
          vip_status = "true";
        }
      });
    });

    const body = {
      vip_detected: vip_status
    };
    res.send(body);
  });

  app.post("/receive-file", has_jwt, upload.single("file"), (req, res) => {
    const get_config_file = req.body.config_file;

    fs.readFile(req.file.path, (err, data) => {
      if (err) console.error("\nError reading file: " + err);

      let newPath = "../" + req.file.originalname;
      let config_file = "";

      if (get_config_file) {
        if (process.env.PICLUSTER_CONFIG) {
          config_file = process.env.PICLUSTER_CONFIG;
        } else {
          config_file = "../config.json";
        }
        newPath = config_file;
      }
      setTimeout(() => {
        fs.writeFile(newPath, data, err => {
          if (!err) {
            if (get_config_file) {
              lib.reloadConfig();
            }

            if (req.file.originalname.indexOf(".zip") > -1) {
              lib.unzipFile(newPath);
            }

            fs.unlink(req.file.path, error => {
              if (error) {
                console.log(error);
              }
            });
          }
        });
      }, 5000);
    });
    res.end("Done");

  });

  //[ ] Run arbitrary command (suuuuure... totally safe. RIGHT???)
  app.post("/run", has_jwt, (req, res) => {
    // OMF reeeaall nice. An array key with the same name as the object that holds it.
    const output = {
      output: [],
      node
    };

    // Backwards compatability... (For what and why???)((OH! multiple commands stored in an array))
    if (!("commands" in req.body) && "command" in req.body) {
      req.body.commands = req.body.command;
    }

    // Store string commands as array
    const commands = (typeof req.body.commands === "string") ? [req.body.commands] : req.body.commands;

    // Return "Bad Request" if commands are anything other than an array
    if (!(Array.isArray(commands))) {
      return res.status(400).json({
        output: "Bad Request"
      });
    }

    // Run all commands in array
    async.eachSeries(commands, (command, callback) => {
      // NOTE: wtf? didn't we just sanitize this in the scope above???
      // Store command as array if stored as string
      if (typeof command === "string") {
        command = [command];
      }

      // NOTE: redundant checks are redundant... but why?
      // Return if command is not stored as an array
      if (!(Array.isArray(command))) {
        return;
      }

      // Console.log("command", command);

      // Join the command array and execute
      exec(command.join(" "), { cwd: __dirname }).then((log) => {
        // Console.log("output", log);
        output.output.push(`${log.stdout || ""}${log.stderr || ""}`);
        return callback();
      }).catch(error => {
        // Console.log("error", err);
        output.output.push(`${error.stdout || ""}${error.stderr || ""}`);
        return callback(error);
      });
    });
    res.json(output);
  });

  app.post("/function", has_jwt, (req, res) => {
    const check_token = req.body.token;
    const {
      output
    } = req.body;
    const {
      uuid
    } = req.body;

    Object.keys(functions.name).forEach((get_name, i) => {
      if (functions.name[i].uuid.toString().indexOf(uuid.toString()) > -1) {
        functions.name[i].output = output;
        lib.delete_function(functions.name[i].name, functions.name[i].host);
        res.end("");
      }
    });
  });

  app.post("/receive-file", has_jwt, upload.single("file"), (req, res) => {
    fs.readFile(req.file.path, (err, data) => {
      if (data) {
        const newPath = "../" + req.file.originalname;
        fs.writeFile(newPath, data, err => {
          if (err) {
            console.log(err);
          } else {
            lib.copyToAgents(newPath, "", req.file.path);
          }
        });
      }
    });
    res.end("");
  });

  app.post("/listcommands", has_jwt, (req, res) => {
    if (config.commandlist) {
      res.end(JSON.stringify(config.commandlist));
    } else {
      res.end("");
    }
  });

  app.post("/exec", has_jwt, (req, res) => {
    let selected_node = "";
    let command_log = "";
    const url = [];

    if (req.body.node) {
      selected_node = req.body.node;
    }

    if (selected_node.indexOf("*") > -1) {
      selected_node = "";
    }

    const command = JSON.stringify({
      command: req.body.command,
      token
    });

    for (let i = 0; i < config.layout.length; i++) {
      const {
        node
      } = config.layout[i];
      const make_url = `${proto}${node}:${server_port}/run`;

      if (selected_node.length > -1 && selected_node.indexOf(node) > -1) {
        url.push(make_url);
      }

      if (selected_node.length === 0) {
        url.push(make_url);
      }
    }

    async.eachSeries(url, (url, cb) => {
      const options = {
        url,
        rejectUnauthorized: ssl_self_signed,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": command.length
        },
        body: command
      };

      request(options, (err, body) => {
        try {
          const data = JSON.parse(body.body);
          command_log += "Node: " + data.node + "\n\n" + data.output + "\n\n";
          cb(err);
        } catch (error) {
          console.log(error);
        }
      });
    }, err => {
      if (err) {
        console.log("\nError: " + err);
      }
      res.end(command_log);
    });
  });

  app.post("/syslog", has_jwt, (req, res) => {
    let complete_syslog = "";
    const url = [];

    for (let i = 0; i < config.layout.length; i++) {
      const {
        node
      } = config.layout[i];

      const make_url = `${proto}${node}:${server_port}/run`;
      url.push(make_url);
    }

    const command = JSON.stringify({
      command: config.syslog,
      token
    });

    async.eachSeries(url, (url, cb) => {
      const options = {
        url,
        rejectUnauthorized: ssl_self_signed,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": command.length
        },
        body: command
      };

      request(options, (err, body) => {
        try {
          const data = JSON.parse(body.body);
          complete_syslog += "Node: " + data.node + "\n\n" + data.output + "\n\n";
          cb(err);
        } catch (error) {
          console.log(error);
        }
      });
    }, err => {
      if (err) {
        console.log("\nError: " + err);
      }
      res.end(complete_syslog);
    });
  });

  app.post("/prune", has_jwt, (req, res) => {
    const url = [];
    let command_log = "";

    const command = JSON.stringify({
      command: "docker system prune -a -f",
      token
    });

    for (let i = 0; i < config.layout.length; i++) {
      const {
        node
      } = config.layout[i];
      const make_url = `${proto}${node}:${server_port}/run`;
      url.push(make_url);
    }

    async.eachSeries(url, (url, cb) => {
      const options = {
        url,
        rejectUnauthorized: ssl_self_signed,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": command.length
        },
        body: command
      };

      request(options, (err, body) => {
        try {
          const data = JSON.parse(body.body);
          command_log += "Node: " + data.node + "\n\n" + data.output + "\n\n";
          cb(err);
        } catch (error) {
          console.log(error);
        }
      });
    }, err => {
      if (err) {
        console.log("\nError: " + err);
      }
      res.end(command_log);
    });
  });

  app.post("/elasticsearch", has_jwt, (req, res) => {
    const elasticsearch = req.body.elasticsearch_url;
    const {
      mode
    } = req.body;

    if (mode === "add") {
      if (config.elasticsearch) {
        console.log("\nError, Elasticsearch is already configured.");
      } else {
        config.elasticsearch = elasticsearch;
        console.log("\nAdded Elasticsearch configuration for: " + elasticsearch);
      }
    }
    if (mode === "kibana") {
      if (config.kibana) {
        console.log("\nError, Kibana is already configured.");
      } else {
        config.kibana = elasticsearch;
        console.log("\nAdded Kibana configuration for: " + elasticsearch);
      }
    }
    if (mode === "delete") {
      if (config.kibana) {
        console.log("\nDeleted Kibana configuration.");
        delete config.kibana;
      }
      if (config.elasticsearch) {
        delete config.elasticsearch;
        console.log("\nDeleted Elasticsearch configuration.");
      }
    }
    const new_config = JSON.stringify({
      payload: JSON.stringify(config),
      token
    });

    const options = {
      url: `${proto}${server}:${server_port}/updateconfig`,
      rejectUnauthorized: ssl_self_signed,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": new_config.length
      },
      body: new_config
    };

    request(options, error => {
      if (error) {
        res.end("An error occurred: " + error);
      } else {
        res.end();
        console.log("\nUpdated Elasticsearch configuration.");
      }
    });
  });

  app.get("/clear-functions", has_jwt, (req, res) => {
    Object.keys(functions.name).forEach((get_name, i) => {
      lib.delete_function(functions.name[i].name, functions.name[i].host);
      lib.remove_function_data(functions.name[i].uuid);
    });
    res.end("Sent request to remove stale functions.");
  });

  app.get("/rsyslog", has_jwt, (req, res) => {
    // TODO: rsyslog_logfile not specified anywhere. wtf?
    res.sendFile(config.rsyslog_logfile);
  });

  app.get("/function", has_jwt, (req, res) => {
    const name = req.query.function;
    const min = 1;
    const max = 9999999;
    const uuid = Math.floor(Math.random() * (max - min + 1)) + min;
    const min_node = 0;
    const max_node = total_nodes - 1;
    const node_number = Math.floor(Math.random() * (max_node - min_node + 1)) + min_node;
    const host = config.layout[node_number].node;
    const {
      container_args
    } = req.query;

    const function_data = {
      uuid,
      name: name + "-" + uuid,
      output: "",
      host
    };

    functions.name.push(function_data);
    lib.create_function(name + "-" + uuid, uuid, host, container_args);
    res.end(proto + server + ":" + server_port + "/getfunction?token=" + token + "&uuid=" + uuid);
  });

  app.get("/getfunction", has_jwt, (req, res) => {
    const {
      uuid
    } = req.query;
    let output = "";

    Object.keys(functions.name).forEach((get_name, i) => {
      if ((functions.name[i].uuid.toString().indexOf(uuid.toString()) > -1 && functions.name[i].output.length > 1)) {
        output = functions.name[i].output;
        lib.remove_function_data(uuid);
      }
    });
    res.end(output);
  });

  app.get("/clearlog", has_jwt, (req, res) => {
    log = "";
    res.end();
  });

  // TODO: Refactor into a better API call
  app.get("/", has_jwt, (req, res) => {
    res.end("PiCluster Server v" + picluster_release);
  });

  app.get("/image/manage", has_jwt, (req, res) => {
    const {
      operation
    } = req.query;
    let docker_command = "";
    let container = "";
    let command_log = "";
    const url = [];
    const what = [];
    const {
      no_cache
    } = req.query;

    if (req.query.container) {
      container = req.query.container;
    }

    if (container.indexOf("*") > -1 || container.length === 0) {
      container = "*";
    }

    Object.keys(config.layout).forEach((get_node, i) => {
      Object.keys(config.layout[i]).forEach(key => {
        const {
          node
        } = config.layout[i];

        if ((!config.layout[i].hasOwnProperty(key) || key.indexOf("node") > -1)) {
          return;
        }
        const make_url = `${proto}${node}:${server_port}/run`;
        if (container.indexOf("*") > -1 || container.indexOf(key) > -1) {
          what.push(key);
          url.push(make_url);
        }
      });
    });

    let i = 0;

    async.eachSeries(url, (url, cb) => {
      if (operation === "rm") {
        docker_command = "docker image rm " + what[i];
      }

      if (operation === "build" && no_cache === "1") {
        docker_command = "docker image build --no-cache " + dockerFolder + "/" + what[i] + " -t " + what[i] + " -f " + dockerFolder + "/" + what[i] + "/Dockerfile";
      }

      if (operation === "build" && no_cache === "0") {
        docker_command = "docker image build " + dockerFolder + "/" + what[i] + " -t " + what[i] + " -f " + dockerFolder + "/" + what[i] + "/Dockerfile";
      }

      const command = JSON.stringify({
        command: docker_command,
        token
      });

      const options = {
        url,
        rejectUnauthorized: ssl_self_signed,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": command.length
        },
        body: command
      };

      request(options, (err, body) => {
        try {
          const data = JSON.parse(body.body);
          command_log += "Node: " + data.node + "\n\n" + data.output + "\n\n";
          cb(err);
        } catch (error) {
          console.log(error);
        }
      });
      i++;
    }, err => {
      if (err) {
        console.log("\nError: " + err);
      }
      res.end(command_log);
    });
  });

  app.get("/clear-elasticsearch", has_jwt, (req, res) => {
    const message = {
      query: {
        match_all: {}
      }
    };

    const options = {
      url: config.elasticsearch + "/picluster-logging",
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": message.length
      },
      body: JSON.stringify(message)
    };

    request(options, (error, response, body) => {
      if (error) {
        res.end(error);
        console.log(error);
      } else {
        res.end("\nCleared Elasticsearch data");
        console.log("\nCleared Elasticsearch data:" + body);
      }
    });
  });

  // This API handle is cryptic and needs changing
  app.get("/heartbeat", has_jwt, (req, res) => {
    let node = "";
    let check_port = "";
    let container = "";

    for (let i = 0; i < config.hb.length; i++) {
      for (const key in config.hb[i]) {
        if (config.hb[i].hasOwnProperty(key)) {
          container = key;
          node = config.hb[i].node;
          check_port = config.hb[i][key];

          if (check_port !== node) {
            lib.heartbeat_check(node, check_port, container);
          }
        }
      }
    }
    res.end("");
  });

  app.get("/log", has_jwt, (req, res) => {
    if (config.elasticsearch) {
      lib.elasticsearch(log);
    }
    res.send(log);
  });

  app.get("/rsyslog", has_jwt, (req, res) => {
    const options = {
      url: `${proto}${rsyslog_host}:${server_port}/rsyslog?token=${token}`,
      rejectUnauthorized: ssl_self_signed
    };

    request(options, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        res.end(body);
      } else {
        res.end("Error connecting with server. " + error);
      }
    });
  });
};
