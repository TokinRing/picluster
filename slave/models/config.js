// Config model
module.exports = (sequelize, DataTypes) => {
  // Define a new model for Config objects
  let Config = sequelize.define("Config", {
    // Path to docker doesn't have to be specified to run
    dockerfile_path: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: false
    },

    // TLS state
    tls_enable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },

    // TLS self signed certificate state
    tls_self_signed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
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

    // Heartbeat interval value
    heartbeat_interval: {
      type: DataTypes.INTEGER,
    },

    // Request timeout interval value
    request_timeout: {
      type: DataTypes.INTEGER,
    },

    // Syslog selection
    syslog: {
      type: DataTypes.STRING,
    },

    // Theme value
    theme: {
      type: DataTypes.STRING,
    },

    // TODO: Add lib and use generate token function
    // Session secret used for user login cookies
    session_secret: {
      type: DataTypes.STRING
    }
  });

  // Return the sequelized Config model definition
  return Config;
};
