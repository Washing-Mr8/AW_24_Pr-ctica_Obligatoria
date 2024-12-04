var express = require('express');
var router = express.Router();
const pool = require('../database.js');
const verificarSesion = require('../middleware/autenticar');


router.get('/',verificarSesion ,function(req, res, next) {
    idUser = req.session.userId;
    pool.getConnection(function(error,con){
        if(error){
            con.release();
            return res.status(500).send({ success: false, message: 'Error al cargar eventos' });
        }
        con.query('SELECT Rol FROM usuarios WHERE ID = ?', [idUser], (err,user) =>{
            if(user[0].Rol == "organizador"){ //SELECCINAR LOS EVENTOS SI ES ORGANIZADOR SOLO LOS SUYOS
                con.query('SELECT * FROM eventos WHERE Organizador_ID = ? AND activo = true', [idUser],(err,eventList)=>{
                    if(err) throw err;
                    con.query('SELECT * FROM facultades',(err,locationList)=>{
                        if(err) throw err;
                        con.release();
                        res.render('viewEvents', { title: 'Events', events:eventList, locations:locationList , user:user});
                    });
                });
            }
            else{//SELECCIONAR LOS EVENTOS SI ES ASISTENTE SOLO LOS QUE AUN ESTAN ACTIVOS Y POSTERIORES AL DIA DE HOY
                con.query('SELECT * FROM eventos WHERE activo = true AND Fecha > CURDATE()',(err,eventList) =>{
                    if(err) throw err;
                    con.query('SELECT * FROM facultades',(err,locationList)=>{
                        if(err) throw err;
                        con.query('SELECT * FROM inscripciones WHERE Usuario_ID = ? AND activo = true',[idUser],(err,stateList)=>{
                            if(err) throw err;
                            var map = new Map();
                            stateList.forEach(element => {
                                map.set(element.Evento_ID,element.Estado_Inscripcion);
                            });
                            con.release();
                            res.render('viewEvents', { title: 'Events', events:eventList, locations:locationList,user:user, stateList:map });
                        });
                    });
                });
            }
    
        });
    });
    
   
});
router.post('/create',function(req,res){
    const {eventTitle,eventType,eventDate,eventTime,eventLocation,eventCapacity,eventDescription,eventExact,eventDuration} = req.body;
    idORganizer = req.session.userId;
    pool.getConnection(function(error,con){
        if(error){
            con.release();
            return res.status(500).send({ success: false, message: 'Error al crear el evento.' });
        }
        con.query('SELECT id FROM eventos WHERE Titulo = ? AND activo = true',[eventTitle], (err,check)=>{
            if(err){
                con.release();
                return res.status(500).send({ success: false, message: 'Error al crear el evento.' });
            }
            if(check.length == 0){// SI NO HAY NINGUNO CON EL MISMO TITULO
                con.query('SELECT ID FROM facultades WHERE Nombre = ?', [eventLocation], (err,locationID) =>{
                    if(err){
                        con.release();
                        return res.status(500).send({ success: false, message: 'Error al crear el evento.' });
                    }
                    con.query('SELECT Hora, Duracion FROM eventos WHERE Fecha = ? AND IDfacultad = ? AND Ubicacion = ? AND activo = true', [eventDate, locationID[0].ID, eventExact], (err,repeated) =>{
                        if(err){
                            con.release();
                            return res.status(500).send({ success: false, message: 'Error al crear el evento.' });
                        }
                        canInsert = checkTime(repeated,eventTime,eventDuration);
                        if(canInsert){//CHEQUEA QUE NO HAYA UN EVENTO EN EL MISMO LUGAR A LA MISMA HORA
                            con.query('INSERT INTO eventos (Titulo,Descripcion,Fecha,Hora,Ubicacion,Capacidad_Maxima,tipo,Duracion,Capacidad_Actual,IDfacultad,Organizador_ID,facultad,activo) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)'
                                ,[eventTitle,eventDescription,eventDate,eventTime,eventExact,eventCapacity,eventType,eventDuration,0,locationID[0].ID,idORganizer,eventLocation,true], (err,result) =>{
                                    if(err){
                                        con.release();
                                        return res.status(500).send({ success: false, message: 'Error al crear el evento.' });
                                    }
                                const newEvent = {
                                    ID: result.insertId,
                                    Titulo: eventTitle,
                                    Descripcion: eventDescription,
                                    Fecha: eventDate,
                                    Hora: eventTime,
                                    Duracion: eventDuration,
                                    Facultad: eventLocation,
                                    Ubicacion: eventExact,
                                    Capacidad_Actual: 0,
                                    Capacidad_Maxima: eventCapacity,
                                    Tipo: eventType
                                  };
                                  con.query('SELECT * FROM facultades',(err,locationList)=>{
                                    if(err){
                                        con.release();
                                        return res.status(500).send({ success: false, message: 'Error al crear el evento.' });
                                    }
                                    con.release();
                                    return res.json({ success: true, event: newEvent, locations:locationList});
                                });
                            });
                        }
                        else{
                            con.release();
                            return res.json({ success: false, message: "Ya hay un evento ese dia a esa hora en esa ubicación" });
                        }
                    });
                });
            }
            else{
                con.release();
                return res.json({ success: false, message: "Ya hay un evento con ese titulo" });
            }
        });
    });
   
});

