// Functions used server API
const http = require("http");
const https = require("https");
const fs = require("fs");
const os = require("os");
const ip = require("ip");
const net = require("net");
const tls = require("tls");
const bodyParser = require("body-parser");
const express = require("express");
const morgan = require("morgan");
const Moment = require("moment");
const request = require("request");
//const session = require("express-session");
const jwt = require("jsonwebtoken");
const { exec } = require("child_process");
const unzip = require("unzip-stream");
const sysinfo = require("systeminformation");
const getos = require("getos");
const cpustats = require("cpu-stats"); // dependency has not been updated in 4 years. find an alternative
const diskspace = require("diskspace");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

// Import models and functions
const models = require("../models");
const {
  Config,
  Container,
  Host
} = models;
const {
  mem,
  networkStats
} = sysinfo;
const {
  hostname,
  networkInterfaces,
  platform
} = os;
const host_name = hostname();
const host_addr = ip.address();

/* Old config parameters no longer needed. Delete when db integration is complete
let config = JSON.parse(fs.readFileSync((process.env.PICLUSTER_CONFIG ? process.env.PICLUSTER_CONFIG : "../config.json"), "utf8"));
const proto = config.ssl ? "https://" : "http://";
const ssl_self_signed = config.ssl_self_signed === false;
let server = config.web_connect;
let {
  server_port
} = config;

const node = hostname(); // this variable name is ambiguous. Torikun quit being so ambiguous

// wtf are there nops? torikun stahp already
const noop = () => {};

// Remove once jwt is implemented
let token = "";
*/


