const pool = require('../database.js');
function checkBannedIP(req, res, next) {
    const ip = req.ip; 
    
    pool.getConnection(function(error, con) {
      if (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Error de conexión a la base de datos' });
      }
      
      con.query('SELECT * FROM black_list WHERE ip = ?', [ip], function(err, results) {
        if (err) {
          con.release();
          return res.status(500).json({ success: false, message: 'Error en la consulta de la base de datos' });
        }
  
        if (results.length > 0) {
          con.release();
          return res.render('banned', {title:"IP Bloqueada", ip: ip, message: 'Intento de inyección SQL, tu IP está baneada de OrgaNice.' 
          });        }
  
        con.release();
        next();
      });
    });
  }
  
  module.exports = { checkBannedIP };
  