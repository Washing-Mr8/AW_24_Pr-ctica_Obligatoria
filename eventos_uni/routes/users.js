var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../database');

// Número de rondas para el hashing de contraseñas
const SALT_ROUNDS = 10;

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});



/* GET registro page. */
router.get('/register', function(req, res, next) {
  pool.query('SELECT * from Facultades',(err,result)=>{
    if(err) throw err;
    res.render('registro', {facultades: result});
  });
});

/* POST para registrar un usuario */
router.post('/register', function (req, res) {
  const { Nombre, Correo, Password, Telefono, Facultad, Rol } = req.body;

  // Verificar si el correo ya está registrado
  pool.query('SELECT ID FROM usuarios WHERE Correo = ?', [Correo], (err, user) => {
      if (err) throw err;

      if (user.length > 0) {
          return res.status(400).json({ mensaje: 'El correo ya está registrado.' });
      }

      // Hashear la contraseña
      bcrypt.hash(Password, SALT_ROUNDS, (err, hashedPassword) => {
          if (err) throw err;

          // Insertar nuevo usuario
          const newUser = [Nombre, Correo, hashedPassword, Telefono, Facultad, Rol];
          pool.query('INSERT INTO usuarios(ID,Nombre,Correo,Password,Telefono,Facultad,Rol) VALUES (?,?,?,?,?,?,?)', newUser, (err) => {
              if (err) throw err;
              res.json({ mensaje: 'Usuario registrado con éxito.' });
              res.redirect("/login")
          });
      });
  });
});


/* GET Login page. */
router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Express' });
});

/* POST para iniciar sesion*/

router.post('/login', function (req, res) {
  const { Correo, Password } = req.body;

  // Verificar si el correo existe
  pool.query('SELECT * FROM usuarios WHERE Correo = ?', [Correo], (err, user) => {
      if (err) throw err;

      if (user.length === 0) {
          return res.status(401).json({ mensaje: 'Credenciales incorrectas.' });
      }

      const usuario = user[0];

      // Comparar la contraseña
      bcrypt.compare(Password, usuario.Password, (err, result) => {
          if (err) throw err;

          if (!result) {
              return res.status(401).json({ mensaje: 'Credenciales incorrectas.' });
          }

          // Guardar el usuario en la sesión
          req.session.userId = usuario.ID;
          res.json({ mensaje: 'Inicio de sesión exitoso.', usuario: { id: usuario.ID, nombre: usuario.Nombre, rol: usuario.Rol } });
      });
  });
});





module.exports = router;
