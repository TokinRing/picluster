/*jshint esversion:6*/
const ip = require('ip');
// Config model
module.exports = (sequelize, DataTypes) => {
  // Define a new model for Config objects
  let Config = sequelize.define("Config", {
    // Path to docker doesn't have to be specified to run
    dockerfile_path: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "../docker",
      unique: false
    },

    // TLS state
    tls_enable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },

    // TLS self signed certificate state
    tls_self_signed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },

    // TLS certificate path
    tls_cert_path: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
      unique: false
    },

    // TLS key path
    tls_key_path: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
      unique: false
    },

    // Heartbeat state
    heartbeat: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },

    // Heartbeat interval value
    heartbeat_interval: {
      type: DataTypes.INTEGER,
      defaultValue: 10000,
    },

    // Syslog selection
    syslog: {
      type: DataTypes.STRING,
      defaultValue: "dmesg",
    },

    // Master IP Address
    master_address: {
      type: DataTypes.STRING,
      defaultValue: ip.address(),
    },

    // Master port
    // TODO: validate integer
    master_port: {
      type: DataTypes.INTEGER,
      defaultValue: 3003,
    },

    // Theme value
    theme: {
      type: DataTypes.STRING,
      defaultValue: "default",
    },

    // TODO: Add lib and use generate token function
    // Session secret used for user login cookies
    session_secret: {
      type: DataTypes.STRING
    }
  });

  // Return the sequelized Config model object
  return Config;
};
