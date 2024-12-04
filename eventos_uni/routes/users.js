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
      con.release();
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
        con.release();
        return res.status(500).json({ message: 'Error en el servidor.' });
      }

      if (user.length === 0) {
        con.release();
        return res.status(401).json({ message: 'No existe ningun usuario con el correo proporcionado' });
      }
      const usuario = user[0];

      // Comparar la contraseña
      bcrypt.compare(loginPassword, usuario.Password, (err, result) => {
        if (err) {
          console.error('Error al comparar contraseñas:', err);
          con.release();
          return res.status(500).json({ message: 'Error al comparar contraseñas' });
        }

        if (!result) {
          con.release();
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
    con.release();
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

router.get('/editarPerfil', verificarSesion, function (req, res) {
  pool.getConnection((err, con) => {
    if (err) {
      console.error('Error al intentar acceder a la base de datos:', err);
      return res.status(500).json({ message: 'Error al acceder a la base de datos' });
    }
    con.query('SELECT * from Facultades', (err, facultad) => {

      if (err) {
        con.release();
        console.error('Error al obtener facultades:', err);
        return res.status(500).render('error', { message: 'Error al cargar las facultades.' });
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
        //devolvemos user si toda va bien
        con.release();
        return res.render('editarperfil', { title: 'Editar perfil', facultades: facultad, usuario: user[0] });
      });
    });
  });
});

router.post('/editarPerfil', function (req, res) {
  pool.getConnection((err, con) => {
    if (err) {
      con.release();
      console.error('Error al intentar acceder a la base de datos:', err);
      return res.status(500).json({ message: 'Error al acceder a la base de datos' });
    }

    const { editNombre, editCorreo, editTelefono, editFacultad } = req.body;

    const phoneRegex = /^\+\d{1,3}\s\d{3}\s\d{3}\s\d{3}$/;
    if (editTelefono && !phoneRegex.test(editTelefono)) {
      con.release();
      return res.status(400).json({ success: false, message: 'El número de teléfono no tiene un formato válido.' });
    }

    if (!editNombre || editNombre.trim() === "") {
      con.release();
      return res.status(400).json({ success: false, message: 'El nombre no puede estar vacío.' });
    }

    const emailRegex = /^[^\s@]+@ucm\.es$/;

    if (!editCorreo) {
      con.release();
      return res.status(400).json({ success: false, message: 'El correo electrónico no puede estar vacío.' });
    } else if (!emailRegex.test(editCorreo)) {
      con.release();
      return res.status(400).json({ success: false, message: 'El correo electrónico no tiene un formato válido.' });
    }

    con.query('SELECT * FROM Usuarios WHERE ID = ?', [req.session.userId], (err, user) => {
      if (err) {
        console.error('Error al obtener el usuario:', err);
        con.release();
        return res.status(500).render('error', { message: 'Error al obtener los datos del usuario.' });
      }

      var currentNombre = user[0].Nombre;
      var currentCorreo = user[0].Correo;
      var currenttelefono = user[0].Telefono;
      var currentFacultadID = user[0].Facultad_ID;

      con.query('SELECT ID FROM facultades WHERE Nombre = ?', [editFacultad], (err, facultadID) => {
        if (err) {
          con.release();
          console.error('Error al acceder a las facultades:', err);
          return res.status(500).json({ mesagge: 'Error al acceder a las facultades.' });
        }

        if (currentFacultadID !== facultadID[0].ID) {
          currentFacultadID = facultadID[0].ID;
        }
        if (currentNombre !== editNombre) {
          currentNombre = editNombre;
        }
        if (currentCorreo !== editCorreo) {
          currentCorreo = editCorreo;
        }
        if (currenttelefono !== editTelefono) {
          currenttelefono = editTelefono;
        }

        con.query('UPDATE Usuarios SET Nombre = ?, Correo = ?, Telefono = ?, Facultad_ID = ? WHERE ID = ? ',
          [currentNombre, currentCorreo, currenttelefono, currentFacultadID, req.session.userId], (err, result) => {
            con.release();

            if (err) {
              console.error('Error al editar el perfil', err);
              return res.status(500).json({ mesagge: 'Error al editar el perfil' });
            }
            req.session.name = editNombre;
            req.session.Correo = editCorreo;

            return res.json({ success: true, message: "Perfil editado con exito" });
          });
      });
    });
  });
});

router.get('/resetPassword', function (req, res) {
  let correo = "";
  let name = "notLogged";
  let isLogged = false;
  let isAdmin = false;


  if (req.session.role) {
    isLogged = true;
    name = req.session.name;
    correo = req.session.correo;
    if (req.session.role === 'organizador') {
      isAdmin = true;
    }
  }

  return res.render('resetPassword', { title: "Cambio de Contraseña", isLogged: isLogged, isAdmin: isAdmin, username: name, email: correo });
});

router.post('/resetPassword', function (req, res) {
  const { correo, newPassword } = req.body;
  //comprobar si la password es igual a la que ya tenía
  pool.getConnection((err, con) => {
    if (err) {
      con.release();
      console.error('Error al intentar acceder a la base de datos:', err);
      return res.status(500).json({ message: 'Error al acceder a la base de datos' });
    }

    if(req.session.correo){
      if(req.session.correo !== correo){
        con.release();
        return res.status(400).json({ message: 'El correo no coincide con el usuario activo' });
      }
    }

    if(!correo || correo.trim() ===""){
      con.release();
      return res.status(400).json({ message: 'El correo no puede estar vacío' });
    }
    
    if(!newPassword || newPassword.trim() === ""){
      con.release();
      return res.status(400).json({ message: 'La contraseña no puede estar vacía' });
    }

    con.query('SELECT Password FROM Usuarios WHERE Correo = ?', [correo], (err, currentPassword) => {
      if (err) {
        con.release();
        console.error('Error al intentar obtener la contraseña:', err);
        return res.status(500).json({ message: 'El correo no está registrado' });
      }

      bcrypt.compare(newPassword, currentPassword[0].Password, (err, result) => {
        if (err) {
          con.release(),
            console.error('Error al comparar contraseñas:', err);
          return res.status(500).json({ message: 'Error al comparar contraseñas' });
        }

        if (result) {
          con.release(),
            console.log('La contraseña es la misma!');
          return res.status(500).json({ message: 'La contraseña es igual que la anterior' });
        } else {

          bcrypt.hash(newPassword, SALT_ROUNDS, (err, hashedPassword) => {
            if (err) {
              con.release();
              console.error('Error al hashear la nueva contraseña:', err);
              return res.status(500).json({ mesagge: 'Error al hashear la nueva contraseña.' });
            }

            con.query('UPDATE Usuarios SET Password = ? WHERE Correo = ?', [hashedPassword, correo], (err) => {
              con.release();

              if (err) {
                console.error('Error al cambiar la contraseña:', err);
                return res.status(500).json({ mesagge: 'Error al cambiar la contraseña' });
              }

              return res.json({ success: true, message: 'Contraseña cambiada correctamente' });
            });
          });
        }
      });
    });
  });


});

router.get('/notifications',function(req,res){
  pool.getConnection(function (error, con) {
    if (error) {
      con.release();
      return res.status(500).json({ message: 'Error al cargar notificaciones' });
    }
    con.query('SELECT mensaje FROM notificaciones WHERE idUSuario = ? LIMIT 5',[req.session.userId],(err,messages)=>{
      if (err) {
        con.release();
        return res.status(500).json({ message: 'Error al cargar notificaciones' });
      }
      con.release();
      return res.json({ success: true, notifications: messages });
    }
  );
  });
});

router.get('/', verificarSesion, function (req, res, next) {
  idUser = req.session.userId;
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
        con.release();
        return res.status(404).render('error', { mesagge: 'Usuario no encontrado.' });
      }

      con.query('SELECT Rol FROM usuarios WHERE ID = ?', [idUser], (err,user) =>{
        if(user[0].Rol == "organizador"){ //SELECCINAR LOS EVENTOS SI ES ORGANIZADOR SOLO LOS SUYOS
            con.query('SELECT * FROM eventos WHERE Organizador_ID = ? AND activo = true', [idUser],(err,eventList)=>{
                if(err) throw err;
                con.query('SELECT COUNT(*) AS Total_Eventos FROM eventos WHERE Organizador_ID = ? AND activo = true', [idUser],(err,eventsCreated)=>{
                  if(err) throw err;
                  extraInfo = [];
                  extraInfo[0] = eventsCreated[0].Total_Eventos;
                  const query = `
                     SELECT 
                         COUNT(i.Usuario_ID) AS Total_Inscritos
                     FROM 
                         eventos e
                     JOIN 
                         inscripciones i ON e.ID = i.Evento_ID
                     WHERE 
                         e.Organizador_ID = ? -- ID del organizador
                         AND e.activo = 1 -- Solo eventos activos
                         AND i.activo = 1; -- Solo inscripciones activas
                    ` ;

                  con.query(query, [idUser],(err,totalJoined)=>{
                    if(err) throw err;
                    extraInfo[1] = totalJoined[0].Total_Inscritos;
                    const query = `
                      SELECT 
                          SUM(e.Capacidad_Maxima) AS Total_Plazas
                      FROM 
                          eventos e
                      WHERE 
                          e.Organizador_ID = ? -- ID del organizador
                          AND e.activo = 1; -- Solo eventos activos
                    `;

                    con.query(query,[idUser],(err,totalSpaces)=>{
                      extraInfo[2] = totalSpaces[0].Total_Plazas;
                      const query = `
                          SELECT 
                              AVG(c.valoracion) AS Media_Valoraciones
                          FROM 
                              eventos e
                          JOIN 
                              comentarios c ON e.ID = c.Evento_ID
                          WHERE 
                              e.Organizador_ID = ? -- ID del organizador
                              AND e.activo = 1; -- Solo eventos activos
                        `;

                      con.query(query,[idUser],(err,avgMark)=>{
                        extraInfo[3] = avgMark[0].Media_Valoraciones;
                        con.release();
                        res.render('user', { title: 'Events', events:eventList , user:user,extras:extraInfo});
                      });
                    });
                    
                  });
              });
            });
        }
        else{//SELECCIONAR LOS EVENTOS SI ES ASISTENTE SOLO LOS QUE AUN ESTAN ACTIVOS Y POSTERIORES AL DIA DE HOY
            con.query('SELECT * FROM eventos WHERE activo = true',(err,eventList) =>{
                if(err) throw err;

                  con.query('SELECT * FROM inscripciones WHERE Usuario_ID = ? AND activo = true',[idUser],(err,stateList)=>{
                      if(err) throw err;
                      var map = new Map();
                      stateList.forEach(element => {
                          map.set(element.Evento_ID,element.Estado_Inscripcion);
                      });
                      con.release();
                      res.render('user', { title: 'Events', events:eventList,user:user, stateList:map });
                  });
            });
        }

    });
    });

  });
});



module.exports = router;
