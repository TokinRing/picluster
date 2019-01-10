// Requiring bcrypt for password hashing
const bcrypt = require("bcrypt-nodejs");

// Creating our User model
module.exports = function(sequelize, DataTypes) {
  let User = sequelize.define("User", {
    // The username cannot be null
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    // The password cannot be null
    password: {
      type: DataTypes.STRING,
      allowNull: false
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
