// models/index.js

const AuthModel = require('./AuthModel');
const UserModel = require('./UserModel');

module.exports = {
  Auth : new AuthModel(),
  User : new UserModel()
};
