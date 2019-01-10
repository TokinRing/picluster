/*jshint esversion: 6 */
const path = require('path');
const is_authenticated = require('../config/middleware/is_authenticated');

module.exports = (app) => {
  app.get('/', (req, res) => {
    // If user has account send to admin page
    if (req.user) {
      res.redirect("/admin");
    }
    res.sendFile(path.join(__dirname, '../signup.html'));
  });

  app.get('/login', (req, res) => {
    // If user has account send to admin page
    if (req.user) {
      res.redirect("/admin");
    }
    res.sendFile(path.join(__dirname, '../login.html'));
  });

  app.get('/admin', is_authenticated, (req,res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
  });
};