router.post('/delete/:id', function(req,res){
    pool.getConnection(function(error,con){
        if(error){
            con.release();
            return res.status(500).send({ success: false, message: 'Error al eliminar el evento.' });
        }
        con.query('SELECT Usuario_ID FROM inscripciones WHERE Evento_ID = ?', [req.params.id], (err,users)=>{
            if(err){
                con.release();
                return res.status(500).send({ success: false, message: 'Error al eliminar el evento.' });
            }  
            con.query('SELECT Titulo FROM eventos WHERE ID = ?', [req.params.id], (err,title)=>{
                if(err){
                    con.release();
                    return res.status(500).send({ success: false, message: 'Error al eliminar el evento.' });
                }  
                if(users.length !== 0){//SI HABÍA USUARIOS REGISTRADOS AL EVENTO ENVIA NOTIFICACIONES A TODOS 
                    mes = "El evento " + title[0].Titulo + " ha sido cancelado";
                    sentNotification(0,mes,users,con);
                }
                con.query('UPDATE inscripciones SET activo = ? WHERE Evento_ID = ?', [false,req.params.id], (err)=>{
                    if(err){
                        con.release();
                        return res.status(500).send({ success: false, message: 'Error al eliminar el evento.' });
                    }
                    pool.query('UPDATE eventos SET activo = ? WHERE id = ?', [false,req.params.id], (err) => {
                        if(err) throw err;
                        con.release();
                        return res.json({ success: true, message: 'Evento eliminado correctamente.' });
                    });
                });
                
            });
            
        });
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
    pool.getConnection(function(error,con){
        if(error){
            con.release();
            return res.status(500).send({ success: false, message: 'Error al editar el evento.' });
        }
        con.query('SELECT * FROM eventos WHERE id = ?', [eventId], (err,bdEvent) =>{
            if(err){
                con.release();
                return res.status(500).send({ success: false, message: 'Error al editar el evento.' });
            }
            con.query('SELECT ID FROM facultades WHERE Nombre = ?', [eventLocation], (err,locationID) =>{
                if(err){
                    con.release();
                    throw err;
                }
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
                if(bdEvent[0].Capacidad_Maxima !== eventCapacity){
                    bdEvent[0].Capacidad_Maxima = eventCapacity;
                }
                if(bdEvent[0].Descripcion !== eventDescription)
                    bdEvent[0].Descripcion = eventDescription;
                if(bdEvent[0].IDfacultad !== locationID[0].ID)
                    bdEvent[0].IDfacultad = locationID[0].ID;
    
                if(bdEvent[0].Capacidad_Maxima < bdEvent[0].Capacidad_Actual){// SI SE REDUCE LA CAPACIDAD Y QUEDAN USUARIOS FUERA LOS MANDA A LISTA DE ESPERA Y LOS NOTIFICA
                    addToQueueAndNotify(eventId,bdEvent[0].Capacidad_Actual - bdEvent[0].Capacidad_Maxima,con,bdEvent[0].Capacidad_Maxima);
                }
                con.query('SELECT Hora, Duracion FROM eventos WHERE Fecha = ? AND IDfacultad = ? AND Ubicacion = ?', [bdEvent[0].Fecha, bdEvent[0].IFfacultad, bdEvent[0].Ubicacion], (err,repeated) =>{
                    if(err){
                        con.release();
                        return res.status(500).send({ success: false, message: 'Error al editar el evento.' });
                    }
                    canUpdate = checkTime(repeated,bdEvent[0].Hora,bdEvent[0].Duracion);
                    if(canUpdate){
                       pool.query('UPDATE Eventos SET Titulo = ?, tipo = ?, Fecha = ?, Hora = ?, Duracion = ?, facultad = ?, Ubicacion = ?, Capacidad_Maxima = ?, Descripcion = ?, IDfacultad = ? WHERE ID = ? ',
                        [bdEvent[0].Titulo,bdEvent[0].tipo,bdEvent[0].Fecha,bdEvent[0].Hora,bdEvent[0].Duracion,bdEvent[0].facultad,bdEvent[0].Ubicacion,bdEvent[0].Capacidad_Maxima,bdEvent[0].Descripcion,bdEvent[0].IDfacultad,eventId],
                        (err) =>{
                            return res.json({ success: true, event:bdEvent[0]});
                        }
                       );
                    }
                });
    
            });
        });
    });

});

router.post('/join/:id', function(req,res){
    const userId = req.session.userId;
    const eventId = req.params.id;
    pool.getConnection(function(error,con){
        if(error){
            con.release();
            return res.status(500).send({ success: false, message: 'Error al ingresar a evento.' });
        }
        con.query('SELECT Estado_Inscripcion,activo FROM inscripciones WHERE Usuario_ID = ? AND Evento_ID = ?', [userId,eventId], (err,state)=>{
            if(error){
                con.release();
                return res.status(500).send({ success: false, message: 'Error al ingresar a evento.' });
            }
            if(state.length == 0){//SI NUNCA ANTES HABÍA ESTADO REGISTRADO
                con.query('SELECT Capacidad_Maxima, Capacidad_Actual FROM eventos WHERE ID = ?',[eventId], (err,capacity)=>{
                    if(err){
                        con.release();
                        return res.status(500).send({ success: false, message: 'Error al ingresar a evento.' });
                    }
                    const now = new Date();

                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const day = String(now.getDate()).padStart(2, '0');

                    const hours = String(now.getHours()).padStart(2, '0');
                    const minutes = String(now.getMinutes()).padStart(2, '0');
                    const seconds = String(now.getSeconds()).padStart(2, '0');

                    
                    const datetime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
                    if(capacity[0].Capacidad_Maxima > capacity[0].Capacidad_Actual ){// SI LA CAPACIDAD SIGUE SIN ESTAR LLENA
                        con.query('INSERT INTO inscripciones VALUES(?,?,?,?,?)',[userId,eventId,'inscrito',datetime,true],(err)=>{
                            if(err){
                                con.release();
                                return res.status(500).send({ success: false, message: 'Error al ingresar a evento.' });
                            }
                            con.query('UPDATE eventos SET Capacidad_Actual = ? WHERE ID = ?' , [capacity[0].Capacidad_Actual + 1, eventId], (err)=>{
                                if(err){
                                    con.release();
                                    return res.status(500).send({ success: false, message: 'Error al ingresar a evento.' });
                                }
                                con.release();
                                return res.json({ success: true, state: 'inscrito',actualCapacity : capacity[0].Capacidad_Actual + 1, totalCapacity : capacity[0].Capacidad_Maxima});
                            });
                        });
                    }
                    else{//SI ESTA LLENA SE METE EN LISAT DE ESPERA
                        con.query('INSERT INTO inscripciones VALUES(?,?,?,?,?)',[userId,eventId,'lista de espera',datetime,true],(err)=>{
                            if(err){
                                con.release();
                                console.log(err);
                                return res.status(500).send({ success: false, message: 'Error al ingresar a evento.' });
                            }
                            con.release();
                            return res.json({ success: true, state: 'lista de espera',actualCapacity : capacity[0].Capacidad_Actual, totalCapacity : capacity[0].Capacidad_Maxima});
                        });
                    }
                });
            }
            else{ // YA ESTA EN LA BD
                con.query('SELECT Capacidad_Maxima, Capacidad_Actual FROM eventos WHERE ID = ?',[eventId], (err,capacity)=>{
                    if(err){
                        con.release();
                        return res.status(500).send({ success: false, message: 'Error al ingresar a evento.' });
                    }
                    const now = new Date();

                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const day = String(now.getDate()).padStart(2, '0');

                    const hours = String(now.getHours()).padStart(2, '0');
                    const minutes = String(now.getMinutes()).padStart(2, '0');
                    const seconds = String(now.getSeconds()).padStart(2, '0');

                    
                    const datetime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
                    if(capacity[0].Capacidad_Maxima > capacity[0].Capacidad_Actual ){// SI LA CAPACIDAD SIGUE SIN ESTAR LLENA
                        con.query('UPDATE inscripciones SET activo = true, Fecha_Inscripcion = ?, Estado_Inscripcion = ?  WHERE Usuario_ID = ?',[datetime,'inscrito',userId],(err)=>{
                            if(err){
                                con.release();
                                return res.status(500).send({ success: false, message: 'Error al ingresar a evento.' });
                            }
                            con.query('UPDATE eventos SET Capacidad_Actual = ? WHERE ID = ?' , [capacity[0].Capacidad_Actual + 1, eventId], (err)=>{
                                if(err){
                                    con.release();
                                    return res.status(500).send({ success: false, message: 'Error al ingresar a evento.' });
                                }
                                con.release();
                                return res.json({ success: true, state: 'inscrito',actualCapacity : capacity[0].Capacidad_Actual + 1, totalCapacity : capacity[0].Capacidad_Maxima});
                            });
                        });
                    }
                    else{//SI ESTA LLENA SE METE EN LISAT DE ESPERA
                        con.query('UPDATE inscripciones SET activo = true, Fecha_Inscripcion = ?, Estado_Inscripcion = ?  WHERE Usuario_ID = ?',[datetime,'lista de espera',userId],(err)=>{
                            if(err){
                                con.release();
                                return res.status(500).send({ success: false, message: 'Error al ingresar a evento.' });
                            }
                            con.release();
                            return res.json({ success: true, state: 'lista de espera',actualCapacity : capacity[0].Capacidad_Actual, totalCapacity : capacity[0].Capacidad_Maxima});
                        });
                    }
                });
            }
        });
        
    });
});

router.post('/leave/:id', function(req,res){
    const userId = req.session.userId;
    const eventId = req.params.id;
    pool.getConnection(function(error,con){
        if(error){
            con.release();
            return res.status(500).send({ success: false, message: 'Error al salirse de evento.' }); 
         }
        con.query('SELECT Estado_Inscripcion FROM inscripciones WHERE Usuario_ID = ? AND Evento_ID = ? AND activo = true', [userId,eventId], (err,state)=>{
            if(err){
                con.release();
                return res.status(500).send({ success: false, message: 'Error al salirse de evento.' }); 
            }
            if(state.length != 0){
              
                con.query('SELECT Capacidad_Maxima, Capacidad_Actual,Titulo FROM eventos WHERE ID = ?',[eventId], (err,capacity)=>{
                    if(err){
                        con.release();
                        return res.status(500).send({ success: false, message: 'Error al salirse de evento.' }); 
                    }
                    if(state[0].Estado_Inscripcion == "inscrito"){
                        if(capacity[0].Capacidad_Actual === capacity[0].Capacidad_Maxima){// SI ESTABA LLENO EL EVENTO
                            con.query('UPDATE inscripciones SET activo = false WHERE Usuario_ID = ? AND Evento_ID = ?', [userId,eventId], (err)=>{
                                if(err){
                                    con.release();
                                    return res.status(500).send({ success: false, message: 'Error al salirse de evento.' }); 
                                }
                                con.query('SELECT Evento_ID, Usuario_ID FROM inscripciones WHERE Estado_Inscripcion = ? AND activo = true ORDER BY Fecha_Inscripcion ASC' , ['lista de espera'], (err,waitList)=>{
                                    if(err){
                                        con.release();
                                        return res.status(500).send({ success: false, message: 'Error al salirse de evento.' }); 
                                    }
                                    if(waitList.length === 0){// SI NO HAY LISTA DE ESPERA
                                        con.query('UPDATE eventos SET Capacidad_Actual = ? WHERE ID = ?' , [capacity[0].Capacidad_Actual - 1,eventId], (err)=>{
                                            if(err){
                                                con.release();
                                                return res.status(500).send({ success: false, message: 'Error al salirse de evento.' }); 
                                            }
                                            con.release();
                                            return res.json({ success: true,actualCapacity : capacity[0].Capacidad_Actual - 1, totalCapacity : capacity[0].Capacidad_Maxima});                     
                                       });
                                    }
                                    else{//SI HAY LISTA DE ESPERA
                                        con.query('UPDATE inscripciones SET Estado_Inscripcion = ? WHERE Usuario_ID = ? AND Evento_ID = ?' , ['inscrito',waitList[0].Usuario_ID,waitList[0].Evento_ID], (err)=>{
                                            if(err){
                                                con.release();
                                                return res.status(500).send({ success: false, message: 'Error al salirse de evento.' }); 
                                            }
                                            sentNotification(0,"Se ha actualizado tu puesto en la lista de espera en el evento " + capacity.Titulo,waitList,con);
                                            con.release();
                                            return res.json({ success: true,actualCapacity : capacity[0].Capacidad_Actual, totalCapacity : capacity[0].Capacidad_Maxima});                     
                                        });
                                    }
                                });
                            });
                        }
                        else{// SI NO ESTABA LLENO
                            con.query('UPDATE inscripciones SET activo = false WHERE Usuario_ID = ? AND Evento_ID = ?', [userId,eventId], (err)=>{
                                if(err){
                                    con.release();
                                    return res.status(500).send({ success: false, message: 'Error al salirse de evento.' }); 
                                }
                                con.query('UPDATE eventos SET Capacidad_Actual = ? WHERE ID = ?' , [capacity[0].Capacidad_Actual - 1,eventId], (err)=>{
                                    if(err){
                                        con.release();
                                        return res.status(500).send({ success: false, message: 'Error al salirse de evento.' }); 
                                    }
                                    con.release();
                                    return res.json({ success: true,actualCapacity : capacity[0].Capacidad_Actual - 1, totalCapacity : capacity[0].Capacidad_Maxima});                     
                                });
                            });
                        }
                    }
                    else{
                        con.query('UPDATE inscripciones SET activo = false WHERE Usuario_ID = ? AND Evento_ID = ?', [userId,eventId], (err)=>{
                            if(err){
                                con.release();
                                return res.status(500).send({ success: false, message: 'Error al salirse de evento.' }); 
                            }
                            con.release();
                            return res.json({ success: true,actualCapacity : capacity[0].Capacidad_Actual, totalCapacity : capacity[0].Capacidad_Maxima});      
                        });
                    }
                });
            }
        });
        
        
    });
});

router.get('/showDetails/:id',verificarSesion ,function(req, res, next) {

    pool.getConnection(function(error,con){
        if(error){
            con.release();
            return res.status(500).send({ success: false, message: 'Error al mostrar evento.' }); 
         }
         con.query('SELECT Nombre,ID FROM usuarios WHERE Rol = ?',["asistente"],(err,users) =>{
            if(err){
                con.release();
                console.log(err);
                return res.status(500).send({ success: false, message: 'Error al mostrar evento.'}); 
             }
            con.query('SELECT Usuario_ID,Estado_Inscripcion FROM inscripciones WHERE activo = true AND Evento_ID = ?',[req.params.id],(err,userInEvent) =>{
                if(err){
                    con.release();
                    return res.status(500).send({ success: false, message: 'Error al mostrar evento.'}); 
                }
                var map = new Map();
                userInEvent.forEach(eventUser => {
                    users.forEach(user => {
                       if(eventUser.Usuario_ID === user.ID){
                        Username = user.Nombre;
                        userState = eventUser.Estado_Inscripcion;
                        map.set(user.ID,[Username,userState]);
                       }
                    });
                });
                con.query('SELECT * FROM eventos WHERE activo = true AND ID = ?',[req.params.id],(err,eventData) =>{
                    if(err){
                        console.log(err);
                        con.release();
                        return res.status(500).send({ success: false, message: 'Error al mostrar evento.'}); 
                    }
                    
                    con.query("SELECT * FROM comentarios WHERE Evento_ID = ?",[req.params.id],(err,reviews)=>{
                        if(err){
                            con.release();
                            return res.status(500).send({ success: false, message: 'Error al mandar comentario' });
                        }
                        con.query("SELECT Nombre,ID FROM usuarios",(err,users)=>{
                            if(err){
                                con.release();
                                return res.status(500).send({ success: false, message: 'Error al mandar comentario' });
                            }
                            userNames = new Map();
                            reviews.forEach(review => {
                                users.forEach(user => {
                                    if(review.Usuario_ID === user.ID)
                                        userNames.set(review.Usuario_ID,user.Nombre);
                                });
                            });
                            con.release();
                            res.render('eventDetails', { title: 'Event details', event:eventData,users:map,comments:reviews, userNames:userNames });
                        });
                    });

                });
                    
            });
        });
        
       
    });

});


router.get('/filter',verificarSesion ,function(req, res, next) {
    idUser = req.session.userId;
    const { type, date, location } = req.query;

    
    let queryExtras = '';
    let extraParams = [];

    if (type) {
        queryExtras += ' AND tipo = ?';
        extraParams.push(type);
    }
    if (date) {
        queryExtras += ' AND Fecha = ?';
        extraParams.push(date);
    }
    if (location) {
        queryExtras += ' AND facultad = ?';
        extraParams.push(location);
    }


    pool.getConnection(function(error,con){
        if(error){
            con.release();
            return res.status(500).send({ success: false, message: 'Error al cargar eventos' });
        }
        con.query('SELECT Rol FROM usuarios WHERE ID = ?', [idUser], (err,user) =>{
            if(user[0].Rol == "organizador"){
                extraParams.unshift(idUser);
                con.query('SELECT * FROM eventos WHERE Organizador_ID = ? AND activo = true' + queryExtras, extraParams,(err,eventList)=>{
                    if(err) throw err;
                    con.query('SELECT * FROM facultades',(err,locationList)=>{
                        if(err) throw err;
                        con.release();
                        return res.json({ success: true,events:eventList, locations:locationList , user:user}); 
                    });
                });
            }
            else{
                con.query('SELECT * FROM eventos WHERE activo = true AND Fecha > CURDATE()' + queryExtras,[extraParams],(err,eventList) =>{
                    if(err) throw err;
                    con.query('SELECT * FROM facultades',(err,locationList)=>{
                        if(err) throw err;
                        con.query('SELECT * FROM inscripciones WHERE Usuario_ID = ? AND activo = true',[idUser],(err,stateList)=>{
                            if(err) throw err;
                            var map = new Map();
                            stateList.forEach(element => {
                                map.set(element.Evento_ID,element.Estado_Inscripcion);
                            });
                            con.release();
                            const stateListObj = Array.from(map.entries()).reduce((acc, [key, value]) => {
                                acc[key] = value;
                                return acc;
                              }, {});
                            return res.json({ success: true,events:eventList, locations:locationList , user:user,stateList:stateListObj }); 
                        });
                    });
                });
            }
    
        });
    });
    
   
});

router.post("/comment/:id",function(req,res){
    const{comment,rating} = req.body;
    const userId = req.session.userId;
    pool.getConnection(function(error,con){
        if(error){
            con.release();
            return res.status(500).send({ success: false, message: 'Error al mandar comentario' });
        }
        con.query("INSERT INTO comentarios (valoracion,mensaje,Usuario_ID,Evento_ID) VALUES (?,?,?,?)",[rating,comment,userId,req.params.id],(err)=>{
            if(err){
                con.release();
                return res.status(500).send({ success: false, message: 'Error al mandar comentario' });
            }
            con.release();
            return res.json({ success: true }); 
        });
    });
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

function sentNotification(index,message,users,con){
    con.query('INSERT INTO notificaciones (idUsuario,mensaje) VALUES (?,?)', [users[index].Usuario_ID, message], (err)=>{
        if(err){
            con.release();
            throw err;
        }
        if(users.length === index + 1){
            return;
        }
        else{
            sentNotification(index+1,message,users,con);
        }
        return;
    });
}

function addToQueueAndNotify(eventId, amount,con,newCapacity){
    con.query('SELECT Usuario_ID FROM inscripciones WHERE Evento_ID = ? ORDER BY Fecha_Inscripcion LIMIT ?',[eventId,amount],(err,users)=>{
        if(err){
            con.release();
            throw err;
        }
        con.query('UPDATE eventos SET Capacidad_Actual = ? WHERE ID = ?',[newCapacity,eventId],(err)=>{
            if(err){
                con.release();
                throw err;
            }
            con.query('SELECT Titulo FROM eventos WHERE ID = ? ',[eventId],(err,event)=>{
                if(err){
                    con.release();
                    throw err;
                }
            
                sentNotification(0,"Un evento "+ event[0].Titulo+"al que estabas inscrito ha sido modificado y has sido movido a la lista de espera",users,con);
                return;
            });
        });
    });
}
module.exports = router;
