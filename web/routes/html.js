// Require libs and middleware
const path = require("path");
const request = require("request-promise");
const query_string = require("query-string");
const passport = require("../passport");
const is_authenticated = require("../middleware/is_authenticated");
const lib = require("../lib/libpicluster");
const {
  err_catcher,
  config_update,
  create_jwt,
  //generate_token,
  //get_file_list_by_extention,
  host_add,
  host_remove,
  //init,
  query_config,
  query_host,
  //query_hosts,
  //upgrade,
  user_add
} = lib;

// Export html routes to given app
module.exports = (app) => {
  // Handle base requests
  app.get("/", is_authenticated, err_catcher(async (req, res) => {
    return await res.sendFile(path.join(__dirname, "../views/index.html"));
  }));

  //////
  // Host views
  ////
  app.get("/hosts", is_authenticated, err_catcher(async (req, res) => {
    return await res.sendFile(path.join(__dirname, "../views/hosts.html"));
  }));

  // Handle Host Management form (GET) and submission (POST)
  // NOTE: Implement heartbeat check & autoremove dead hosts;
  app.route("/hosts/manage")
    .get(is_authenticated, err_catcher(async (req, res) => {
      return await res.sendFile(path.join(__dirname, "../views/hosts-manage.html"));
    }))
    .post(is_authenticated, err_catcher(async (req, res) => {
      const {
        host_addr,
        host_name,
        host,
        operation
      } = req.body;

      switch (operation) {
      case "add":
        await host_add(host_name, host_addr);
        break;
      case "remove":
        await host_remove(host);
        break;
      default:
        await console.error("Unknown operation \"" + operation + "\" sent to /hosts/manage API handle");
      }

      return await res.redirect("/hosts/manage");
    }));

  // Render Host Swarm form / API to handle sending swarm command to a given host
  app.route("/hosts/swarm")
    .get(is_authenticated, err_catcher(async (req, res) => {
      return await res.sendFile(path.join(__dirname, "../views/hosts-swarm.html"));
    }))
    // Handle POST proxying to specific target /hosts/swarm server API call
    .post(is_authenticated, (req, res) => {
      // Filter empty strings from host array in req.body
      const host = req.body.host.filter(Boolean);

      Promise.all([
        query_config(),
        query_host(host),
        create_jwt()
      ]).then((results) => {
        const {
          tls_self_signed,
          tls_enabled,
        } = results[0][0];
        const {
          address,
          port
        } = results[1][0];
        const token = results[2];
        const proto = (tls_enabled) ? "https://" : "http://";
        const slave = `${proto}${address}:${port}`;
        const options = {
          url: `${slave}/api/host/swarm`,
          rejectUnauthorized: tls_self_signed,
          method: "POST",
          headers: {
            "x-access-token": token
          },
          form: query_string.stringify(req.body)
        };

        request(options, (err, response) => {
          if (err) throw err;
          if (response.statusCode !== 200) res.send(response);

          // NOTE: Send response.body object
          // res.send(response.body);
          res.redirect("/hosts/swarm");
        });
      });
    });

  //////
  // Container views
  ////
  app.get("/containers", is_authenticated, err_catcher(async (req, res) => {
    return await res.sendFile(path.join(__dirname, "../views/containers.html"));
  }));

  app.route("/containers/manage")
    .get(is_authenticated, err_catcher(async (req, res) => {
      return await res.sendFile(path.join(__dirname, "../views/containers-manage.html"));
    }))
    // Handle POST proxying to specific target /containers/manage server API call
    .post(is_authenticated, (req, res) => {
      // Filter empty strings from host array in req.body
      const host = req.body.host;
      console.log("req: " + query_string.stringify(req.body));

      Promise.all([
        query_config(),
        query_host(host),
        create_jwt()
      ]).then((results) => {
        const {
          tls_self_signed,
          tls_enabled,
        } = results[0][0];
        const {
          address,
          port
        } = results[1][0];
        const token = results[2];
        const proto = (tls_enabled) ? "https://" : "http://";
        const slave = `${proto}${address}:${port}`;
        const form = query_string.stringify(req.body);
        const options = {
          url: `${slave}/api/container/manage`,
          rejectUnauthorized: tls_self_signed,
          method: "POST",
          headers: {
            "x-access-token": token
          },
          form: form
        };

        request(options, (err, response) => {
          if (err) throw err;
          if (response.statusCode !== 200) res.send(response);

          // NOTE: Send response.body object
          res.send(response.body);
          //res.redirect("/containers/manage");
        });
      });
    });

  //////
  // Image views
  ////
  app.get("/images", is_authenticated, err_catcher(async (req, res) => {
    return await res.sendFile(path.join(__dirname, "../views/images.html"));
  }));

  app.get("/images/manage", is_authenticated, err_catcher(async (req, res) => {
    return await res.sendFile(path.join(__dirname, "../views/images-manage.html"));
  }));

  //////
  // Function (Lambda?) views
  ////
  app.get("/functions", is_authenticated, err_catcher(async (req, res) => {
    return await res.sendFile(path.join(__dirname, "../views/functions.html"));
  }));

  app.get("/functions/create", is_authenticated, err_catcher(async (req, res) => {
    return await res.sendFile(path.join(__dirname, "../views/functions-create.html"));
  }));

  app.get("/functions/remove", is_authenticated, err_catcher(async (req, res) => {
    return await res.sendFile(path.join(__dirname, "../views/functions-remove.html"));
  }));

  app.get("/functions/viewer", is_authenticated, err_catcher(async (req, res) => {
    return await res.sendFile(path.join(__dirname, "../views/functions-viewer.html"));
  }));

  //////
  // Ops views
  ////

  //[ ] Handle Config form (GET) and submission (POST)
  app.route("/ops/config")
    .get(is_authenticated, err_catcher(async (req, res) => {
      return await res.sendFile(path.join(__dirname, "../views/ops-config.html"));
    }))
    .post(is_authenticated, err_catcher(async (req, res) => {
      await query_config().then(async (config) => {
        const {
          dockerfile_path,
          tls_enable,
          tls_self_signed,
          tls_cert_path,
          tls_key_path,
          heartbeat_interval,
          syslog,
          session_secret,
          theme
        } = config[0];

        let update_parameters = {
          dockerfile_path: (req.body.dockerfile_path) ? req.body.dockerfile_path : dockerfile_path,
          tls_enable: (req.body.tls_enable) ? req.req.body.tls_enable : tls_enable,
          tls_self_signed: (req.body.tls_self_signed) ? req.body.tls_self_signed : tls_self_signed,
          tls_cert_path: (req.body.tls_cert_path) ? req.body.tls_cert_path : tls_cert_path,
          tls_key_path: (req.body.tls_key_path) ? req.body.tls_key_path : tls_key_path,
          heartbeat_interval: (req.body.heartbeat_interval) ? req.body.heartbeat_interval : heartbeat_interval,
          syslog: (req.body.syslog) ? req.body.syslog : syslog,
          theme: (req.body.theme) ? req.body.theme : theme,
          session_secret: session_secret,
        };

        // If value is passed through req, then update specific property. Otherwise keep original value.
        config_update(update_parameters).then( await res.redirect("/ops/config" ));
      });
    }));

  app.get("/ops/exec", is_authenticated, err_catcher(async (req, res) => {
    return await res.sendFile(path.join(__dirname, "../views/ops-exec.html"));
  }));

  app.get("/ops/heartbeat", is_authenticated, err_catcher(async (req, res) => {
    return await res.sendFile(path.join(__dirname, "../views/ops-heartbeat.html"));
  }));

  app.get("/ops/clean", is_authenticated, err_catcher(async (req, res) => {
    return await res.sendFile(path.join(__dirname, "../views/ops-clean.html"));
  }));

  app.get("/ops/terminal", is_authenticated, err_catcher(async (req, res) => {
    return await res.sendFile(path.join(__dirname, "../views/ops-terminal.html"));
  }));

  app.get("/ops/elasticsearch", is_authenticated, err_catcher(async (req, res) => {
    return await res.sendFile(path.join(__dirname, "../views/ops-elasticsearch.html"));
  }));

  //////
  // Log views
  //////
  app.get("/logs", is_authenticated, err_catcher(async (req, res) => {
    return await res.sendFile(path.join(__dirname, "../views/log.html"));
  }));

  app.get("/logs/syslog", is_authenticated, err_catcher(async (req, res) => {
    return await res.sendFile(path.join(__dirname, "../views/syslog.html"));
  }));

  app.get("/logs/rsyslog", is_authenticated, err_catcher(async (req, res) => {
    return await res.sendFile(path.join(__dirname, "../views/rsyslog.html"));
  }));

  app.get("/config-reload.html", is_authenticated, err_catcher(async (req, res) => {
    return await res.sendFile(path.join(__dirname, "../views/config-reload.html"));
  }));

  app.get("/docs.html", is_authenticated, err_catcher(async (req, res) => {
    return await res.sendFile(path.join(__dirname, "../views/docs.html"));
  }));

  // Handle User Info page
  app.get("/user", is_authenticated, err_catcher(async (req, res) => {
    return await res.sendFile(path.join(__dirname, "../views/user.html"));
  }));

  //[X] Handle User Login form (GET) and authentication (POST), success redirects to "/"
  // NOTE: One of two unauthenticated API handles (the other being "/user/register")
  app.route("/user/login")
    .get(err_catcher(async (req, res) => {
      return await res.sendFile(path.join(__dirname, "../views/user-login.html"));
    }))
    .post(passport.authenticate("local"), err_catcher(async (req, res) => {
      return await res.redirect("/");
    }));

  // Handle User Logout by clearing the user_sid cookie
  app.get("/user/logout", is_authenticated, err_catcher(async (req, res) => {
    if (req.user) res.clearCookie("user_sid");

    return await res.redirect("/");
  }));

  //[ ] Handle User Registeration form (GET) and submission (POST), success redirects to "/user/login"
  // TODO: Needs error handling
  // NOTE: One of two unauthenticated API handles (the other being "/user/login")
  app.route("/user/register")
    .get(err_catcher(async (req, res) => {
      return await res.sendFile(path.join(__dirname, "../views/user/register.html"));
    }))
    .post(err_catcher(async (req, res) => {
      const {
        new_username,
        new_password
      } = req.body;

      user_add(new_username, new_password);
      return await res.redirect("/user/login");
    }));

  // TODO: Migrate to html routes, once that goddamn iframe is removed
  // serve_doc_pages();

  //////
  // Misc
  ////

  // Handle dynamic logo
  app.get("/logo.png", err_catcher(async (req, res) => {
    return await query_config().then(async (config) => {
      return res.sendFile(await path.join(__dirname, "../assets/images/theme/", config[0].theme, "/logo.png"));
    });
  }));

  /* Template blank
  app.get("/blank.html", is_authenticated, err_catcher(async (req, res) => {
    return await res.sendFile(path.join(__dirname, "../views/blank.html"));
  }));
  */
};
