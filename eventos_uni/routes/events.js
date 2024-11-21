var express = require('express');
var router = express.Router();
const pool = require('../database.js');

router.get('/', function(req, res, next) {
    pool.query('SELECT Titulo,Descripcion,Fecha,Hora,Ubicacion,Capacidad_Maxima,tipo FROM eventos WHERE Organizador_ID = ?', [1],(err,eventList)=>{
        if(err) throw err;
        res.render('viewEvents', { title: 'Events', events:eventList });
    });
   
});
router.post('/create',function(req,res){
    const {eventTitle,eventType,eventDate,eventTime,eventLocation,eventCapacity,eventDescription} = req.body;
    idORganizer ='1'; // SACARLO DE LAS SESIONES CUANDO ESTE
    pool.query('SELECT Rol FROM usuarios WHERE ID = ?', [idORganizer], (err,user) =>{
        if(err) throw err;
        if(user[0].Rol == "organizador"){
            pool.query('SELECT id FROM eventos WHERE Titulo = ?',[eventTitle], (err,check)=>{
                if(err) throw err;
                if(check.length == 0){
                    pool.query('INSERT INTO eventos (Titulo,Descripcion,Fecha,Hora,Ubicacion,Capacidad_Maxima,tipo,Organizador_ID) VALUES(?,?,?,?,?,?,?,?)',[eventTitle,eventDescription,eventDate,eventTime,eventLocation,eventCapacity,eventType,idORganizer], (err) =>{
                        if(err) {
                            throw err;
                        }
                        res.redirect('/viewEvents');
                    });
                }
            });
        }
        else{
            //NO DEBERÍA NI PODER LLEGAR AQUÍ
        }
    });
   
});
module.exports = router;
