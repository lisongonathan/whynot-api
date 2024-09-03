// models/AuthModel.js

const Model = require('./Model'); // Assurez-vous que Model est la classe de base que vous avez créée pour gérer les connexions à la base de données

class AuthModel extends Model {
  constructor() {
    super(); // Initialise la connexion à la base de données via la classe parente
  }

  async registerUser(name, phone, email, photo) {
    const sql = 'INSERT INTO user(name, phone, e_mail, photo) VALUES (?, ?, ?, ?)';
    const params = [name, phone, email, photo];
    try {
      const result = await this.query(sql, params);
      return result.data.inserId;
    } catch (error) {
      throw error;
    }
  }

  async getUserByPhone(phone) {
    const sql = 'SELECT * FROM user WHERE phone = ?';
    try {
      const user = await this.query(sql, [phone]);
      return user;
    } catch (error) {
      throw error;
    }
  }

  async getUserByEmail(email) {
    const sql = 'SELECT * FROM user WHERE e_mail = ?';
    try {
      const user = await this.query(sql, [email]);
      return user;
    } catch (error) {
      throw error;
    }
  }

  async getRules() {
    const sql = 'SELECT rules FROM app'; // Assurez-vous que cette table existe et contient les règles
    try {
      const rules = await this.query(sql);
      return rules;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = AuthModel;
