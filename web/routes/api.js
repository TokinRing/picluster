/*jshint esversion: 6 */

// Require our models and configured passport
const models = require("../models");
const passport = require("../config/passport");
const lib = require("../lib/picluster-web-lib");

module.exports = (app) => {
  // Use passport.authenticate middleware with local strategy
  // If credentials are valid send to admin page else throw error
  app.post("/api/login", passport.authenticate("local"), function(req, res) {
    // Send user back to the admin page, redirect will happen there
    res.json("/admin");
  });

  // Route for user signup. If successfully created, login else throw error
  app.post("/api/signup", function(req, res) {
    console.log(req.body);
    models.User.create({
      username: req.body.username,
      password: req.body.password,
      api_token: generate_api_token
    }).then(function() {
      res.redirect(307, "/api/login");
    }).catch(function(err) {
      console.log(err);
      res.json(err);
      // TODO: look into why this is here
      // res.status(422).json(err.errors[0].message);
    });
  });

  // Route for user logout
  app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
  });

  // Route for getting user data used client side
  app.get("/api/user_data", function(req, res) {
    if (!req.user) {
      // The user is not logged in, send back an empty object
      res.json({});
    }
    else {
      // Send back the username and id
      res.json({
        username: req.user.username,
        id: req.user.id
      });
    }
  });
};
