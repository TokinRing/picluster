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
    }
  }, {
    hooks: {
      // Before a User is created, automatically hash their password
      beforeCreate: async (user) => {
        user.password = await bcrypt.hashSync(user.password, bcrypt.genSaltSync(10));
      }
    }
  });

  // Check if unhashed password entered is same as stored hashed password
  // NOTE: Function must be declared or else hashed password isn't returned
  User.prototype.validPassword = function(password) {
    try {
      return bcrypt.compareSync(password, this.password);
    } catch (err) {
      console.error(err);
    }
  };

  // Return the sequelized User model object
  return User;
};
