// Container model
module.exports = (sequelize, DataTypes) => {
  // Define a new model for Container objects
  let Container = sequelize.define("Container", {
    // hostname cannot be null and must be unique
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },

    // uuid cannot be null and must be unique
    uuid: {
      type: DataTypes.STRING,
      unique: true
    },
  });

  // Return the sequelized Container model object
  return Container;
};
