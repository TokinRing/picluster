/*jshint esversion: 6 */
/*jshint strict:false */
/*jshint node: true */
'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(module.filename);
const env = process.env.NODE_ENV || 'production';
const config = JSON.parse(fs.readFileSync((process.env.PICLUSTER_CONFIG ? process.env.PICLUSTER_CONFIG : '../../config.json'), 'utf8'));

// Initialize models
let models = {};

// Models to include by module
let modules = [
  require('./user.js'),
  require('./config.js')
];

// Initialize sequelize connection
let sequelize = new Sequelize(config.db.database, config.db.username, config.db.password, {
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
Object.keys(models).forEach(function(modelName) {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Store instance and class
models.sequelize = sequelize;
models.Sequelize = Sequelize;

// Export object containting models
module.exports = models;
