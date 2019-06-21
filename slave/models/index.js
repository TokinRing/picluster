const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const config = JSON.parse(fs.readFileSync((process.env.PICLUSTER_CONFIG ? process.env.PICLUSTER_CONFIG : path.join(__dirname, "../../config.json")), "utf8"));

// Initialize models
let models = {};

// Models to include by module
let modules = [
  require("./config.js"),
  require("./container.js"),
  require("./host.js")
];

// Initialize sequelize instance as sqlite or mysql/postgresql
const sequelize = (config.db.dialect == "sqlite") ?
  new Sequelize("sqlite:" + config.db.storage)
  :
  new Sequelize(config.db.database, config.db.username, config.db.password, {
    host: config.db.host,
    dialect: config.db.dialect,
    operatorsAliases: false,
  });

// Sequelize each of the model modules
modules.forEach((module) => {
  let model = module(sequelize, Sequelize, config);
  models[model.name] = model;
});

// Initialize model object relation mapping
Object.keys(models).forEach((model_name) => {
  if (models[model_name].associate) {
    models[model_name].associate(models);
  }
});

models["Host"].hasMany(models["Container"], {foreignKey: "container_id", constraints: false});
models["Host"].belongsToMany(models["Container"], {foreignKey: "container_id", through:"host_container", constraints: false});
models["Container"].hasMany(models["Host"], {foreignKey: "host_id", constraints: false});
models["Container"].belongsToMany(models["Host"], {foreignKey: "host_id", through:"host_container", constraints: false});

// Store instance and class
models.sequelize = sequelize;
models.Sequelize = Sequelize;

// Export object containting models
module.exports = models;
