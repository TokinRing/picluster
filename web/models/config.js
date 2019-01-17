/*jshint esversion:6*/
// Config model
module.exports = (sequelize, DataTypes) => {
  // Define a new model for Config objects
  let Config = sequelize.define("Config", {
    // Path to docker doesn't have to be specified to run
    dockerfile_path: {
      type: DataTypes.STRING("../docker"),
      allowNull: true,
      unique: false
    },

    // TLS state
    tls_enable: {
      type: DataTypes.BOOLEAN(0)
    },

    // TLS self signed certificate state
    tls_self_signed: {
      type: DataTypes.BOOLEAN(0)
    },

    // TLS certificate path
    tls_cert_path: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: false
    },

    // TLS key path
    tls_key_path: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: false
    },

    // Heartbeat state
    heartbeat: {
      type: DataTypes.BOOLEAN
    },

    // Heartbeat interval value
    heartbeat_interval: {
      type: DataTypes.INTEGER(10000)
    },

    // Syslog selection
    syslog: {
      type: DataTypes.STRING("dmesg")
    },

    // Master IP Address
    // TODO: Make IP detection function and add to lib
    master_address: {
      type: DataTypes.STRING
    },

    // Master port
    master_port: {
      type: DataTypes.INTEGER(3003)
    },

    // Theme value
    theme: {
      type: DataTypes.STRING("default")
    },

    // TODO: Add lib and use generate token function
    // Session secret used for user login cookies
    session_secret: {
      type: DataTypes.STRING
    }
  });

  // Return the sequelized Config object
  return Config;
};
