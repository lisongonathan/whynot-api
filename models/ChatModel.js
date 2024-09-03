// models/AuthModel.js

const UserModel = require('./UserModel'); // Assurez-vous que Model est la classe de base que vous avez créée pour gérer les connexions à la base de données

class ChatModel extends UserModel {
  constructor() {
    super(); // Initialise la connexion à la base de données via la classe parente
  }
  
  async getUserChats(id) {
    const sql = `
      SELECT 
        c.id AS chat_id,
        u.id AS user_id,
        u.photo AS user_photo,
        u.name AS user_name,
        lm.last_message_date,
        lm.contenu AS msg_content
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

  async createChat(data) {
    const sql = 'INSERT INTO chat(src, dst) VALUES (?,?)';
    try {
      const user = await this.query(sql, data);
      return user;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ChatModel;
