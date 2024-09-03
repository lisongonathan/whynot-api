// models/index.js

const AuthModel = require('./AuthModel');
const UserModel = require('./UserModel');
const ChatModel = require('./ChatModel');

module.exports = {
  Auth : new AuthModel(),
  User : new UserModel(),
  Chat : new ChatModel()
};
