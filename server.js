const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path'); 
const nodemailer = require('nodemailer');

// Initialisation de l'application Express
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware pour servir les fichiers statiques (CSS, JS, Images)
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Configuration de la base de données
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', 
  database: 'barbershop',
  port: 33 
});
// Connexion à la base de données
db.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données:', err);
  } else {
    console.log('Connecté à la base de données MySQL.');
  }
});

// Nodemailer transporter setup (you may need to adjust these settings based on your email service)
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can use another service if needed
  auth: {
    user: 'lamriniimane123@gmail.com', // Replace with your email
    pass: 'bozcrpawiytygugx'  // Replace with your email password 
  }
});

// Route par défaut

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');  // Affiche le formulaire de réservation

});

// Route pour la page de réservation
app.get('/reservation.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'reservation.html'));
  });
  


// Route pour traiter la soumission du formulaire de reservation et insérer les données dans la base de données
app.post('/appointments', (req, res) => {
    const { name, phone, email, date_time } = req.body;
  
    // Vérifier si la date/heure est déjà réservée
    const checkQuery = 'SELECT * FROM appointments WHERE date_time = ?';
    db.query(checkQuery, [date_time], (err, result) => {
      if (err) {
        console.error('Erreur lors de la vérification de la date:', err);
        return res.status(500).send('Erreur du serveur');
      }
  
      if (result.length > 0) {
        // Si une réservation existe déjà pour cette date/heure
        return res.status(400).send('Cette date et heure sont déjà réservées. Veuillez en choisir une autre.');
      }
  
      // Si la date/heure est libre, ajouter la nouvelle réservation
      const insertQuery = 'INSERT INTO appointments (name, phone, email, date_time, status) VALUES (?, ?, ?, ?, "in progress")';
      db.query(insertQuery, [name, phone, email, date_time], (err, result) => {
        if (err) {
          console.error('Erreur lors de l\'insertion du rendez-vous:', err);
          return res.status(500).send('Erreur du serveur');
        }
        res.send('Rendez-vous ajouté avec succès !');
      });
    });
  });
  
// Route pour récupérer les dates réservées
app.get('/get-booked-dates', (req, res) => {
    const query = 'SELECT date_time FROM appointments WHERE status = "in progress"';
    db.query(query, (err, result) => {
      if (err) {
        console.error('Erreur lors de la récupération des dates réservées:', err);
        return res.status(500).send('Erreur du serveur');
      }
      // Renvoie les dates réservées au format JSON
      res.json(result);
    });
  });

 // Route pour traiter le formulaire de connexion de Barber à son espace
app.post('/loginBarber', (req, res) => {
  const { EMAIL, pwd } = req.body;

  const query = 'SELECT * FROM barber WHERE email = ? AND pwd = ?';
  db.query(query, [EMAIL, pwd], (err, result) => {
      if (err) {
          console.error('Erreur lors de la connexion:', err);
          return res.status(500).send('Erreur du serveur.');
      }

      if (result.length > 0) {
          // Si connexion réussie, récupérer les rendez-vous
          const appointmentsQuery = 'SELECT * FROM appointments';
          db.query(appointmentsQuery, (err, appointments) => {
              if (err) {
                  console.error('Erreur lors de la récupération des rendez-vous:', err);
                  return res.status(500).send('Erreur du serveur.');
              }

              res.sendFile(path.join(__dirname, 'espaceBarber.html'), {
                  headers: {
                      'Content-Type': 'text/html'
                  }
              }, (err) => {
                  if (err) {
                      console.error('Erreur lors de l\'envoi de la page HTML:', err);
                      return res.status(500).send('Erreur du serveur.');
                  }
              });
          });
      } else {
          res.status(401).send('Email ou mot de passe incorrect.');
      }
  });
});

// Route pour récupérer tous les rendez-vous
app.get('/all-reservations', (req, res) => {
  const query = 'SELECT * FROM appointments'; // Récupérer toutes les informations de la table appointments
  db.query(query, (err, result) => {
    if (err) {
      console.error('Erreur lors de la récupération des rendez-vous:', err);
      return res.status(500).send('Erreur du serveur');
    }
    res.json(result);
  });
});

// Update appointment status (accept or deny) and send email to client
app.post('/updateStatus', (req, res) => {
  const { appointmentId, status } = req.body;

  const statusQuery = 'UPDATE appointments SET status = ? WHERE id = ?';
  db.query(statusQuery, [status, appointmentId], (err, result) => {
    if (err) {
      console.error('Error updating status:', err);
      return res.status(500).send('Server error');
    }

    // Get the client's email to send notification
    const getEmailQuery = 'SELECT email, name FROM appointments WHERE id = ?';
    db.query(getEmailQuery, [appointmentId], (err, result) => {
      if (err || result.length === 0) {
        console.error('Error fetching email:', err);
        return res.status(500).send('Server error');
      }

      const { email, name } = result[0];
      const subject = status === 'accepted' ? 'Appointment Accepted' : 'Appointment Denied';
      const message = status === 'accepted' ? `Hello ${name}, your appointment has been accepted.` : `Hello ${name}, your appointment has been denied.`;

      // Send email to the client
      const mailOptions = {
        from: 'lamriniimane123@gmail.com',
        to: email,
        subject: subject,
        text: message
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error('Error sending email:', err);
          return res.status(500).send('Email error');
        }
        console.log('Email sent: ' + info.response);
        res.send('Status updated and email sent');
      });
    });
  });
});




// Démarrage du serveur
app.listen(3001, () => {
  console.log('Serveur démarré sur http://localhost:3001');
});
