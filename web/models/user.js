// Requiring bcrypt for password hashing
const bcrypt = require("bcrypt");

// Creating our User model
module.exports = (sequelize, DataTypes) => {
  // Define a new model for User objects
  let User = sequelize.define("User", {
    // Username cannot be null
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },

    // Password cannot be null
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },

    // API token cannot be null
    api_token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    }
  });

  // Check if unhashed password entered is same as stored hashed password
  User.prototype.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
  };

  // Before a User is created, automatically hash their password
  User.hook("beforeCreate", function(user) {
    user.password = bcrypt.hashSync(user.password, bcrypt.genSaltSync(10), null);
  });

  // Return the sequelized User object
  return User;
};
