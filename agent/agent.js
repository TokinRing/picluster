const http = require('http');
const https = require('https');
const fs = require('fs');
const os = require('os');
const unzip = require('unzip-stream');
const express = require('express');
const request = require('request');
const diskspace = require('diskspace');
const bodyParser = require('body-parser');
const multer = require('multer');
const getos = require('picluster-getos');
const async = require('async');
const { exec } = require('child-process-promise');
const sysinfo = require('systeminformation');


let config = process.env.PICLUSTER_CONFIG ? JSON.parse(fs.readFileSync(process.env.PICLUSTER_CONFIG, 'utf8')) : JSON.parse(fs.readFileSync('../config.json', 'utf8'));
const app = express();

if (config.ssl_self_signed) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

app.use(bodyParser());

const upload = multer({
  dest: '../'
});

const proto = config.ssl ? 'https://' : 'http://';
const ssl_self_signed = config.ssl_self_signed === false;
let server = config.web_connect;
let {
  server_port
} = config;
const {
  agent_port
} = config;
const node = os.hostname();
let {
  token
} = config;
const noop = () => {};
let vip = '';
let vip_slave = '';
let ip_add_command = '';
let ip_delete_command = '';
let vip_ping_time = '';
let cpu_percent = 0;
let os_type = '';
let disk_percentage = 0;
let total_running_containers = 0;
let container_uptime = '';
let network_rx = 0;
let network_tx = 0;
let running_containers = '';
let container_mem_stats = '';
let container_cpu_stats = '';
let cpu_cores = 0;
let memory_buffers = 0;
let memory_swap = 0;
let memory_total = 0;
let memory_used = 0;
let memory_percentage = 0;
let images = '';

/*
if (config.ssl && config.ssl_cert && config.ssl_key) {
  console.log('SSL Agent API enabled');
  const ssl_options = {
    cert: fs.readFileSync(config.ssl_cert),
    key: fs.readFileSync(config.ssl_key)
  };
  const agent = https.createServer(ssl_options, app);
  agent.listen(agent_port, () => {
    console.log('Listening on port %d', agent_port);
  });
} else {
  console.log('Non-SSL Agent API enabled');
  const agent = http.createServer(app);
  agent.listen(agent_port, () => {
    console.log('Listening on port %d', agent_port);
  });
}
*/
