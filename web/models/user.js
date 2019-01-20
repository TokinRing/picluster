/*jshint esversion:6*/
// Requiring bcrypt for password hashing
const bcrypt = require("bcrypt");

// User model
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
  }, {
    hooks: {
      // Before a User is created, automatically hash their password
      beforeCreate: function(user) {
        user.password = bcrypt.hashSync(user.password, bcrypt.genSaltSync(10));
      }
    },
  });

  // Check if unhashed password entered is same as stored hashed password
User.prototype.validPassword = async (password) => {
  return await bcrypt.compareSync(password, this.password);
};

  // Return the sequelized User model object
  return User;
};
