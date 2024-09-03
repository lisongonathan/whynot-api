
const express = require("express");
const app = express();
const http = require("http").Server(app);
const socketIO = require("socket.io")(http);
const fs = require('fs');
const path = require('path');
const { Storage } = require('megajs');
const Model = require('./models');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // dossier de destination des fichiers téléchargés

// Servir les fichiers statiques du répertoire 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuration de MEGA
const storage = new Storage({
  email: 'onyxkabanga@gmail.com',
  password: 'P@sse2mot'
});

const PORT = 4000;

function createUniqueId() {
  return Math.random().toString(20).substring(2, 10);
}

const onlineUsers = []; // Tableau pour stocker les utilisateurs connectés
let chatgroups = [];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

socketIO.on("connection", (socket) => {
  Model.User.getUsers()
  .then(users => {
    socketIO.emit('allUsers', users)
  })
  .catch(err => {
    socketIO.emit('allUsers', err)
  });
  
  // Ajoute un nouvel utilisateur au tableau lorsqu'il se connecte
  socket.on('userConnected', (userData) => {
    const userExists = onlineUsers.some(user => user.id === userData.id); // Vérifie si l'utilisateur est déjà dans le tableau

    if (!userExists) {
      onlineUsers.push({ socketId: socket.id, ...userData });
      
      socketIO.emit('onlineUsers', onlineUsers); // Broadcast des utilisateurs en ligne
      
    } else {
      console.log(`L'utilisateur ${userData.id} est déjà connecté.`);
    }
  });

  // Traitement de l'inscription de l'utilisateur
  socket.on('register', async (data) => {
    console.log(data)
    Model.User.getUsers()
    .then(users => {
      socketIO.emit('allUsers', users)
    })
    .catch(err => {
      socketIO.emit('allUsers', err)
    });
    // try {
    //   const { email, phone, pseudo, profilePicture } = data;
    //   const { fileType, fileId, base64, fileName } = profilePicture;

    //   // Convertir URI vers Buffer
    //   const buffer = Buffer.from(base64, 'base64');
    //   const uploadDir = path.join(__dirname, 'uploads');
    //   const filePath = path.join(uploadDir, fileName);

    //   // Vérifier si le dossier 'uploads' existe, sinon le créer
    //   if (!fs.existsSync(uploadDir)) {
    //     fs.mkdirSync(uploadDir);
    //   }

    //   // Sauvegarder temporairement le fichier localement
    //   fs.writeFile(filePath, buffer, async (err) => {
    //     if (err) {
    //       console.error('Erreur d\'écriture de fichier:', err);
    //       socket.emit('registerError', { message: 'Erreur lors de la sauvegarde de la photo de profil' });
    //     } else {
    //       console.log('Fichier sauvegardé temporairement');

    //       // Vérifiez d'abord si le fichier existe et est prêt à être téléchargé
    //       fs.access(filePath, fs.constants.F_OK, (err) => {
    //         if (err) {
    //           console.error('Erreur: Fichier non trouvé ou inaccessible.');
    //           socket.emit('registerError', { message: 'Erreur: Fichier non trouvé ou inaccessible.' });
    //           return;
    //         }

    //         // Appel de la fonction d'upload
    //         uploadPhotoToMega(filePath, fileName, storage)
    //           .then((result) => {
    //             if (result) {
    //               console.log('Utilisateur enregistré avec succès');
    //               socket.emit('registerSuccess', { message: 'Utilisateur enregistré avec succès' });
    //             } else {
    //               console.error('Erreur lors du téléchargement sur MEGA');
    //               socket.emit('registerError', { message: 'Erreur lors du téléchargement sur MEGA' });
    //             }
    //           })
    //           .catch((error) => {
    //             console.error('Erreur lors du téléchargement sur MEGA:', error);
    //             socket.emit('registerError', { message: 'Erreur lors du téléchargement sur MEGA' });
    //           });
    //       });
    //     }
    //   });
    // } catch (err) {
    //   console.error('Erreur lors du traitement de l\'inscription:', err);
    //   socket.emit('registerError', { message: 'Erreur lors du traitement de l\'inscription' });
    // }
  });

  socket.on("getAllGroups", () => {
    socket.emit("groupList", chatgroups);
  });

  socket.on("createNewGroup", (currentGroupName) => {
    console.log(currentGroupName);
    chatgroups.unshift({
      id: chatgroups.length + 1,
      currentGroupName,
      messages: [],
    });
    socket.emit("groupList", chatgroups);
  });

  socket.on("findGroup", (id) => {
    const filteredGroup = chatgroups.filter((item) => item.id === id);
    socket.emit("foundGroup", filteredGroup[0].messages);
  });

  socket.on("newChatMessage", (data) => {
    const { currentChatMesage, groupIdentifier, currentUser, timeData } = data;
    const filteredGroup = chatgroups.filter(
      (item) => item.id === groupIdentifier
    );
    const newMessage = {
      id: createUniqueId(),
      text: currentChatMesage,
      currentUser,
      time: `${timeData.hr}:${timeData.mins}`,
    };

    socket
      .to(filteredGroup[0].currentGroupName)
      .emit("groupMessage", newMessage);
    filteredGroup[0].messages.push(newMessage);
    socket.emit("groupList", chatgroups);
    socket.emit("foundGroup", filteredGroup[0].messages);
  });

  // Retire l'utilisateur du tableau lorsqu'il se déconnecte
  socket.on('disconnect', () => {
    const userIndex = onlineUsers.findIndex(user => user.socketId === socket.id);
    if (userIndex !== -1) {
      onlineUsers.splice(userIndex, 1);
      socketIO.emit('onlineUsers', onlineUsers); // Broadcast des utilisateurs en ligne
    }
  });
});

