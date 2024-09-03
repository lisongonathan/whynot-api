const mysql = require('mysql2');

let instance = null;

class Database {
  constructor() {
    if (!instance) {
      this.db = mysql.createConnection({
        host: 'mysql-whynot.alwaysdata.net',
        user: 'whynot_bdd',
        password: 'mot2p@sse',
        database: 'whynot_chat',
      });

      this.db.connect((err) => {
        if (err) {
          console.error('Erreur de connexion à la base de données :', err.stack);
          return;
        }
        console.log('Connecté à la base de données MySQL en tant que ID ' + this.db.threadId);
      });

      instance = this;
    }

    return instance;
  }

  getDb() {
    return this.db;
  }
}

module.exports = new Database().getDb();
