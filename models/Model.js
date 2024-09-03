const db = require('./Database');

class Model {
  constructor() {
    this.db = db;
    this.sql = '';
    this.params = [];
  }

  // Méthode générique pour exécuter une requête SQL
  query(sql, params = []) {
    return new Promise((resolve, reject) => {

      this.db.query(sql, params, (err, results) => {
        if (err) {
          return reject({
            status: 500,
            msg: 'Erreur lors de l\'exécution de la requête',
            data: err
          });
        }

        resolve({
          status: 200,
          msg: 'Requête exécutée avec succès',
          data: results
        });
      });
    });
  }

}

module.exports = Model;