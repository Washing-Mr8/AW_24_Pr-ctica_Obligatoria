var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../database');

// Número de rondas para el hashing de contraseñas
const SALT_ROUNDS = 10;

/* GET users listing. */
router.get('/', verificarSesion, function (req, res, next) {
  pool.query('SELECT Nombre, Correo,Telefono, Facultad, Rol FROM usuarios WHERE ID = ? ', [req.session.userId], (err, user) => {
    if (err) {
      console.error('Error al obtener el usuario:', err);
      return res.status(500).render('error', { mensaje: 'Error al obtener los datos del usuario.' });
    }

    if (user.length === 0) {
      return res.status(404).render('error', { mensaje: 'Usuario no encontrado.' });
    }

    res.render('user', { title: user[0].Nombre, usuario: user[0] });
  });
});

function verificarSesion(req, res, next) {
  if (req.session.userId) {
    next(); // Usuario autenticado, continuar
  } else {
    res.status(401).redirect('/user/login'); // Redirigir al login si no está autenticado
  }
}



/* GET registro page. */
router.get('/register', function (req, res, next) {
  pool.query('SELECT * from Facultades', (err, result) => {
    if (err){
      console.error('Error al obtener facultades:', err);
      return res.status(500).render('error', { mensaje: 'Error al cargar las facultades.' });
    }
    res.render('registro', { title: 'Registro', facultades: result });
  });
});

/* POST para registrar un usuario */
router.post('/register', function (req, res) {
  const { registerName, registerEmail, registerPassword, registerPhone, facultad, role } = req.body;

  // Verificar si el correo ya está registrado
  pool.query('SELECT ID FROM usuarios WHERE Correo = ?', [registerEmail], (err, user) => {
    if (err) {
      console.error('Error al verificar el correo:', err);
      return res.status(500).render('error', { mensaje: 'Error al registrar el usuario.' });
    }

    if (user.length > 0) {
      return res.status(400).json({ mensaje: 'El correo ya está registrado.' });
    }

    // Hashear la contraseña
    bcrypt.hash(registerPassword, SALT_ROUNDS, (err, hashedPassword) => {
      if (err) {
        console.error('Error al hashear la contraseña:', err);
        return res.status(500).render('error', { mensaje: 'Error al registrar el usuario.' });
      }

      // Insertar nuevo usuario
      const newUser = [registerName, registerEmail, hashedPassword, registerPhone, facultad, role];
      pool.query('INSERT INTO usuarios(Nombre,Correo,Password,Telefono,Facultad,Rol) VALUES (?,?,?,?,?,?)', newUser, (err) => {
        if (err){
          console.error('Error al insertar usuario:', err);
          return res.status(500).render('error', { mensaje: 'Error al registrar el usuario.' });
        }

        res.render('login',{success:'Usuario registrado con éxito. Por favor, inicie sesión.'});
      });
    });
  });
});


/* GET Login page. */
router.get('/login', function (req, res, next) {
  res.render('login', { title: 'Login' });
});

/* POST para iniciar sesion*/

router.post('/login', function (req, res) {
  const { loginEmail, loginPassword } = req.body;

  // Verificar si el correo existe
  pool.query('SELECT * FROM usuarios WHERE Correo = ?', [loginEmail], (err, user) => {
    if (err) {
      console.error('Error al buscar el usuario:', err);
      return res.status(500).render('error', { mensaje: 'Error en el servidor.' });
    }

    if (user.length === 0) {
      return res.status(401).json({ mensaje: 'No existe ningun usuario con el correo proporcionado' });
    }

    const usuario = user[0];

    // Comparar la contraseña
    bcrypt.compare(loginPassword, usuario.Password, (err, result) => {
      if (err) {
        console.error('Error al comparar contraseñas:', err);
        return res.status(500).render('error', { mensaje: 'Error en el servidor.' });
      }

      if (!result) {
        return res.status(401).json({ mensaje: 'La contraseña es incorrecta o no coincide' });
      }

      // Guardar el usuario en la sesión
      req.session.userId = usuario.ID;
      res.redirect('/user');
      // res.json({ mensaje: 'Inicio de sesión exitoso.', usuario: { id: usuario.ID, nombre: usuario.Nombre, rol: usuario.Rol } });
    });
  });
});



module.exports = router;
