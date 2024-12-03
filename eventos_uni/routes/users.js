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
      return res.json({ success: true, message: 'Usuario baneado por inyección SQL' });
    });
  });
});


/* GET registro page. */
router.get('/register', function (req, res, next) {
  pool.getConnection((err, con) => {
    if (err) {
      console.error('Error al intentar acceder a la base de datos:', err);
      return res.status(500).json({ message: 'Error al acceder a la base de datos' });
    }
    con.query('SELECT * from Facultades', (err, result) => {
      con.release();

      if (err) {
        console.error('Error al obtener facultades:', err);
        return res.status(500).render('error', { message: 'Error al cargar las facultades.' });
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
});

/* POST para registrar un usuario */
router.post('/register', function (req, res) {
  const { registerName, registerEmail, registerPassword, registerPhone, facultad, role } = req.body;

  pool.getConnection((err, con) => {
    if (err) {
      console.error('Error al intentar acceder a la base de datos:', err);
      return res.status(500).json({ message: 'Error al acceder a la base de datos' });
    }
    // Verificar si el correo ya está registrado
    con.query('SELECT ID FROM usuarios WHERE Correo = ?', [registerEmail], (err, user) => {
      if (err) {
        con.release();
        console.error('Error al verificar el correo:', err);
        return res.status(500).json({ mesagge: 'Error al registrar el usuario.' });
      }

      if (user.length > 0) {
        con.release();
        return res.status(400).json({ mesagge: 'El correo ya está registrado.' });
      }

      con.query('SELECT ID FROM facultades WHERE Nombre = ?', [facultad], (err, facultadID) => {
        if (err) {
          con.release();
          console.error('Error al acceder a las facultades:', err);
          return res.status(500).json({ mesagge: 'Error al acceder a las facultades.' });
        }

        // Hashear la contraseña
        bcrypt.hash(registerPassword, SALT_ROUNDS, (err, hashedPassword) => {
          if (err) {
            con.release();
            console.error('Error al hashear la contraseña:', err);
            return res.status(500).json({ mesagge: 'Error al hashear la contraseña.' });
          }

          //creamos su configuracion de accesibilidad
          const accesibility = ['default', 'fuente-normal', 'default'];
          con.query('INSERT INTO configuracion_accesibilidad(Paleta_Colores,Tamano_Texto,Configuracion_Navegacion) VALUES (?,?,?);',
            accesibility, (err, result) => {
              if (err) {
                con.release();
                console.error('Error al insertar configuración de accesibilidad:', err);
                return res.status(500).json({ message: 'Error al crear configuración de accesibilidad.' });
              }

              // Obtener el ID de la configuracion recien creada
              const configID = result.insertId;

              // Insertar nuevo usuario
              const newUser = [registerName, registerEmail, hashedPassword, registerPhone, facultadID[0].ID, role, configID];
              con.query('INSERT INTO usuarios(Nombre,Correo,Password,Telefono,Facultad_ID,Rol,Configuraciones_ID) VALUES (?,?,?,?,?,?,?)', newUser, (err) => {
                con.release();

                if (err) {
                  console.error('Error al insertar usuario:', err);
                  return res.status(500).json({ mesagge: 'Error al registrar el usuario.' });
                }

                return res.json({ success: true, message: 'Usuario registrado correctamente, por favor inicie sesión' });
              });
            });
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

  pool.getConnection((err, con) => {
    if (err) {
      con.release();
      console.error('Error al intentar acceder a la base de datos:', err);
      return res.status(500).json({ message: 'Error al acceder a la base de datos' });
    }

    con.query('SELECT * FROM usuarios WHERE Correo = ?', [loginEmail], (err, user) => {
      con.release();

      if (err) {
        console.error('Error al buscar el usuario:', err);
        return res.status(500).json({ message: 'Error en el servidor.' });
      }

      if (user.length === 0) {
        return res.status(401).json({ message: 'No existe ningun usuario con el correo proporcionado' });
      }
      const usuario = user[0];

      // Comparar la contraseña
      bcrypt.compare(loginPassword, usuario.Password, (err, result) => {
        if (err) {
          console.error('Error al comparar contraseñas:', err);
          return res.status(500).json({ message: 'Error al comparar contraseñas' });
        }

        if (!result) {
          return res.status(401).json({ message: 'La contraseña es incorrecta o no coincide' });
        }

        // Guardar el usuario en la sesión
        req.session.userId = usuario.ID;
        req.session.name = usuario.Nombre;
        req.session.correo = usuario.Correo;
        req.session.role = usuario.Rol

        res.json({ success: true, message: 'Inicio de sesión exitoso.' });
      });
    });
  });
});

router.get('/logout', function (req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error al cerrar sesión:", err);
      return res.status(500).render("error", { message: "Error al cerrar sesión" });
    }

    return res.redirect('/user/login');
  });
});


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
        return res.status(500).json({ message: 'Error al obtener los datos del usuario.' });
      }

      if (result.length === 0) {
        return res.status(404).json({ mesagge: 'Usuario no encontrado.' });
      }

      const id_config = result[0].Configuraciones_ID;

      con.query("UPDATE configuracion_accesibilidad SET Paleta_Colores = ?, Tamano_Texto = ? WHERE ID = ?", [tema, fuente, id_config], (err, result) => {
        con.release();

        if (err) {
          console.error('Error al actualizar la configuracion de accesibilidad:', err);
          return res.status(500).json({ error: 'Error al guardar la configuracion de accesibilidad' });
        }

        res.json({ success: true, message: 'Configuracion de accesibilidad guardada correctamente' });
      });
    });
  });
});

router.get('/editarPerfil',verificarSesion, function(req,res){
  pool.getConnection((err, con) => {
    if (err) {
      console.error('Error al intentar acceder a la base de datos:', err);
      return res.status(500).json({ message: 'Error al acceder a la base de datos' });
    }
    con.query('SELECT * from Facultades', (err, result) => {
      con.release();

      if (err) {
        console.error('Error al obtener facultades:', err);
        return res.status(500).render('error', { message: 'Error al cargar las facultades.' });
      }


      return res.render('editarperfil', { title: 'Editar perfil', facultades: result });
    });
  });
});

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
        return res.status(500).render('error', { message: 'Error al obtener los datos del usuario.' });
      }

      if (user.length === 0) {
        return res.status(404).render('error', { mesagge: 'Usuario no encontrado.' });
      }

      con.query('SELECT * FROM eventos WHERE activo = true', (err, eventList) => {
          con.release();
          res.render('user', { title: user[0].Nombre, usuario: user[0], events: eventList});
      });
    });

  });
});



module.exports = router;
