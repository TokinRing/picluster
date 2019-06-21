// Import models, passport and passport-local strategy
const models = require("./models");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

// Setup the Local Strategy to login with a username and password
passport.use(new LocalStrategy({ usernameField: "username" }, async (username, password, done) => {
  // Find a matching username in DB when user tries to sign in
  await models.User.findOne({
    where: {
      username: username
    }
  }).then(async (user) => {
    // If no matching username found return fail message
    if (!user) {
      return await done(null, false, {
        message: "Username not found."
      });
    }

    // If username is matched but the password the given is incorrect
    else if (!user.validPassword(password)) {
      return await done(null, false, {
        message: "Incorrect password."
      });
    }

    // If its all good man, return the user
    try {
      return await done(null, user);
    } catch (err) {
      console.error(err);
    }
  });
}));

// Serialize the user to keep authentication state across HTTP requests
passport.serializeUser(async (user, callback) => {
  await callback(null, user);
});

// Deserialize the user to keep authentication state across HTTP requests
passport.deserializeUser(async function(obj, callback) {
  await callback(null, obj);
});

// Export configured passport
module.exports = passport;
