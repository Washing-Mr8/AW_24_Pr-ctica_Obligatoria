var express = require('express');
var router = express.Router();
const pool = require('../database.js');
const verificarSesion = require('../middleware/autenticar');

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
            res.render('calendar', {title:"calendario", usuario: user[0],currentYear:year,currentMonth:month, events: eventList});
          });
  
        });
      });
  
    });
  });

  module.exports = router;
