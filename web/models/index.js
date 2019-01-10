'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(module.filename);
const env = process.env.NODE_ENV || 'production';
const config = require(__dirname + '/../../config.json')[env];

// Initialize models
let models = {};

// Models to include by module
let modules = [
  require('./user.js')
];

function getModels(config, force = false) {
  // Initialize sequelize instance by env variables or defaults
  if (config.use_env_variable) {
    let sequelize = new Sequelize(process.env[config.use_env_variable]);
  } else {
    let sequelize = new Sequelize(config.database, config.username, config.password, config);
  }

  // Sequelize each of the model modules
  modules.forEach(module) {
    let model = module(sequelize, Sequelize, config);
    models[model.name] = model;
  });

  // Initialize model object relation mapping
  Object.keys(models).forEach(function(modelName) {
    if (models[modelName].associate) {
      models[modelName].associate(models);
    }
  });

  // Store instance and DataType
  models.sequelize = sequelize;
  models.Sequelize = Sequelize;

  // Return object of all sequelized models
  return models
}


module.exports = {
  getModels();
}
