// Abstract and modular functions for the web console
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const express = require("express");
const session = require("express-session");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const request = require("request");
const ip_addr = require("ip").address();
const hostname = require("os").hostname();
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

// Import models and passport
const models = require("../models");
const passport = require("../passport");
const {
  Config,
  Host,
  User
} = models;

module.exports = {
  // TODO: function needs styling correction and refactoring
  // TODO: duplicate function name. express has its own sendFile.
  // TODO: wtf? send given file then unlink temp_file???
  //[ ] Send a given file to server
  sendFile: (file, temp_file) => {
    Config.findAll({
      where: {
        id: 1
      },
      raw: true
    }).then((config) => {
      let {
        server_port,
        tls_enabled,
        tls_self_signed,
        master_address,
      } = config[0];

      const proto = tls_enabled ? "https://" : "http://";
      const server_host = proto + master_address + ":" + server_port;

      const formData = {
        name: "file",
        token,
        file: fs.createReadStream(file)
      };

      const options = {
        url: `${server_host}/receive-file`,
        rejectUnauthorized: tls_self_signed,
        formData
      };

      request.post(options, () => {
        try {
          fs.unlink(temp_file, () => {});
          console.log("Upload successful!");
        } catch (err) {
          console.error(err);
        }
      });
    });
  },

  // TODO: Needs refactoring
  // Get what data?? Oh host_metric data... rename ambiguous function name (or better yet, rewrite new function and scrap this)
  //[ ] Function to request /nodes from server API
  getData: () => {
    // Query Config table
    Config.findAll({
      where: {
        id: 1
      },
      raw: true
    }).then((config) => {
      let {
        server_port,
        tls_enabled,
        tls_self_signed,
        master_address,
        request_timeout
      } = config[0];

      const proto = tls_enabled ? "https://" : "http://";
      const server_host = proto + master_address + ":" + server_port;

      setTimeout(() => {
        const options = {
          // TODO: refactor reference to /nodes handle to use /api/host/info
          url: `${server_host}/nodes`,
          rejectUnauthorized: tls_self_signed
        };

        request(options, (error, response) => {
          if (!error && response.statusCode === 200) {
            try {
              //let nodedata = JSON.parse(response.body);
            } catch (error2) {
              console.error(error2);
            }
          } else {
            console.log("\nError connecting with server. " + error);
          }
        });
        //module.exports.getData();
      }, request_timeout);
    });
  },

  //[ ] Function to clear log and request /log from server API
  display_log: (callback) => {
    // Query Config table
    Config.findAll({
      where: {
        id: 1
      },
      raw: true
    }).then((config) => {
      let {
        server_port,
        tls_enabled,
        tls_self_signed,
        master_address,
        request_timeout
      } = config[0];

      const proto = tls_enabled ? "https://" : "http://";
      const server_host = proto + master_address + ":" + server_port;

      const options = {
        // NOTE: Needs jwt
        url: `${server_host}/log`,
        rejectUnauthorized: tls_self_signed
      };

      module.exports.clear_log(() => {
        setTimeout(() => {
          request(options, (error, response, body) => {
            if (!error && response.statusCode === 200) {
              callback(body);
            } else {
              callback("\nError connecting with server.");
            }
          });
        }, request_timeout);
      });
    });
  },

  //[ ] Function to request /clearlog from server API
  clear_log: (callback) => {
    // Query Config table
    Config.findAll({
      where: {
        id: 1
      },
      raw: true
    }).then(config => {
      let {
        server_port,
        tls_enabled,
        tls_self_signed,
        master_address,
      } = config[0];

      const proto = tls_enabled ? "https://" : "http://";
      const server_host = proto + master_address + ":" + server_port;

      const options = {
        // NOTE: needs jwt
        url: `${server_host}/clearlog`,
        rejectUnauthorized: tls_self_signed
      };

      // NOTE: uhhh dafuq? refactor
      request(options, (error, response) => {
        if (!error && response.statusCode === 200) {
          callback("");
        } else {
          console.log("\nError clearing log: " + error);
        }
      });
    });
  },

  //[X] Return a 32 character long random string
  generate_token: () => {
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const api_token_length = 32;
    let api_token = "";

    for (let i = 0; i <= api_token_length; i++) {
      api_token += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    try {
      return api_token;
    } catch (err) {
      console.error(err);
    }
  },

  //[X] Return an array of filenames in a given directory of a given file extension.
  get_file_list_by_extension: async (dirpath, extention) => {
    const files = fs.readdirSync(dirpath);
    let file_list = await [];

    for (const i in files) {
      if (path.extname(files[i]) === extention) file_list.push(files[i]);
    }

    try {
      return await file_list;
    } catch (err) {
      console.error(err);
    }
  },

  //[ ] Update the Config table with the given object
  config_update: async (config) => {
    const update = await Config.update(config, { where: { id: 1 }}).then( console.log("Updating config."));

    try {
      return update;
    } catch (err) {
      console.error(err);
    }
  },

  //[X] Add given host with given ip address to Host table in db
  host_add: async (host, addr) => {
    return await new Promise(async (resolve) => {
      const host_create = await Host.create({
        hostname: host,
        address: addr,
        port: 3000,
        heartbeat: false,
        is_master: false
      }).then( console.info(`Adding host ${host} (${addr})`));

      try {
        resolve(host_create);
      } catch (err) {
        console.error(err);
      }
    });
  },

  //[X] Remove given host from Host table
  host_remove: async (host) => {
    const host_destroy = await Host.destroy({ where: { hostname: host }}).then( console.info(`Removing host [${host}]`));

    try {
      return host_destroy;
    } catch (err) {
      console.error(err);
    }
  },

  //[ ] Update a given host
  host_update: async (host, options) => {
    return await new Promise(async (resolve, reject) => {
      if (typeof options !== "object") reject();

      const update = await Host.update(options, { where: { hostname: host}});

      try {
        return update;
      } catch (err) {
        reject(err);
      }
    });
  },

  //[ ] Add a given user with given password to User table
  user_add: async (user, password) => {
    const create_user = await User.create({
      username: user,
      password: password
    }).then( console.info(`Adding user [${user}]`));

    try {
      return create_user;
    } catch (err) {
      console.error(err);
    }
  },

  // Serve doc pages (should probably finish this after db integration)
  serve_doc_pages: (app) => {
    // TODO: needs query_config implemented
    const doc_dir = null;

    const doc_pages = module.exports.get_file_list_by_extention(path.join(__dirname, doc_dir.toString()), ".md");

    for (const i in doc_pages) {
      if (i) {
        app.get("/doc" + i, (req, res) => {
          res.sendFile(path.join(__dirname + "/" + doc_dir + "/" + doc_pages[i]));
        });
      }
    }
  },

  //[ ] Return query results of Config table (single entry)
  query_config: () => {
    return new Promise(async (resolve) => {
      await Config.findAll({ where: { id: 1 }}).then(async (result) => {
        resolve(await result);
      });
    });
  },

  //[ ] Return query results of given host contained in Host table
  query_host: (host) => {
    return new Promise(async (resolve) => {
      await Host.findAll({ where: { hostname: host }}).then(async (result) => {
        resolve(await result);
      });
    });
  },

  //[ ] Return query results of all hosts contained in Host table
  query_hosts: async () => {
    return new Promise(async (resolve) => {
      await Host.findAll({}).then(async (result) => {
        resolve(await result);
      });
    });
  },

  //[X] Bootstrap web console address to PiCluster db
  web_bootstrap: async () => {
    await Host.findAll({
      // Find any host with same ip address or hostname as current host
      where: {
        [Op.or]:[
          { hostname: hostname },
          { address: ip_addr }
        ]
      }
    }).then(async (host) => {
      const web_bootstrap = (host.hostname !== hostname || host.address !== ip_addr) ?
        // If queried hostname or ip_addr doesn't exists, update Host table in db
        await Host.update({
          address: ip_addr,
          hostname: hostname,
          is_master: true
        }, { where: { hostname: hostname }
        }).then(() => { console.log(`Updating master host ${hostname} (${ip_addr})`);
        }) :
        // If no host is found in query, then add new host with is_master bit set
        await Host.create({
          hostname: hostname,
          address: ip_addr,
          port: 3000,
          heartbeat: false,
          is_master: true,
          master_port: 3003,
          is_swarm_master: false,
          swarm_token: ""
        }).then(()=>{console.log(`Bootstrapping new PiCluster master host ${hostname}(${ip_addr})`);
        });

      try {
        return web_bootstrap;
      } catch (err) {
        console.error(err);
      }
    });
  },

  //[X] Initialize new Config table in PiCluster db
  init: async () => {
    return await new Promise((resolve) => {
      const init_config = models.sequelize.sync().then(async () => {
        await Config.findAll({ where: { id: 1 }}).then(async (config) => {
          (config.length == 0) ?
            await Config.create({
              dockerfile_path: "../docker",
              tls_enable: false,
              tls_self_signed: false,
              tls_cert_path: "",
              tls_key_path: "",
              heartbeat: false,
              heartbeat_interval: 10000,
              syslog: "dmesg",
              theme: "default",
              session_secret: "" + module.exports.generate_token()
            }).then( console.log("Creating new config")) :
            await Config.update({
              dockerfile_path: "../docker",
              tls_enable: false,
              tls_self_signed: false,
              tls_cert_path: "",
              tls_key_path: "",
              heartbeat: false,
              heartbeat_interval: 10000,
              syslog: "dmesg",
              theme: "default",
              session_secret: "" + module.exports.generate_token()
            }, { where: { id: 1 }
            }).then( console.log("Updating existing config"));
        });
      }).then( module.exports.web_bootstrap());

      try {
        resolve(init_config);
      } catch (err) {
        console.error(err);
      }
    });
  },

  //[ ] Import values from original config.json into Config table in db
  upgrade: async () => {
    return await new Promise((resolve) => {
      const upgrade_config = models.sequelize.sync().then (async () => {
        await Config.findOne({ where: { id: 1 }}).then(async (config) => {
        // Load old config and specify keys to remove from old config
          let old_config = JSON.parse(fs.readFileSync((process.env.PICLUSTER_CONFIG ? process.env.PICLUSTER_CONFIG : "../../config.json"), "utf8"));
          const old_config_keys = ["docker", "doc_dir", "server_port", "agent_port", "ssl", "ssl_self_signed", "ssl_cert", "ssl_key", "automatic_heartbeat", "heartbeat_interval", "syslog", "web_username", "web_password", "web_connect", "web_port", "theme", "session_secret"];

          // Update or create with old config values
          (config.length == 0) ?
            await Config.create({
              dockerfile_path: old_config.docker,
              tls_enable: old_config.ssl,
              tls_self_signed: old_config.ssl_self_signed,
              tls_cert_path: old_config.ssl_cert,
              tls_key_path: old_config.ssl_key,
              heartbeat_interval: old_config.heartbeat_interval,
              request_timeout: 5000,
              syslog: old_config.syslog,
              theme: old_config.theme,
              session_secret: old_config.session_secret
            }).then( console.log("Creating new config from config.json")) :
            await Config.update({
              dockerfile_path: old_config.docker,
              tls_enable: old_config.ssl,
              tls_self_signed: old_config.ssl_self_signed,
              tls_cert_path: old_config.ssl_cert,
              tls_key_path: old_config.ssl_key,
              heartbeat_interval: old_config.heartbeat_interval,
              request_timeout: 5000,
              syslog: old_config.syslog,
              theme: old_config.theme,
              session_secret: old_config.session_secret
            }, { where: { id: 1 }
            }).then( console.log("Upgrading existing config from config.json"));

          // Delete each imported property from old config file
          Array.keys(old_config_keys).forEach((key) => { delete old_config[key]; });

          // Write back the upgraded config
          fs.writeFile("../config.json", JSON.stringify(old_config, null, 2));

          try {
            resolve(upgrade_config);
          } catch (err) {
            console.error(err);
          }
        });
      }).then(() => {
        //TODO: Add Host and Heartbeat import here

        module.exports.web_bootstrap();
      });
    });
  },

  //[X] Spawning PiCluster master web console
  web_spawn: () => {
    // Sync db before doing anything (to commit bootstrap values before main execution)
    models.sequelize.sync().then(() => {
      // Initialize express app and get hostname
      const app = express();

      // Log requests with morgan
      // TODO: Create log level engine for debug use
      app.use(morgan("dev"));

      // Serve static  (js, css, images, etc)
      app.use("/", express.static(path.join(__dirname, "../assets"), {
        maxage: "48h"
      }));

      // TODO: wtf is node_modules being served?
      app.use("/node_modules", express.static(path.join(__dirname, "../node_modules"), {
        maxage: "48h"
      }));

      // Setup body parser
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({
        extended: true
      }));

      // Combine config and host queries and initialize PiCluster web console
      Promise.all([
        module.exports.query_config(),
        module.exports.query_host(hostname)
      ]).then(async (result) => {
        // Config variables
        const {
          session_secret,
          tls_enable,
          tls_self_signed,
          tls_cert_path,
          tls_key_path
        } = result[0][0];
        const {
          address,
          master_port
        } = result[1][0];

        process.env.NODE_TLS_REJECT_UNAUTHORIZED = (tls_self_signed) ? "0" : "1";

        // Use sessions to track of user login status
        app.use(session({
          key: "user_sid",
          secret: session_secret,
          cookie: {
            expires: 600000
          },
          resave: true,
          saveUninitialized: true
        }));

        // Initialize passport session middleware
        app.use(passport.initialize());
        app.use(passport.session());

        // Require api and html routes using app
        require("../routes/html")(app);
        require("../routes/api")(app);

        /*
        // TODO: Add docs once iframe mess is purged
          if (fs.existsSync(path.normalize(doc_dir))) {
            app.use("/docs", express.static(path.join(__dirname, doc_dir)));
          }
        */

        // Call get data to initialize view (prepare node_metrics?)
        // module.exports.getData(); // Probabbly not needed anymore... or ever.

        // Setup web server options
        const scheme = tls_enable ? https : http;
        const proto = tls_enable ? "https://" : "http://";
        const options = (tls_enable && tls_cert_path && tls_key_path) ? {
          cert: fs.readFileSync(tls_cert_path),
          key: fs.readFileSync(tls_key_path)
        } : {};
        const server = scheme.createServer(options, app);

        server.listen(master_port, () => {
          module.exports.hell().then( console.log(`Master PiCluster Console enabled on ${proto}${address}:${master_port}`));
        });
      });
    });
  },

  //[X] Display random quote from the movie Spawn (1997) to console.
  hell: async () => {
    return await new Promise(async (resolve) => {
      const quotes = [
        "Cogliostro: The war between heaven & hell depends on the choices we make, and those choices require sacrifice. That's the test.",
        "Spawn: Aren't there any normal people left on Earth, or is everybody just back from hell?",
        "Jason Wynn: When this is all over, I will personally deep-fry your lard-ass.",
        "Spawn: What's happening to me?\nClown: Nothing. Just your necro-flesh going through its larval stage. Soon you're gonna get hair in funny places and gonna start thinking about girls.",
        "Spawn: Just get me to a hospital.\nClown: A hospital? Have you seen yourself lately? Burnt man walking. Not even the entire cast of \"E.R.\" could put you back together.",
        "Clown: Everytime someone farts, a demon gets his wings.\nClown: Oh, twins.",
        "Clown: I love the smell of burning asphalt in the morning.",
        "Clown: You're dead. D-E-D. Dead.",
        "Clown: I say destroy the cosmos, ask questions later.",
        "Spawn: Give my regards to your boss. Tell him he's next.",
        "Spawn: You sent me to Hell. I'm here to return the favor.",
        "Clown: I'm gonna cut you into 50 pieces and mail one to each state.",
        "Jason Wynn: He killed Jessica, and he almost killed me.\nClown: You say that like it's a bad thing.",
        "Clown: Ooh. Burnt man walkin'.",
        "Clown: Boy you were just tied to that track and that stupid train just kept runnin' over ya didn't it? Just runnin' over you.",
        "Jessica Priest: It's a little early for Halloween Simmons.\nSpawn: Where you're going, every day is Halloween.",
        "Jason Wynn: You don't quit us, son. We are not the U.S. Postal Service.",
        "Clown: There you are. I've been looking everwhere for you. Bad crispy, BAD crispy. Clown not like.",
        "Clown: Come on, fry-boy. Can't keep that side-order of potato salad waitning, now can we?",
        "Clown: Why must you people always question? Why, why, why? When how is so much more fun.",
        "Al Simmons: You wipe his ass for him, too?",
        "Spawn: What are you looking at?\nCogliostro: You tell me.",
        "Clown: How come Heaven gets all the good fellas, and we're left with the retards?",
        "Clown: I hate clowns. I hate them all. Ronald, Bozo, Chuckles... with their stupid red noses and over-sized shoes... I don't mind being short, fat, and ugly - but the pay sucks.",
        "Zack: Relax, mister. I've seen worse faces at the coroner's.\nSpawn: Thanks, kid. That makes me feel *much* better.",
        "Clown: Wynn and Wanda sitting in a tree, S-U-C-K-I-N-G"
      ];
      const satan = await console.info(quotes[Math.floor(Math.random() * quotes.length)]);

      try {
        resolve(satan);
      } catch (err) {
        console.error(err);
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

  //[X] Verify JWT token
  verify_jwt: async (token) => {
    return await new Promise(async (resolve, reject) => {
      await module.exports.query_config().then(async (config) => {
        const verify_token = await jwt.verify(token, config[0].session_secret);

        resolve(verify_token);
      }).catch((err) => {
        reject(err);
      });
    });
  },

  //[X] Create JWT token
  create_jwt: async () => {
    return await new Promise((resolve, reject) => {
      module.exports.query_config().then(async (config) => {
        const sign_token = await jwt.sign(
          {},
          config[0].session_secret,
          { algorithm: "HS512" }
        );

        resolve(sign_token);
      }).catch((err) => {
        reject(err);
      });
    });
  },
};
