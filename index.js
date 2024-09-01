const express = require("express");
const app = express();
const http = require("http").Server(app);
const cors = require("cors");
const socketIO = require("socket.io")(http, {
  cors: {
    origin: "http://10.0.2.2:3000/", // Adresse de votre client Expo
  },
});
const fs = require('fs');
const path = require('path');
const { Storage } = require('megajs');

// Configuration de MEGA
const storage = new Storage({
  email: 'onyxkabanga@gmail.com',
  password: 'P@sse2mot'
});

const PORT = 4000;

function createUniqueId() {
  return Math.random().toString(20).substring(2, 10);
}

let chatgroups = [];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

socketIO.on("connection", (socket) => {
  console.log(`${socket.id} user is just connected`);

  socket.on('register', async (data) => {
    try {
      const { email, phone, pseudo, profilePicture } = data;
      const {fileType, fileId, base64, fileName} = profilePicture

      // Convertir URI vers Buffer
      const buffer = Buffer.from(base64, 'base64');
      const uploadDir = path.join(__dirname, 'uploads');
      const filePath = path.join(uploadDir, fileName);

      // Vérifier si le dossier 'uploads' existe, sinon le créer
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }

      // Sauvegarder temporairement le fichier localement
      fs.writeFile(filePath, buffer, async (err) => {
        if (err) {
          console.error('Erreur d\'écriture de fichier:', err);
          socket.emit('registerError', { message: 'Erreur lors de la sauvegarde de la photo de profil' });
        } else {
          console.log('Fichier sauvegardé temporairement');

          try {
            // Télécharger la photo sur MEGA
            const result = await uploadPhotoToMega(filePath, fileName);
            if (result) {
              console.log('Utilisateur enregistré avec succès');
              socket.emit('registerSuccess', { message: 'Utilisateur enregistré avec succès' });
              
            } else {
              console.error('Erreur lors du téléchargement sur MEGA');

            }
            
            // Supprimer le fichier temporaire après le téléchargement
            fs.unlinkSync(filePath);
          } catch (uploadError) {
            console.error('Erreur lors du téléchargement sur MEGA:', uploadError);
            socket.emit('registerError', { message: 'Erreur lors du téléchargement sur MEGA' });
          }
        }
      });
    } catch (err) {
      console.error('Erreur lors du traitement de l\'inscription:', err);
      socket.emit('registerError', { message: 'Erreur lors du traitement de l\'inscription' });
    }
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
});

app.get("/api", (req, res) => {
  res.json(chatgroups);
});

http.listen(PORT, () => {
  console.log(`Server is listening on ${PORT}`);
});

// Fonction pour télécharger la photo sur MEGA
async function uploadPhotoToMega(filePath, fileName) {
  return new Promise((resolve, reject) => {
    // Connexion à MEGA
    storage.on('ready', () => {
      console.log('Connexion à MEGA réussie.');

      // Lire le fichier local
      const readStream = fs.createReadStream(filePath);

      // Télécharger sur MEGA
      const megaFile = storage.upload({
        name: fileName,
        size: fs.statSync(filePath).size
      }, readStream);

      megaFile.on('complete', () => {
        console.log('Téléchargement complet sur MEGA:', fileName);
        resolve('Téléchargement réussi');
      });

      megaFile.on('error', (err) => {
        console.error('Erreur de téléchargement:', err);
        reject(err);
      });
    });

    storage.on('error', (err) => {
      reject(err);
    });
  });
}
