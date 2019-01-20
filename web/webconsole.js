/*jshint esversion: 6 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const express = require('express');
const session = require('express-session');
const request = require('request');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

// Import configured passport, models and libs
let models = require("./models");
let lib = require("./lib/libpicluster");
const passport = require("./passport");
const is_authenticated = require("./middleware/is_authenticated");

// Load config (...for now)
let config = JSON.parse(fs.readFileSync((process.env.PICLUSTER_CONFIG ? process.env.PICLUSTER_CONFIG : '../config.json'), 'utf8'));

process.env.NODE_TLS_REJECT_UNAUTHORIZED = config.ssl_self_signed ? '0' : '1';

// Initialize app
const app = express();

// Log requests with morgan
// TODO: Create log level engine for debug use
app.use(morgan('dev'));

// TODO: look into log warnings on startup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// It's time to go to the dark side, they have cookies.
app.use(cookieParser());

// Serve static assets (js, css, images, etc)
app.use('/assets', express.static(path.join(__dirname, 'assets'), {
  maxage: '48h'
}));

// TODO: wtf is node_modules being served?
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules'), {
  maxage: '48h'
}));

// Use sessions to track of user login status
app.use(session({
  key: 'user_sid',
  secret: config.session_secret,
  resave: true,
  saveUninitialized: true,
  cookie: { expires: 600000 }
}));
app.use(passport.initialize());
app.use(passport.session());

// Require api and html routes in app
require("./routes/html.js")(app);
require("./routes/api.js")(app);

// Config variables
const scheme = config.ssl ? 'https://' : 'http://';
const ssl_self_signed = config.ssl_self_signed === false;
const request_timeout = 5000;
const {web_port} = config;
let syslog = config.syslog ? config.syslog : '';
const {doc_dir} = config;
let {theme} = config;
let {token} = config;
let server = config.web_connect;
let {server_port} = config;

// Handle promise errors
process.on('unhandledRejection', (err, promise) => {
    console.error('Unhandled rejection (promise: ', promise, ', reason: ', err, ').');
});

/*
TODO: Add docs once iframe mess is purged
if (fs.existsSync(path.normalize(doc_dir))) {
  app.use('/docs', express.static(path.join(__dirname, doc_dir)));
}
 */

// Call get data to initialize view
lib.getData;

// TODO: Refactor SSL logic into middleware
if (config.ssl && config.ssl_cert && config.ssl_key) {
  console.log('SSL Web Console enabled');
  const ssl_options = {
    cert: fs.readFileSync(config.ssl_cert),
    key: fs.readFileSync(config.ssl_key)
  };
  const webconsole = https.createServer(ssl_options, app);

  // Sync DB models and spawn web console
  models.sequelize.sync().then(() => {
    webconsole.listen(web_port, () => {
      console.log('Listening on port %d', web_port);
    });
  });
} else {
  console.log('Non-SSL Web Console enabled');
  const webconsole = http.createServer(app);

  // Sync DB models and spawn web console
  models.sequelize.sync().then(() => {
    webconsole.listen(web_port, () => {
      console.log('Listening on port %d', web_port);
    });
  });
}
