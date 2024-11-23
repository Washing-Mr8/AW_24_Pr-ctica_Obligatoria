var express = require('express');
var router = express.Router();
const pool = require('../database.js');

router.get('/', function(req, res, next) {
    
    pool.query('SELECT * FROM eventos WHERE Organizador_ID = ?', [1],(err,eventList)=>{
        if(err) throw err;
        pool.query('SELECT * FROM facultades',(err,locationList)=>{
            if(err) throw err;
            res.render('viewEvents', { title: 'Events', events:eventList, locations:locationList });
        });
    });
   
});
router.post('/create',function(req,res){
    const {eventTitle,eventType,eventDate,eventTime,eventLocation,eventCapacity,eventDescription,eventExact,eventDuration} = req.body;
    idORganizer ='1'; // SACARLO DE LAS SESIONES CUANDO ESTE
    pool.query('SELECT Rol FROM usuarios WHERE ID = ?', [idORganizer], (err,user) =>{
        if(err) throw err;
        if(user[0].Rol == "organizador"){
            pool.query('SELECT id FROM eventos WHERE Titulo = ?',[eventTitle], (err,check)=>{
                if(err) throw err;
                if(check.length == 0){
                    pool.query('SELECT ID FROM facultades WHERE Nombre = ?', [eventLocation], (err,locationID) =>{
                        pool.query('SELECT Hora, Duracion FROM eventos WHERE Fecha = ? AND IDfacultad = ? AND Ubicacion = ?', [eventDate, locationID[0].ID, eventExact], (err,repeated) =>{
                            canInsert = true;
                            if(repeated.length != 0){
                                repeated.forEach(repeatedEvent => {
                                    if(repeatedEvent.Hora + repeatedEvent.Duracion > eventTime || eventTime + eventDuration > repeatedEvent.Hora){
                                        canInsert = false;
                                    }
                                });
                            }
                            if(canInsert){
                                pool.query('INSERT INTO eventos (Titulo,Descripcion,Fecha,Hora,Ubicacion,Capacidad_Maxima,tipo,Duracion,Capacidad_Actual,IDfacultad,Organizador_ID,facultad) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)'
                                    ,[eventTitle,eventDescription,eventDate,eventTime,eventExact,eventCapacity,eventType,eventDuration,0,locationID[0].ID,idORganizer,eventLocation], (err) =>{
                                    if(err) {
                                        throw err;
                                    }
                                    res.redirect('/viewEvents');
                                });
                            }
                        });
                    });
                }
            });
        }
    });
   
});

router.post('/delete/:id', function(req,res){
    pool.query('DELETE FROM eventos WHERE id = ?', [req.params.id], (err) => {
        if(err) throw err;
        res.redirect("/viewEvents");
    });
});
router.post('/edit/:id', function(req,res){
    const eventId = req.params.id;
  const {
    eventTitle,
    eventType,
    eventDate,
    eventTime,
    eventDuration,
    eventLocation,
    eventExact,
    eventCapacity,
    eventDescription,
  } = req.body;

  pool.query

});
module.exports = router;
