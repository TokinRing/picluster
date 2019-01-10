/*jshint esversion: 6 */
// This is where abstract and modular functions for the web gui go
// include with ```const lib = require("../lib/picluster-web-lib");```

function generate_api_token() {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const api_token_length = 64;
  let api_token = "";

  for (let i = 0; i <= api_token_length; i++) {
    api_token += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return api_token;
}
