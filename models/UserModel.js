// models/AuthModel.js

const AuthModel = require('./AuthModel'); // Assurez-vous que Model est la classe de base que vous avez créée pour gérer les connexions à la base de données

class UserModel extends AuthModel {
  constructor() {
    super(); // Initialise la connexion à la base de données via la classe parente
  }

  async getUserById(id) {
    const sql = 'SELECT * FROM user WHERE id = ?';
    try {
      const user = await this.query(sql, [id]);
      return user;
    } catch (error) {
      throw error;
    }
  }

  async getUsers() {
    const sql = 'SELECT * FROM user';
    try {
      const user = await this.query(sql, []);
      return user;
    } catch (error) {
      throw error;
    }
  }

}

module.exports = UserModel;