module.exports = {
  //////
  // Core functions
  ////

  //[X] Return results object of Config table (id is always 1)
  query_config: () => {
    return new Promise(async (resolve, reject) => {
      await Config.findAll({ where: { id: 1 }}).then(async (result) => {
        resolve(await result);
      }).catch((err) => {
        reject(err);
      });
    });
  },

  //[ ] Return results object of given host contained in Host table
  query_host: (host) => {
    return new Promise(async (resolve) => {
      await Host.findAll({ where: { hostname: host }}).then(async (result) => {
        resolve(await result);
      });
    });
  },

  //[ ] Return results object of all hosts in Host table
  query_hosts: new Promise(async (resolve) => {
    await Host.findAll({}).then(async (result) => {
      resolve(await result);
    });
  }),

  //[X] Bootstrap PiCluster slave host to db
  slave_bootstrap: async () => {

    await Host.findAll({
      // Find any host with same ip address or hostname as host
      where: {
        [Op.or]:[
          { hostname: host_name },
          { address: host_addr }
        ]
      }
    }).then(async (host) => {
      const bootstrap_host = (host.hostname !== host_name || host[0].address !== host_addr) ?
        // If queried host_name or host_addr doesn't exists, update Host table in db
        await Host.update({
          address: host_addr,
          hostname: host_name
        }, { where: { hostname: host_name }}).then(console.log(`Updating slave host ${host_name} (${host_addr})`)) :
        // If no host is found in query, then add new host
        await Host.create({
          hostname: host_name,
          address: host_addr,
          heartbeat: false
        }).then( console.log(`Bootstrapping new slave host ${host_name} (${host_addr})`));

      try {
        return bootstrap_host;
      } catch (err) {
        console.error(err);
      }
    });
  },

  //[ ] Spawn PiCluster slave express app
  slave_spawn: () => {
    // Sync db before doing anything (to commit bootstrap values before main execution)
    models.sequelize.sync().then(() => {
      const app = express();

      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({
        extended: true
      }));

      // Log requests with morgan
      // TODO: Create log level engine for debug use
      app.use(morgan("dev"));

      Promise.all([
        module.exports.query_config(),
        module.exports.query_host(host_name)
      ]).then(async (results) => {
        const {
          heartbeat_interval,
          tls_enable,
          //tls_self_signed,
          tls_cert_path,
          tls_key_path
        } = results[0][0];
        const {
          heartbeat,
          address,
          port
        } = results[1][0];

        // Require api routes in app
        require("../routes/api")(app);

        // Disabling elastic search for now
        const elasticsearch = false;
        // TODO: This logic should be moved elsewhere and refactored
        // NOTE: No config value was set, ignoring for now.
        if (elasticsearch) {
          const mapping = {
            settings: {
              index: {
                number_of_shards: 3,
                number_of_replicas: 2
              }
            },
            mappings: {
              "picluster-logging": {
                properties: {
                  date: {
                    type: "date",
                    index: "true",
                    format: "yyyy-MM-dd HH:mm:ssZ"
                  },
                  data: {
                    type: "keyword",
                    index: "true"
                  }
                }
              }
            }
          };

          const monitoring_mapping = {
            settings: {
              index: {
                number_of_shards: 3,
                number_of_replicas: 2
              }
            },
            mappings: {
              "picluster-monitoring": {
                properties: {
                  date: {
                    type: "date",
                    index: "true",
                    format: "yyyy-MM-dd HH:mm:ssZ"
                  },
                  cpu: {
                    type: "double"
                  },
                  node: {
                    type: "keyword",
                    index: "true"
                  },
                  memory: {
                    type: "double",
                    index: "true"
                  },
                  network_tx: {
                    type: "double",
                    index: "true"
                  },
                  network_rx: {
                    type: "double",
                    index: "true"
                  },
                  disk: {
                    type: "double",
                    index: "true"
                  },
                  total_running_containers: {
                    type: "double",
                    index: "true"
                  }
                }
              }
            }
          };

          module.exports.create_es_mappings(mapping, "picluster-logging");
          module.exports.create_es_mappings(monitoring_mapping, "picluster-monitoring");
        }

        // TODO: This logic should be moved elsewhere and refactored
        if (heartbeat) {
          if (heartbeat.indexOf("enabled") > -1) {
            if (heartbeat_interval) {
              console.log("\nAutomatic Heartbeat Enabled. Will check every: " + heartbeat_interval + " ms.");
              module.exports.automatic_heartbeat();
            } else {
              console.log("\nAutomatic Heartbeat Disabled: heartbeat_interval is not set.");
            }
          } else {
            console.log("\nAutomatic Heartbeat Disabled.");
          }
        } else {
          console.log("\nAutomatic Heartbeat Disabled.");
        }

        //bootstrap();

        // Setup slave server options
        const scheme = tls_enable ? https : http;
        const proto = tls_enable ? "https://" : "http://";
        const options = (tls_enable && tls_cert_path && tls_key_path) ?
          {
            cert: fs.readFileSync(tls_cert_path),
            key: fs.readFileSync(tls_key_path)
          }
          :
          null;
        const server = scheme.createServer(options, app);

        // Spawn slave
        server.listen(port, () => {
          console.log(`Slave host ${host_name} listening on ${proto}${address}:${port}`);
        });
      });
    });
  },

  //[X] Verify JWT token
  verify_jwt: async (token) => {
    return await new Promise(async (resolve) => {
      await module.exports.query_config().then(async (config) => {
        const verify_token = await jwt.verify(token, config[0].session_secret);

        try {
          resolve(verify_token);
        } catch (err) {
          console.error(err);
        }
      });
    });
  },

  //[X] Create JWT token
  create_jwt: async () => {
    return await new Promise((resolve) => {
      module.exports.query_config().then((config) => {
        const sign_token = jwt.sign(
          {},
          config[0].session_secret,
          { algorithm: "HS512" }
        );

        try {
          resolve(sign_token);
        } catch (err) {
          console.error(err);
        }
      });
    });
  },

  // TODO: Add full `docker container` command subset features.
  // TODO: Add full `docker network` command subset features.
  // TODO: Needs refactoring; could probably be better optimized
  // TODO: Sanitze args object. Could probaly be used maliciously.
  //[ ] Run a given slave command with a given args object
  runner: async (command, args) => {
    //console.log("args passed to runner: " + JSON.stringify(args));

    return await new Promise((resolve, reject) => {
      switch(command) {
      case "swarm_create":
        exec("docker swarm init", (err, stdout, stderr) => {
          if (err) reject(stderr);
          resolve({ stdout: stdout });
        });
        break;
      case "swarm_leave":
        exec("docker swarm leave --force", (err, stdout, stderr) => {
          if (err) reject(stderr);
          resolve({ stdout: stdout });
        });
        break;
      case "swarm_network":
        exec(`docker network create -d overlay --attachable ${args.network}`, (err, stdout, stderr) => {
          if (err) reject(stderr);
          resolve({ stdout: stdout });
        });
        break;
      case "container_add":
        exec(`docker container run -d --name ${args.container_name} ${args.container_image}`, (err, stdout, stderr) => {
          if (err) reject(stderr);
          resolve({ stdout: stdout });
        });
        break;
      default:
        resolve({ err: `Command ${command} unknown. [args: ${args}]`});
      }
    });
  },

  //[X] Handle async errors
  err_catcher: (middleware) => {
    return async (req, res, next) => {
      try {
        await middleware(req, res, next);
      } catch (err) {
        console.error(err);
        next(err);
      }
    };
  },

  //////
  // Host functions
  ////
  // TODO: Host info and functions should be refactored into a Class

  //[X] Return cumulative info object of current host
  host_info: async () => {
    return await new Promise((resolve, reject) => {
      // Run all host info promises
      Promise.all([
        module.exports.info_os(),
        module.exports.info_cpu(),
        module.exports.info_mem(),
        module.exports.info_disk(),
        module.exports.info_net()
      ]).then((result) => {
        let output = {};
        output.hostname = hostname();

        // Append each promise result to output object
        for (let i in result){
          Object.assign(output, result[i]);
        }

        resolve(output);
      }).catch((err) => {
        reject(err);
      });
    });
  },

  //[X] Return promise that resolves a json object of the OS type
  info_os: async () => {
    return await new Promise(async (resolve, reject) => {
      await getos((err, os) => {
        if (err) reject(err);
        resolve(Object.assign({}, os));
      });
    });
  },

  //[X] Return promise that resolves a json object of CPU stats
  info_cpu: async () => {
    return await new Promise(async (resolve, reject) => {
      await cpustats(1000, (err, result) => {
        if (err) reject(err);
        let output = {};
        output.cpu_usage = 0;
        output.cpu_cores = 0;

        result.forEach(e => {
          output.cpu_usage += e.cpu;
          output.cpu_cores++;
        });

        output.cpu_percent = output.cpu_usage / output.cpu_cores;

        resolve(output);
      });
    });
  },

  //[X] Return json object of memory stats
  info_mem: async () => {
    return await new Promise(async (resolve) => {
      await mem((data) => {
        let output = {};
        output.memory_total = data.total;
        output.memory_buffers = data.buffcache;
        output.memory_used = data.used;
        output.memory_swap = data.swapused;

        // TODO: could be refactored more efficiently
        let memory_range = (platform().indexOf("linux") > -1) ?
          output.memory_used - output.memory_buffers
          :
          output.memory_used + output.memory_buffers;

        output.memory_percentage = Math.round((memory_range) / output.memory_total * 100);

        resolve(output);
      });
    });
  },

  //[X] Return json object of hard disk stats
  info_disk: async () => {
    return await new Promise(async (resolve, reject) => {
      await diskspace.check("/", async (err, result) => {
        if (err) reject(err);
        let output = {};
        output.disk_percentage = Math.round(result.used / result.total * 100);

        resolve(output);
      });
    });
  },

  //[X] Return json object of network stats
  info_net: async () => {
    return await new Promise(async (resolve) => {
      await networkStats((data) => {
        let output = {};
        output.network_tx = Math.round(data.tx_sec / 1000);
        output.network_rx = Math.round(data.rx_sec / 1000);

        resolve(output);
      });
    });
  },

  //[X] Return json object of docker stats
  container_info: async () => {
    return await new Promise(async (resolve, reject) => {
      Promise.all([
        module.exports.total_running_containers(),
        module.exports.running_containers(),
        module.exports.container_cpu(),
        module.exports.container_memory(),
        module.exports.container_uptime(),
        module.exports.docker_images()
      ]).then((result) => {
        let output = [];

        // Push each promise result to output array
        for (let i in result){
          output.push(output, result[i]);
        }

        resolve(output);
      }).catch((err) => {
        reject(err);
      });
    });
  },

  total_running_containers: async () => {
    await new Promise((resolve, reject) => {
      exec("docker container ps -q", (err, stdout, stderr) => {
        if (err) reject(stderr);
        resolve(stdout.split("\n").length - 1);
      });
    });
  },

  running_containers: async () => {
    await new Promise((resolve, reject) => {
      exec("docker ps --format \"{{.Names}}\"", (err, stdout, stderr) => {
        if (err) reject(stderr);
        resolve(stdout.split("\n"));
      });
    });
  },

  container_cpu: async () => {
    await new Promise((resolve, reject) => {
      exec("docker stats --no-stream  --format \"{{.CPUPerc}}\"", (err, stdout, stderr) => {
        if (err) reject(stderr);
        resolve(stdout.replace(/%/gi, "").split("\n"));
      });
    });
  },

  container_memory: async () => {
    await new Promise((resolve, reject) => {
      exec("docker stats --no-stream  --format \"{{.MemPerc}}\"", (err, stdout, stderr) => {
        if (err) reject(stderr);
        resolve(stdout.replace(/%/gi, "").split("\n"));
      });
    });
  },

  container_uptime: async () => {
    await new Promise((resolve, reject) => {
      exec("docker ps --format \"{{.Status}}\"", (err, stdout, stderr) => {
        if (err) reject(stderr);
        resolve(stdout.split("\n"));
      });
    });
  },

  docker_images: async () => {
    await new Promise((resolve, reject) => {
      exec("docker images --format \"table {{.Repository}}\"", (err, stdout, stderr) => {
        if (err) reject(stderr);
        let images = [];

        // Separate images by newline
        images = stdout.split("\n");

        // Strip out values containing "<none>" or "REPOSITORY"
        for (const i in images) {
          images[i] = ((images[i].indexOf("REPOSITORY") > -1) || images[i].indexOf("<none>") > -1) ? "" : images[i];
        }

        // Filter out empty values
        images = images.filter((e, position) => {
          return e.length > 0 && images.indexOf(e) === position;
        });

        // Sort image results
        images = images.sort();

        resolve(images);
      });
    });
  },

  // TODO: rename to ping; also refactor this crap
  // TODO: Add proper try/catch error handling
  //[ ] API request to VIP (failover) slave, expects a successful /pong
  send_ping: () => {
    let vip_ping_time = "";
    setTimeout(() => {
      let vip_slave = "";
      let ip_add_command = "";
      let ip_delete_command = "";

      const token_body = JSON.stringify({
        token
      });

      const options = {
        url: `${proto}${vip_slave}:${server_port}/pong`,
        rejectUnauthorized: ssl_self_signed,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": token_body.length
        },
        body: token_body
      };

      request(options, (error, response, body) => {
        let found_vip = false;
        let vip = "";
        if (error) {
          const cmd = ip_add_command;
          // dafuq is this all about?
          // oh THIS is where nops are used? Torikun think this line through and refactor
          exec(cmd).then(noop).catch(noop);
        } else {
          const interfaces = networkInterfaces();
          Object.keys(interfaces).forEach(devName => {
            const iface = interfaces[devName];
            iface.forEach(alias => {
              if (alias.address === vip) {
                found_vip = true;
              }
            });
          });
          const json_object = JSON.parse(body);

          if (json_object.vip_detected === "false" && found_vip === false) {
            console.log("\nVIP not detected on either machine. Bringing up the VIP on this host.");
            const cmd = ip_add_command;
            exec(cmd).catch(error2 => {
              console.log(error2);
            });
          }
          if ((json_object.vip_detected === "true" && found_vip === true)) {
            console.log("\nVIP detected on boths hosts! Stopping the VIP on this host.");
            const cmd = ip_delete_command;
            exec(cmd).catch(error2 => {
              console.log(error2);
            });
          }
        }
      });
      module.exports.send_ping();
    }, vip_ping_time);
  },

  //[ ] Unzip a given file to docker_path
  // TODO: Add proper try/catch error handling
  // TODO: Ambiguous function name. Perhaps add destination argument?
  unzipFile: (file) => {
    fs.createReadStream(file).pipe(new unzip.Extract({
      path: config.docker
    }));
  },

  // TODO: Needs SERIOUS refactoring
  // TODO: Add proper try/catch error handling
  //[ ] Handle autostarting containers and VIP (failover?) hosts
  additional_services: () => {
    let vip = "";
    let vip_slave = "";
    let ip_add_command = "";
    let ip_delete_command = "";
    let vip_ping_time = "";

    module.exports.monitoring();

    if (config.autostart_containers) {
      console.log("Starting all the containers.....");

      const options = {
        url: `${proto}${server}:${server_port}/start?token=${token}&container=*`,
        rejectUnauthorized: ssl_self_signed
      };

      request.get(options).on("error", e => {
        console.error(e);
      });
    }

    if (config.vip_ip && config.vip) {
      vip = config.vip_ip;
      Object.keys(config.vip).forEach(i => {
        const _node = config.vip[i].node;
        Object.keys(config.vip[i]).forEach(key => {
          if (!config.vip[i].hasOwnProperty(key)) {
            return;
          }
          const interfaces = os.networkInterfaces();
          Object.keys(interfaces).forEach(devName => {
            const iface = interfaces[devName];
            iface.forEach(alias => {
              if (alias.address !== _node) {
                return;
              }
              vip_slave = config.vip[i].slave;
              const {
                vip_eth_device
              } = config.vip[i];
              ip_add_command = "ip addr add " + config.vip_ip + "/32 dev " + vip_eth_device;
              ip_delete_command = "ip addr del " + config.vip_ip + "/32 dev " + vip_eth_device;
              vip_ping_time = config.vip[i].vip_ping_time;
              exec(ip_delete_command).then(module.exports.send_ping()).catch(module.exports.send_ping()); // smh Torikun wtf are you doing here?
            });
          });
        });
      });
    }
  },

  // TODO: needs serious refactoring
  //[ ] Function to call API request of /heartbeat on slave
  // TODO: Add proper try/catch error handling
  automatic_heartbeat: () => {
    if (config.automatic_heartbeat.indexOf("enabled") > -1) {
      setTimeout(() => {
        const options = {
          url: `${proto}${server}:${server_port}/heartbeat?token=${token}`,
          rejectUnauthorized: ssl_self_signed
        };

        request.get(options).on("error", e => {
          console.error(e);
        });
        module.exports.automatic_heartbeat();
      }, config.heartbeat_interval);
    } else {
      console.log("\nAutomatic Heartbeat Disabled.");
    }
  },

  // TODO: Refactor function with websockets and rename to less ambiguous name
  // TODO: Add proper try/catch error handling
  //[ ] Check heartbeat of containers over Socket
  heartbeat_check: (node, container_port, container) => {
    if (config.automatic_heartbeat.indexOf("enabled") > -1) {
      // Setup a new Socket
      const client = config.ssl ? new tls.TLSSocket() : new net.Socket();

      // Connect to host
      client.connect(container_port, node, container, () => {});

      // Add heartbeat notify to log
      client.on("end", () => {
        module.exports.addLog("\nA Heart Beat Check Just Ran.");
      });

      client.on("error", () => {
        module.exports.addLog("\n" + container + " failed on: " + node);
        console.log("\n" + container + " failed on: " + node);

        if (config.container_host_constraints) {
          container_faillog.push(container);
          module.exports.container_failover(container);
        }

        // Restart a container on socket error
        const options = {
          url: `${proto}${server}:${server_port}/restart?node=${node}&container=${container}&token=${token}`,
          rejectUnauthorized: ssl_self_signed
        };

        // why http and not request?
        http.get(options).on("error", e => {
          console.error(e);
        });

        client.destroy();
      });
    }
  },

  //[ ] Handle container failover?
  // TODO: Add proper try/catch error handling
  container_failover: (container) => {
    let container_fail_counter = 0;
    let proceed = "";

    for (const key in container_faillog) {
      if (log.hasOwnProperty(key)) {
        if (container_faillog[key].indexOf(container) > -1) {
          container_fail_counter++;
        }
      }
    }

    if (container_fail_counter >= 3) {
      for (const bkey in container_faillog) {
        if (container_faillog[bkey].indexOf(container) > -1) {
          delete container_faillog[bkey];
          proceed = 1;
        }
      }

      if (proceed) {
        for (const key in config.container_host_constraints) {
          if (config.container_host_constraints.hasOwnProperty(key)) {
            const analyze = config.container_host_constraints[key].container.split(",");
            if (container.indexOf(analyze[0]) > -1) {
              analyze.splice(0, 1);
              const newhost = analyze[Math.floor(Math.random() * analyze.length)];
              module.exports.move_container(container, newhost);
              config.automatic_heartbeat = "disabled";
            }
          }
        }
      }
    }
  },

  //[ ] A function to do an API request to /changehost
  // TODO: Add proper try/catch error handling
  move_container: (container, newhost) => {
    console.log("\nMigrating container " + container + " to " + newhost + "......");
    module.exports.addLog("\nMigrating container " + container + " to " + newhost + "......");

    const options = {
      url: `${proto}${server}:${server_port}/changehost?token=${token}&container=${container}&newhost=${newhost}`,
      rejectUnauthorized: ssl_self_signed,
      method: "GET"
    };

    request(options, error => {
      if (error) {
        console.log("Error connecting with server. " + error);
      } else {
        config.automatic_heartbeat = "enabled";
      }
    });
  },

  //[ ] Copy a given file to agents (hosts?)
  // TODO: Add proper try/catch error handling
  copyToAgents: (file, config_file, temp_file) => {
    Object.keys(config.layout).forEach((get_node, i) => {
      const {
        node
      } = config.layout[i];
      const formData = {
        name: "file",
        token,
        config_file,
        file: fs.createReadStream(file)
      };

      const form_options = {
        url: `${proto}${node}:${server_port}/receive-file`,
        rejectUnauthorized: ssl_self_signed,
        formData
      };

      request.post(form_options, err => {
        if (!err) {
          if (!config_file) {
            module.exports.addLog("\nCopied " + file + " to " + node);
            console.log("\nCopied " + file + " to " + node);
          }
        }
      });
    });
    if (temp_file) {
      fs.unlink(temp_file, error => {
        if (error) {
          console.log(error);
        }
      });
    }
  },

  //[ ] Delete a function? (perhaps "function" needs to be redefined as "lambda")
  // TODO: Add proper try/catch error handling
  delete_function: (name, node) => {
    const command = JSON.stringify({
      command: "docker container rm -f " + name,
      token
    });

    const options = {
      url: proto + node + ":" + server_port + "/run",
      rejectUnauthorized: ssl_self_signed,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": command.length
      },
      body: command
    };
    request(options, error => {
      if (error) {
        console.log("\n" + error);
      }
    });
  },

  //[ ] Nope nope nope, I'm not touching the ES crap
  // TODO: Add proper try/catch error handling
  create_es_mappings: (mapping, index) => {
    const options = {
      url: config.elasticsearch + "/" + index,
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": mapping.length
      },
      body: JSON.stringify(mapping)
    };

    request(options, error => {
      console.log("\nCreating Elasticsearch Map......");
      if (error) {
        console.log(error);
      }
    });
  },

  // Torikun I'm not even fucking with this
  // TODO: Add proper try/catch error handling
  elasticsearch: (data) => {
    const current_time = new Moment().format("YYYY-MM-DD HH:mm:ssZ");

    const elasticsearch_data = JSON.stringify({
      date: current_time,
      data
    });

    const options = {
      url: config.elasticsearch + "/picluster-logging/picluster-logging",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": elasticsearch_data.length
      },
      body: elasticsearch_data
    };

    request(options, error => {
      if (error) {
        console.log(error);
      }
    });
  },

  // Torikun this one too. ES is your mess to deal with :p
  // TODO: Add proper try/catch error handling, refactor to handle promises and/or async/await
  elasticsearch_monitoring: (cpu, node, disk, memory, total_running_containers, network_rx, network_tx) => {
    const current_time = new Moment().format("YYYY-MM-DD HH:mm:ssZ");

    const options = {
      url: config.elasticsearch + "/picluster-monitoring/picluster-monitoring",
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        date: current_time,
        cpu,
        node,
        disk,
        memory,
        network_rx,
        network_tx,
        total_running_containers
      })
    };

    request(options, error => {
      if (error) {
        console.log(error);
      }
    });
  },

  //[ ] Migrate (move or copy?) source container to host destination
  // TODO: Add proper try/catch error handling
  migrate: (container, original_host, new_host, original_container_data, uuid) => {
    let existing_automatic_heartbeat_value = "";

    if (config.automatic_heartbeat) {
      existing_automatic_heartbeat_value = config.automatic_heartbeat;
      if (config.automatic_heartbeat.indexOf("enabled") > -1) {
        config.automatic_heartbeat = "disabled";
      }
    }

    const command = JSON.stringify({
      command: "docker container rm -f " + container,
      token
    });

    const options = {
      url: `${proto}${original_host}:${server_port}/run`,
      rejectUnauthorized: ssl_self_signed,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": command.length
      },
      body: command
    };

    request(options, error => {
      if (error) {
        module.exports.addLog("An error has occurred.");
      } else {
        let command = "";
        if (uuid) {
          const image_name = container.split("-" + uuid)[0];
          command = JSON.stringify({
            command: "docker image build " + dockerFolder + "/" + image_name + " -t " + image_name + " -f " + dockerFolder + "/" + image_name + "/Dockerfile;docker container run -d --name " + container + " " + original_container_data + " " + image_name,
            token
          });
        } else {
          command = JSON.stringify({
            command: `docker image build ${dockerFolder}/${container} -t ${container} -f ${dockerFolder}/${container}/Dockerfile;docker container run -d --name ${container} ${original_container_data} ${container}`,
            token
          });
        }

        const options = {
          url: `${proto}${new_host}:${server_port}/run`,
          rejectUnauthorized: ssl_self_signed,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": command.length
          },
          body: command
        };

        request(options, error => {
          if (error) {
            module.exports.addLog("An error has occurred.");
          }
          if (config.automatic_heartbeat) {
            if (existing_automatic_heartbeat_value.indexOf("enabled") > -1) {
              config.automatic_heartbeat = existing_automatic_heartbeat_value;
            }
          }
        });
      }
    });
  },

  //[ ] Add given data to log?
  // TODO: Add proper try/catch error handling
  addLog: (data) => {
    log += data;
  },

  //[ ] Add given data to node_metrics object? wth?
  // TODO: Add proper try/catch error handling
  // Push data into node_metric array
  addData: (data) => {
    node_metrics.data.push(data);
  },

  //[ ] Get a count of all nodes and containers
  // TODO: Add proper try/catch error handling
  // Return array of node_metrics containing node_count, total_containers, node_list and container_list
  // NOTE: Original /nodes node_metrics array also contained data holding array, functions variable and function_server pointing to /getfunction call on server API
  getData: () => {
    let node_count = 0;
    let total_containers = 0;
    const node_list = [];
    const container_list = [];

    // Loop through entire length of config.layout
    for (let i = 0; i < config.layout.length; i++) {
      // Loop through each key inside config.layout[i] instance
      for (const key in config.layout[i]) {
        // Check if config.layout[i] instance contains key of itself (why?)
        if (config.layout[i].hasOwnProperty(key)) {
          const {
            node
          } = config.layout[i];
          const node_info = config.layout[i][key];

          // If config.layout[i].node is the same key as config.layout[i][key]
          if (node_info === node) {
            // Increment node_count
            node_count++;

            // Push config.layout[i].node into node_list array
            node_list.push(node);
          } else {
            // Increment total_containers
            total_containers++;

            // Push key to container_list array
            container_list.push(key);
          }
        }
      }
    }

    node_metrics.total_containers = total_containers;
    node_metrics.total_nodes = node_count;
    node_metrics.container_list = container_list;
    node_metrics.nodes = node_list;
    total_nodes = node_count;

    // Return node_metrics array(?)
    return node_metrics;
  },

  //[ ] Create a function (lambda?)
  // TODO: Add proper try/catch error handling
  create_function: (name, uuid, host, user_container_args) => {
    let container_args = "-e UUID=" + uuid + " -e TOKEN=" + token + " -e SERVER=" + proto + server + ":" + server_port;
    const container = name;

    if (user_container_args) {
      container_args = user_container_args + " " + container_args;
    }

    module.export.migrate(container, host, host, container_args, uuid);
  },
};
