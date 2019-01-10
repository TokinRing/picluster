/*jshint esversion: 6 */
/*jshint strict:false */
'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(module.filename);
//const env = process.env.NODE_ENV || 'production';
const config = JSON.parse(fs.readFileSync((process.env.PICLUSTER_CONFIG ? process.env.PICLUSTER_CONFIG : '../../config.json'), 'utf8'));

// Initialize models
let models = {};

// Models to include by module
let modules = [
  require('./user.js')
];

function getModels(config, force = false) {
  // Initialize sequelize DataType
  let sequelize = new Sequelize(config.db.database, config.db.username, config.db.password, {config.db.host, config.db.dialect});

  // Sequelize each of the model modules
  modules.forEach((module) => {
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
  getModels
};
