var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../database');
const verificarSesion = require('../middleware/autenticar');

// Número de rondas para el hashing de contraseñas
const SALT_ROUNDS = 10;

router.post('/ban', function (req, res) {
  pool.getConnection(function (error, con) {
    if (error) {
      con.release();
      throw error;
    }
    con.query('INSERT INTO black_list VALUES(?)', [req.ip], (err) => {
      if (err) {
        con.release();
        throw err;
      }
      return res.json({ success: true, message: 'Usuario baneado exitosamente' });
    });
  });
});


/* GET registro page. */
router.get('/register', function (req, res, next) {
  pool.query('SELECT * from Facultades', (err, result) => {
    if (err) {
      console.error('Error al obtener facultades:', err);
      return res.status(500).render('error', { mensaje: 'Error al cargar las facultades.' });
    }

    let isLogged = false;
    let isAdmin = false;

    if (req.session.role) {
      isLogged = true;
      if (req.session.role === 'organizador') {
        isAdmin = true;
      }
      return res.redirect('/user');
    }

    return res.render('registro', { title: 'Registro', facultades: result, isLogged: isLogged, isAdmin: isAdmin });
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

    pool.query('SELECT ID FROM facultades WHERE Nombre = ?', [facultad], (err, facultadID) => {
      if (err) {
        console.error('Error al acceder a las facultades:', err);
        return res.status(500).render('error', { mensaje: 'Error al acceder a las facultades.' });
      }

      // Hashear la contraseña
      bcrypt.hash(registerPassword, SALT_ROUNDS, (err, hashedPassword) => {
        if (err) {
          console.error('Error al hashear la contraseña:', err);
          return res.status(500).render('error', { mensaje: 'Error al registrar el usuario.' });
        }

        // Insertar nuevo usuario
        const newUser = [registerName, registerEmail, hashedPassword, registerPhone, facultadID[0].ID, role];
        pool.query('INSERT INTO usuarios(Nombre,Correo,Password,Telefono,Facultad_ID,Rol) VALUES (?,?,?,?,?,?)', newUser, (err) => {
          if (err) {
            console.error('Error al insertar usuario:', err);
            return res.status(500).render('error', { mensaje: 'Error al registrar el usuario.' });
          }

          res.redirect('/user/login');
        });
      });
    });
  });
});


/* GET Login page. */
router.get('/login', function (req, res, next) {

  let isLogged = false;
  let isAdmin = false;

  if (req.session.role) {
    isLogged = true;
    if (req.session.role === 'organizador') {
      isAdmin = true;
    }
    return res.redirect('/user');
  }

  return res.render('login', { title: 'Login', isLogged: isLogged, isAdmin: isAdmin });
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
      req.session.correo = usuario.Correo;
      req.session.role = usuario.Rol

      res.redirect('/user');
      // res.json({ mensaje: 'Inicio de sesión exitoso.', usuario: { id: usuario.ID, nombre: usuario.Nombre, rol: usuario.Rol } });
    });
  });
});


router.get('/logout', function (req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error al cerrar sesión:", err);
      return res.status(500).render("error", { mensaje: "Error al cerrar sesión" });
    }

    return res.redirect('/user/login');
  });
});


/* GET users listing. */
router.get('/:year?/:month?', verificarSesion, function (req, res, next) {
  pool.getConnection(function (error, con) {
    if (error) {
      con.release();
      throw error;
    }
    con.query('SELECT Nombre, Correo,Telefono, Facultad_ID, Rol FROM usuarios WHERE ID = ? ', [req.session.userId], (err, user) => {
      if (err) {
        console.error('Error al obtener el usuario:', err);
        con.release();
        return res.status(500).render('error', { mensaje: 'Error al obtener los datos del usuario.' });
      }

      if (user.length === 0) {
        return res.status(404).render('error', { mensaje: 'Usuario no encontrado.' });
      }

      con.query('SELECT * FROM eventos', (err, eventList) => {
        date = new Date();
        const year = parseInt(req.params.year) || new Date().getFullYear();
        var month = new Date().getMonth();
        if (req.params.month !== undefined)
          month = parseInt(req.params.month)

        pool.query('SELECT * FROM inscripciones WHERE Usuario_ID = ?', [req.session.userId], (err, stateList) => {
          if (err) throw err;
          var map = new Map();
          stateList.forEach(element => {
            map.set(element.Evento_ID, element.Estado_Inscripcion);
          });
          con.release();
          res.render('user', { title: user[0].Nombre, usuario: user[0], events: eventList, currentYear: year, currentMonth: month, stateList: map });
        });

      });
    });

  });
});

/*
router.get("/accesibilidad", function (req, res, next) {
  pool.getConnection(function (error, con) {
    if (error) {
      con.release();
      throw error;
    }
    con.query('SELECT Configuraciones_ID FROM usuarios WHERE ID = ? ', [req.session.userId], (err, id_config) => {
      if (err) {
        console.error('Error al obtener el usuario:', err);
        con.release();
        return res.status(500).render('error', { mensaje: 'Error al obtener los datos del usuario.' });
      }

      if (user.length === 0) {
        return res.status(404).render('error', { mensaje: 'Usuario no encontrado.' });
      }

      con.query('SELECT Paleta_Colores,Tamano_Texto FROM configuracion_accesibilidad WHERE ID = ?', [id_config], (err, config) => {
        if (err) {
          console.error('Error al obtener las configuraciones de accesibilidad:', err);
          return res.status(500).render('error', { mensaje: 'Error en el servidor.' });
        }
        const accesibilidad = config[0];

        const theme = config[0].Paleta_Colores;
        const font = config[0].Tamano_Texto;

        con.release();
        console.log("configuracion de accesibilidad obtenida con exito");
        res.json({ theme: theme, font: font });

      });
    });
  });
});
*/

router.post('/accesibilidad', function (req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }

  const userId = req.session.userId;
  const { tema, fuente } = req.body;

  pool.getConnection((error, con) => {
    if (error) {
      console.error('Error al conectar a la base de datos:', error);
      return res.status(500).json({ error: 'Error de servidor' });
    }
    con.query('SELECT Configuraciones_ID FROM usuarios WHERE ID = ? ', [userId], (err, result) => {
      if (err) {
        console.error('Error al obtener el usuario:', err);
        con.release();
        return res.status(500).render('error', { mensaje: 'Error al obtener los datos del usuario.' });
      }

      if (result.length === 0) {
        return res.status(404).render('error', { mensaje: 'Usuario no encontrado.' });
      }

      const id_config = result[0].Configuraciones_ID;

      con.query("UPDATE configuracion_accesibilidad SET Paleta_Colores = ?, Tamano_Texto = ? WHERE ID = ?", [tema, fuente, id_config], (err, result) => {
        con.release(); 
  
        if (err) {
          console.error('Error al actualizar la configuracion de accesibilidad:', err);
          return res.status(500).json({ error: 'Error al guardar la configuracion de accesibilidad' });
        }
  
        res.json({ message: 'Configuracion de accesibilidad guardada correctamente' });
      });
    });
  });
});


module.exports = router;