app.get("/", (req, res) => {
  Model.Auth.getRules()
  .then(e => {
    if(e.status == 200){

      const data = e.data

      data.map(result => {
        const homePageHtml = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
            <title>Accueil</title>
          </head>
          <body class="d-flex justify-content-center align-items-center vh-100 bg-light">
            <div class="container text-center">
              <h1>Règlement de l'application</h1>
              <p>Bienvenue dans notre application. Veuillez lire attentivement les règles avant de continuer.</p>
              <p>${result.rules}</p>
              <div class="mt-4">
                <a href="/register" class="btn btn-primary">
                  <i class="fas fa-user-plus"></i> S'inscrire
                </a>
                <a href="/login" class="btn btn-secondary">
                  <i class="fas fa-sign-in-alt"></i> Se connecter
                </a>
              </div>
            </div>
            <script src="https://kit.fontawesome.com/a076d05399.js" crossorigin="anonymous"></script>
          </body>
          </html>
        `;
        return res.send(homePageHtml);
      })

    } else {
      console.log(e.msg)
    }
  })
  .catch(console.log)
});

app.get("/register", (req, res) => {
  // Créer un formulaire HTML statique pour la saisie des informations de l'utilisateur
  const formHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Inscription</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
      <style>
        body {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background-color: #f8f9fa;
        }
        .container {
          max-width: 500px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2 class="mb-4">Inscription</h2>
        <form action="/register" method="POST" enctype="multipart/form-data">
          <div class="mb-3">
            <label for="name" class="form-label">Nom</label>
            <input type="text" class="form-control" id="name" name="name" required>
          </div>
          <div class="mb-3">
            <label for="phone" class="form-label">Numéro de téléphone</label>
            <input type="tel" class="form-control" id="phone" name="phone" required>
          </div>
          <div class="mb-3">
            <label for="email" class="form-label">Email</label>
            <input type="email" class="form-control" id="email" name="email" required>
          </div>
          <div class="mb-3">
            <label for="profilePicture" class="form-label">Photo de profil</label>
            <input type="file" class="form-control" id="profilePicture" name="profilePicture" accept="image/*" required>
          </div>
          <button type="submit" class="btn btn-primary">S'inscrire</button>
          <a href="/" class="btn btn-secondary">Retour</a>  <!-- Bouton pour revenir en arrière -->
        </form>
      </div>
    </body>
    </html>
  `;

  // Envoyer le formulaire HTML au client
  res.send(formHtml);
});

app.post("/register", upload.single('profilePicture'), (req, res) => {
  console.log(req.body);

  // Extraire les données du formulaire et le fichier téléchargé
  const { name, phone, email } = req.body;
  const profilePicture = req.file;
  
  if (!profilePicture) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
        <title>Erreur d'inscription</title>
      </head>
      <body class="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div class="container text-center">
          <div class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-circle"></i> Erreur: Aucun fichier téléchargé.
          </div>
          <a href="/register" class="btn btn-primary">
            <i class="fas fa-arrow-left"></i> Retour au formulaire
          </a>
        </div>
        <script src="https://kit.fontawesome.com/a076d05399.js" crossorigin="anonymous"></script>
      </body>
      </html>
    `);
  }

  // Détails du fichier téléchargé
  const { originalname, filename, path: tempPath, destination } = profilePicture;
  
  // Nouveau chemin où le fichier sera déplacé et renommé
  const newFilePath = path.join(destination, originalname);

  // Déplacer le fichier vers son emplacement final avec le nom d'origine
  fs.rename(tempPath, newFilePath, (err) => {
    if (err) {
      console.error('Erreur lors du déplacement du fichier:', err);
      return res.status(500).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
          <title>Erreur d'inscription</title>
        </head>
        <body class="d-flex justify-content-center align-items-center vh-100 bg-light">
          <div class="container text-center">
            <div class="alert alert-danger" role="alert">
              <i class="fas fa-exclamation-circle"></i> Erreur lors de l'enregistrement de la photo de profil.
            </div>
            <a href="/register" class="btn btn-primary">
              <i class="fas fa-arrow-left"></i> Retour au formulaire
            </a>
          </div>
          <script src="https://kit.fontawesome.com/a076d05399.js" crossorigin="anonymous"></script>
        </body>
        </html>
      `);
    }

    console.log('Fichier téléchargé et déplacé avec succès');

  // Vérifier si le numéro de téléphone existe déjà
  Model.Auth.getUserByPhone(phone)
    .then(user => {
      console.log(user)
      if (user.data == true) {
        // Numéro de téléphone déjà existant
        res.status(400).send(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <title>Erreur d'inscription</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
              body {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                background-color: #f8f9fa;
              }
              .container {
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="alert alert-danger text-center" role="alert">
                <h4 class="alert-heading">Erreur!</h4>
                <p>Le numéro de téléphone existe déjà. Veuillez essayer un autre numéro.</p>
                <a href="/register" class="btn btn-danger mt-4">Retour à l'inscription</a>
              </div>
            </div>
          </body>
          </html>
        `);
      } else {
        // Continuer avec l'inscription si le numéro n'existe pas
        const { originalname } = profilePicture;

        // Enregistrer l'utilisateur dans la base de données
        // Appeler la méthode registerUser pour enregistrer les informations dans la base de données
        Model.Auth.registerUser(name, phone, email, originalname)
        .then(result => {
          res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
              <title>Inscription réussie</title>
            </head>
            <body class="d-flex justify-content-center align-items-center vh-100 bg-light">
              <div class="container text-center">
                <div class="alert alert-success" role="alert">
                  <i class="fas fa-check-circle"></i> Utilisateur enregistré avec succès !
                </div>
                <a href="/register" class="btn btn-primary">
                  <i class="fas fa-arrow-left"></i> Retour au formulaire
                </a>
              </div>
              <script src="https://kit.fontawesome.com/a076d05399.js" crossorigin="anonymous"></script>
              <script src="/socket.io/socket.io.js"></script>
              <script>
                const socket = io();
                socket.emit('register', [${result}])
              </script>
            </body>
            </html>
          `);
        })
        .catch(err => {
          console.error("Erreur lors de l'ajout de l'utilisateur :", err);
          res.status(500).send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
              <title>Erreur d'inscription</title>
            </head>
            <body class="d-flex justify-content-center align-items-center vh-100 bg-light">
              <div class="container text-center">
                <div class="alert alert-danger" role="alert">
                  <i class="fas fa-exclamation-circle"></i> Erreur lors de l'inscription de l'utilisateur.
                </div>
                <a href="/register" class="btn btn-primary">
                  <i class="fas fa-arrow-left"></i> Retour au formulaire
                </a>
              </div>
              <script src="https://kit.fontawesome.com/a076d05399.js" crossorigin="anonymous"></script>
            </body>
            </html>
          `);
        });
      }
    })
    .catch(err => {
      console.error("Erreur lors de la vérification du numéro de téléphone :", err);
      res.status(500).send('<p>Erreur lors de la vérification du numéro de téléphone. Veuillez réessayer.</p>');
    });
  });
});

app.get("/login", (req, res) => {
  const loginFormHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Connexion</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
      <style>
        body {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background-color: #f8f9fa;
        }
        .container {
          max-width: 400px;
        }
      </style>
    </head>
    <body>
      <div class="container text-center">
        <h2 class="mb-4">Connexion</h2>
        <form action="/login" method="POST">
          <div class="mb-3">
            <label for="phone" class="form-label">Numéro de téléphone</label>
            <input type="tel" class="form-control" id="phone" name="phone" required>
          </div>
          <button type="submit" class="btn btn-primary">Se connecter</button>
          <a href="/" class="btn btn-secondary">Retour</a>  <!-- Bouton pour revenir en arrière -->
        </form>
      </div>
    </body>
    </html>
  `;

  res.send(loginFormHtml);
});

app.post("/login", (req, res) => {
  const { phone } = req.body;
  Model.Auth.getUserByPhone(phone)
    .then(user => {
      if (user.status == 200) {
        // Rediriger vers la page d'accueil avec les données utilisateur dans les paramètres de requête
        res.redirect(`/home?photo=/uploads/${encodeURIComponent(user.data[0].photo)}&name=${encodeURIComponent(user.data[0].name)}&phone=${encodeURIComponent(user.data[0].phone)}&id=${encodeURIComponent(user.data[0].id)}`);
      
      } else {
        res.status(401).send(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
            <title>Erreur de connexion</title>
          </head>
          <body class="d-flex justify-content-center align-items-center vh-100 bg-light">
            <div class="container text-center">
              <div class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-circle"></i> Erreur : Téléphone non trouvé ou incorrect.
              </div>
              <a href="/login" class="btn btn-secondary">
                <i class="fas fa-arrow-left"></i> Retour au formulaire de connexion
              </a>
            </div>
            <script src="https://kit.fontawesome.com/a076d05399.js" crossorigin="anonymous"></script>
          </body>
          </html>
        `);
      }
    })
    .catch(err => {
      console.error("Erreur lors de la connexion de l'utilisateur :", err);
      res.status(500).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
          <title>Erreur de serveur</title>
        </head>
        <body class="d-flex justify-content-center align-items-center vh-100 bg-light">
          <div class="container text-center">
            <div class="alert alert-danger" role="alert">
              <i class="fas fa-exclamation-circle"></i> Erreur interne du serveur. Veuillez réessayer plus tard.
            </div>
            <a href="/login" class="btn btn-secondary">
              <i class="fas fa-arrow-left"></i> Retour au formulaire de connexion
            </a>
          </div>
          <script src="https://kit.fontawesome.com/a076d05399.js" crossorigin="anonymous"></script>
        </body>
        </html>
      `);
    });
});

app.get("/home", (req, res) => {
  // Récupère les données utilisateur depuis les paramètres de requête
  const { id } = req.query;

  // Vérifier si le numéro de téléphone existe déjà
  Model.User.getUserById(id)
    .then(user => {
      if (user.status != 200) {
        // Numéro de téléphone déjà existant
        res.status(400).send(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <title>Erreur de connexion</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
              body {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                background-color: #f8f9fa;
              }
              .container {
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="alert alert-danger text-center" role="alert">
                <h4 class="alert-heading">Erreur!</h4>
                <p>Cette utilisateur n'exte pas. Veuillez vous inscrire.</p>
                <a href="/login" class="btn btn-danger mt-4">Retour à la connexion</a>
              </div>
            </div>
          </body>
          </html>
        `);
      } else {
        // Continuer avec l'inscription si le numéro n'existe pas
        const { photo, phone, name, nick_name, e_mail, about, amount  } = user.data[0];

        const receptionPageHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
          <title>Boîte de réception</title>
          <style>
            .container-fluid {
              height: 1500vh;
            }
            .sidebar {
              background-color: #f8f9fa;
              height: 100%;
            }
            .chat-list {
              overflow-y: auto;
              height: 100%;
            }
            .chat-item {
              cursor: pointer;
              padding: 10px;
              border-bottom: 1px solid #e9ecef;
              transition: background-color 0.2s ease;
            }
            .chat-item:hover {
              background-color: #e9ecef;
            }
            .chat-item img {
              object-fit: cover;
            }
          </style>
        </head>
        <body>
          <div class="container-fluid">
            <div class="row">
              <!-- Sidebar -->
              <div class="col-md-3 sidebar">
                <!-- Section Profil Utilisateur -->
                <div class="p-3">
                  <div class="d-flex flex-column align-items-center">
                    <h2 class="mb-4">Bienvenue, ${name}</h2>
                    <img src="/uploads/${photo}" alt="Photo de profil" class="rounded-circle mb-3" style="width: 100px; height: 100px;">
                      <a href="/" class="col-lg-5 btn btn-danger">Déconnexion</a>
                    <p><strong>Nom:</strong> ${name}</p>
                    <p><strong>Pseudo:</strong> ${nick_name ? nick_name : '___'}</p>
                    <p><strong>Email:</strong> ${e_mail}</p>
                    <p><strong>Téléphone:</strong> ${phone}</p>
                    <p><strong>À propos:</strong> ${about ? about : '___'}</p>
                    <p><strong>Montant:</strong> ${amount} CDF</p>
                    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#createChatModal">Créer un chat</button>
                    
                  </div>
                </div>

                <!-- Section Utilisateurs en Ligne -->
                <div class="p-3">
                  <h6>Utilisateurs en ligne</h6>
                  <ul class="list-group" id="online-users">
                    <!-- Liste dynamique des utilisateurs en ligne -->
                  </ul>
                </div>
              </div>

              <!-- Liste des derniers chats -->
              <div class="col-md-9 chat-list">
                <!-- Liste des conversations récentes -->
                <div id="chat-list">
                  <!-- Les items de chat seront ajoutés dynamiquement ici -->
                </div>
              </div>
            </div>
          </div>

          <!-- Modal pour créer un nouveau chat -->
          <div class="modal fade" id="createChatModal" tabindex="-1" aria-labelledby="createChatModalLabel" aria-hidden="true">
            <div class="modal-dialog">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title" id="createChatModalLabel">Créer un nouveau chat</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                  <form id="create-chat-form">
                    <div class="mb-3">
                      <label for="recipient" class="form-label">Choisir un utilisateur</label>
                      <select class="form-select" id="recipient" required>
                        <!-- Options des utilisateurs enregistrés dans la base de données -->
                      </select>
                    </div>
                    <button type="submit" class="btn btn-primary">Créer</button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.6/dist/umd/popper.min.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.min.js"></script>
          <script src="/socket.io/socket.io.js"></script>
          <script>
            const socket = io();
            // Fonction pour charger les utilisateurs en ligne
            function loadOnlineUsers() {
              socket.on('onlineUsers', (users) => {
                const onlineUsersList = document.getElementById('online-users');
                onlineUsersList.innerHTML = ''; // Vide la liste actuelle

                users.forEach(user => {
                  const userItem = document.createElement('li');
                  userItem.classList.add('list-group-item', 'd-flex', 'align-items-center');

                  // Ajouter la photo de profil
                  const userPhoto = document.createElement('img');
                  userPhoto.src = user.photo;
                  userPhoto.alt = user.name;
                  userPhoto.classList.add('rounded-circle', 'mr-2');
                  userPhoto.style.width = '60px';
                  userPhoto.style.height = '60px';
                  userItem.appendChild(userPhoto);

                  const userInfo = document.createElement('div');
                  userInfo.classList.add('mx-1');

                  // Ajouter le nom de l'utilisateur
                  const userName = document.createElement('h6');
                  userName.textContent = user.name;
                  userName.classList.add('mr-2');
                  userInfo.appendChild(userName);

                  // Ajouter le numéro de téléphone
                  const userPhone = document.createElement('p');
                  userPhone.textContent = user.phone;
                  userPhone.classList.add('mr-2', 'text-muted');
                  userInfo.appendChild(userPhone);

                  userItem.appendChild(userInfo);

                  onlineUsersList.appendChild(userItem);
                });
              });
            }

            // Charger les utilisateurs en ligne à la connexion
            const user = {
              id: new URLSearchParams(window.location.search).get('id'),
              name: new URLSearchParams(window.location.search).get('name'),
              phone: new URLSearchParams(window.location.search).get('phone'),
              photo: new URLSearchParams(window.location.search).get('photo')
            }
            socket.emit('userConnected', user); // Remplacez par les données utilisateur appropriées
            loadOnlineUsers();

            // Fonction pour remplir la liste des utilisateurs dans le modal
            function fillRecipientList() {
              socket.on('allUsers', users => {
                if(users.status == 200) {
                  const recipientSelect = document.getElementById('recipient');
                  recipientSelect.innerHTML = ''; // Vide la liste actuelle

                  users.data.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.id;
                    option.textContent = ' ' + user.name + '  (' + user.phone + ')';
                    recipientSelect.appendChild(option);
                  });

                } else {
                  alert(users.msg)
                }
              
              })
            }

            // Remplir la liste des utilisateurs dans le modal
            fillRecipientList();

            // Gestion de la création d'un nouveau chat
            document.getElementById('create-chat-form').addEventListener('submit', (event) => {
              event.preventDefault();
              const recipientId = document.getElementById('recipient').value;
              // Émettre un événement pour créer un nouveau chat
              socket.emit('createChat', { dst : recipientId, src : ${id} });
            });

            // Remplir la liste des chats récents
            function loadRecentChats() {
              // Vous pouvez remplacer par une requête API ou websocket pour charger les derniers chats
              const chatList = document.getElementById('chat-list');
              chatList.innerHTML = ''; // Vider la liste actuelle

              // Exemple statique, à remplacer par des données dynamiques
              const exampleChat = document.createElement('div');
              exampleChat.classList.add('chat-item');
              exampleChat.textContent = "WayNot";
              chatList.appendChild(exampleChat);
            }

            loadRecentChats();
          </script>
        </body>
        </html>
        `
    
      res.status(200).send(receptionPageHtml);
      }
    })
    .catch(err => {
      console.error("Erreur lors de la vérification du numéro de téléphone :", err);
      res.status(500).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
          <title>Erreur d'inscription</title>
        </head>
        <body class="d-flex justify-content-center align-items-center vh-100 bg-light">
          <div class="container text-center">
            <div class="alert alert-danger" role="alert">
              <i class="fas fa-exclamation-circle"></i> Erreur lors de l'inscription de l'utilisateur.
            </div>
            <a href="/register" class="btn btn-primary">
              <i class="fas fa-arrow-left"></i> Retour au formulaire
            </a>
          </div>
          <script src="https://kit.fontawesome.com/a076d05399.js" crossorigin="anonymous"></script>
        </body>
        </html>
      `);
    });
});

app.get("/api", (req, res) => {
  res.json(chatgroups);
});
app.get("/users", (req, res) => {
  res.json(onlineUsers);
});

http.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

// Fonction pour uploader une photo sur MEGA
async function uploadPhotoToMega(filePath, fileName, storage) {
  console.log(`Fichier : ${fileName}`, `Chemin : ${filePath}`);
  return new Promise((resolve, reject) => {
    // Connexion à MEGA
    storage.on('ready', () => {
      // Lecture du fichier local
      const readStream = fs.createReadStream(filePath);

      // Uploading sur MEGA
      const megaFile = storage.upload(
        {
          name: fileName,
          size: fs.statSync(filePath).size
        },
        readStream,
        (err) => {
          if (err) {
            return reject(err);  // Si une erreur survient, rejetez la promesse
          }
          resolve('Upload successful');  // Sinon, résolvez la promesse
        }
      );

      megaFile.on('complete', () => {
        console.log('Upload complete:', fileName);
      });
    });

    storage.on('error', (err) => {
      reject(err);  // Gestion des erreurs de connexion à MEGA
    });
  });
}
