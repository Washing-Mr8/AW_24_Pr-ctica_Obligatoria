var express = require('express');
var router = express.Router();
const pool = require('../database.js');

router.get('/', function(req, res, next) {
    idUser = 4;//Pillar de las sesiones
    pool.query('SELECT Rol FROM usuarios WHERE ID = ?', [idUser], (err,user) =>{
        if(user[0].Rol == "organizador"){
            pool.query('SELECT * FROM eventos WHERE Organizador_ID = ?', [idUser],(err,eventList)=>{
                if(err) throw err;
                pool.query('SELECT * FROM facultades',(err,locationList)=>{
                    if(err) throw err;
                    res.render('viewEvents', { title: 'Events', events:eventList, locations:locationList , user:user});
                });
            });
        }
        else{
            pool.query('SELECT * FROM eventos',(err,eventList) =>{
                if(err) throw err;
                pool.query('SELECT * FROM facultades',(err,locationList)=>{
                    if(err) throw err;
                    res.render('viewEvents', { title: 'Events', events:eventList, locations:locationList,user:user });
                });
            });
        }

    });
    
   
});
router.post('/create',function(req,res){
    const {eventTitle,eventType,eventDate,eventTime,eventLocation,eventCapacity,eventDescription,eventExact,eventDuration} = req.body;
    idORganizer = 1; // SACARLO DE LAS SESIONES CUANDO ESTE
    pool.query('SELECT Rol FROM usuarios WHERE ID = ?', [idORganizer], (err,user) =>{
        if(err) throw err;
        if(user[0].Rol == "organizador"){
            pool.query('SELECT id FROM eventos WHERE Titulo = ?',[eventTitle], (err,check)=>{
                if(err) throw err;
                if(check.length == 0){
                    pool.query('SELECT ID FROM facultades WHERE Nombre = ?', [eventLocation], (err,locationID) =>{
                        pool.query('SELECT Hora, Duracion FROM eventos WHERE Fecha = ? AND IDfacultad = ? AND Ubicacion = ?', [eventDate, locationID[0].ID, eventExact], (err,repeated) =>{
                            canInsert = checkTime(repeated,eventTime,eventDuration);
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
    
    } = req.body
    pool.query('SELECT * FROM eventos WHERE id = ?', [eventId], (err,bdEvent) =>{
        if(err) throw err;
        pool.query('SELECT ID FROM facultades WHERE Nombre = ?', [eventLocation], (err,locationID) =>{
            if(err) throw err;
            if(bdEvent[0].Titulo !== eventTitle)
                bdEvent[0].Titulo = eventTitle;
            if(bdEvent[0].tipo !== eventType)
                bdEvent[0].tipo = eventType;
            if(bdEvent[0].Fecha !== eventDate)
                bdEvent[0].Fecha = eventDate;
            if(bdEvent[0].Hora !== eventTime)
                bdEvent[0].Hora = eventTime;
            if(bdEvent[0].Duracion !== eventDuration)
                bdEvent[0].Duracion = eventDuration;
            if(bdEvent[0].facultad !== eventLocation)
                bdEvent[0].facultad = eventLocation;
            if(bdEvent[0].Ubicacion !== eventExact)
                bdEvent[0].Ubicacion = eventExact;
            if(bdEvent[0].Capacidad_Maxima !== eventCapacity)
                bdEvent[0].Capacidad_Maxima = eventCapacity;
            if(bdEvent[0].Descripcion !== eventDescription)
                bdEvent[0].Descripcion = eventDescription;
            if(bdEvent[0].IDfacultad !== locationID[0].ID)
                bdEvent[0].IDfacultad = locationID[0].ID;

            pool.query('SELECT Hora, Duracion FROM eventos WHERE Fecha = ? AND IDfacultad = ? AND Ubicacion = ?', [bdEvent[0].Fecha, bdEvent[0].IFfacultad, bdEvent[0].Ubicacion], (err,repeated) =>{
                canUpdate = checkTime(repeated,bdEvent[0].Hora,bdEvent[0].Duracion);
                if(canUpdate){
                   pool.query('UPDATE Eventos SET Titulo = ?, tipo = ?, Fecha = ?, Hora = ?, Duracion = ?, facultad = ?, Ubicacion = ?, Capacidad_Maxima = ?, Descripcion = ?, IDfacultad = ? WHERE ID = ? ',
                    [bdEvent[0].Titulo,bdEvent[0].tipo,bdEvent[0].Fecha,bdEvent[0].Hora,bdEvent[0].Duracion,bdEvent[0].facultad,bdEvent[0].Ubicacion,bdEvent[0].Capacidad_Maxima,bdEvent[0].Descripcion,bdEvent[0].IDfacultad,eventId],
                    (err) =>{
                        res.redirect("/viewEvents");
                    }
                   );
                }
            });

        });
    });

});

router.post('/join/:id', function(req,res){
    res.redirect("/vieEvents");
});

function checkTime(events,eventTime,eventDuration){
    canInsert = true;
    if(events.length != 0){
        events.forEach(repeatedEvent => {
            if(repeatedEvent.Hora + repeatedEvent.Duracion > eventTime || eventTime + eventDuration > repeatedEvent.Hora){
                canInsert = false;
            }
        });
    }
    return canInsert;
}
module.exports = router;
