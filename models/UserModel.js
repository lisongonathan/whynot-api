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

  async getUserChats(id) {
    const sql = `
      SELECT 
        c.id AS chat_id,
        u.id AS interlocutor_id,
        u.photo AS interlocutor_photo,
        u.name AS interlocutor_name,
        lm.last_message_date,
        lm.contenu AS last_message_content
      FROM chat AS c
      JOIN user AS u ON (u.id = CASE 
                            WHEN c.src = ? THEN c.dst 
                            ELSE c.src 
                          END)
      LEFT JOIN (
        SELECT 
          m.id_chat,
          m.contenu,
          lm.last_message_date
        FROM message AS m
        JOIN (
          SELECT 
            id_chat,
            MAX(created_at) AS last_message_date
          FROM message
          GROUP BY id_chat
        ) AS lm ON m.id_chat = lm.id_chat 
      ) lm ON c.id = lm.id_chat
      WHERE c.src = ? OR c.dst = ?
      ORDER BY lm.last_message_date DESC
    `;
    try {
      const user = await this.query(sql, [id, id, id]);
      return user;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserModel;
