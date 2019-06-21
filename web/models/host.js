// Host model
module.exports = (sequelize, DataTypes) => {
  // Define a new model for Host objects
  let Host = sequelize.define("Host", {
    // hostname cannot be null and must be unique
    hostname: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },

    // address cannot be null and must be unique
    address: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },

    // port cannot be null
    port: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    // heartbeat boolean option
    heartbeat: {
      type: DataTypes.BOOLEAN
    },

    // is_master boolean option
    is_master: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },

    // port cannot be null
    master_port: {
      type: DataTypes.INTEGER
    },

    // is_swarm_master boolean option
    is_swarm_master: {
      type: DataTypes.BOOLEAN
    },

    // swarm_token cannot be null and must be unique
    swarm_token: {
      type: DataTypes.STRING,
      unique: true
    },
  });

  // Return the sequelized Host model object
  return Host;
};
