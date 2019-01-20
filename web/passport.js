/*jshint esversion:6*/
// Import passport and use the passport-local strategy
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

//Import models folder
const models = require("../models");

// Setup the Local Strategy to login with a username and password
passport.use(new LocalStrategy(
  // User will sign in using a username
  {
    usernameField: "username"
  },
  function(username, password, done) {
    // Find a matching username in DB when user tries to sign in
    models.User.findOne({
        where: {
          username: username
        }
      })
      .then((user, err) => {
        // If an error occurs, throw error
        if (err) {
          return done(err);
        }

        // If no matching username found return fail message
        if (!user) {
          return done(null, false, {
            message: "Username not found."
          });
        }

        // If username is matched but the password the given is incorrect
        else if (!user.validPassword(password)) {
          return done(null, false, {
            message: "Incorrect password."
          });
        }

        // If its all good man, return the user
        return done(null, user);
      });
  }
));

// Serialize the user to keep authentication state across HTTP requests
passport.serializeUser(function(user, cb) {
  cb(null, user);
});

// Deserialize the user to keep authentication state across HTTP requests
passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

// Export configured passport
module.exports = passport;
