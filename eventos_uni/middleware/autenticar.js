const pool = require('../database');

function verificarSesion(req, res, next) {
    //variables locales para mostrar u ocultar partes de la navbar 
    res.locals.isLogged = false;
    res.locals.isAdmin = false;

    if (req.session.userId) {
        res.locals.isLogged = true;
        res.locals.username = req.session.name;

        // Comprobamos si es administrador
        if (req.session.role === 'organizador') {
            res.locals.isAdmin = true;
        }
        // Consultamos la configuración de accesibilidad
        pool.getConnection((error, con) => {
            if (error) {
                console.error('Error al conectar a la base de datos:', error);
                return res.status(500).render('error', { mensaje: 'Error de servidor' });
            }

            con.query(
                'SELECT Configuraciones_ID FROM usuarios WHERE ID = ?',
                [req.session.userId],
                (err, result) => {
                    if (err || result.length === 0) {
                        con.release();
                        console.error('Error al obtener configuraciones del usuario:', err);
                        res.locals.theme = 'default'; // Tema por defecto
                        res.locals.fontSize = 'normal'; // Tamaño de fuente por defecto
                        return next(); // Continuamos sin configuraciones personalizadas
                    }

                    const id_config = result[0].Configuraciones_ID;

                    con.query(
                        'SELECT Paleta_Colores, Tamano_Texto FROM configuracion_accesibilidad WHERE ID = ?',
                        [id_config],
                        (err, config) => {
                            con.release();

                            if (err || config.length === 0) {
                                console.error('Error al obtener configuraciones de accesibilidad:', err);
                                res.locals.theme = 'default'; // Tema por defecto
                                res.locals.fontSize = 'normal'; // Tamaño de fuente por defecto
                            } else {
                                res.locals.theme = config[0].Paleta_Colores;
                                res.locals.fontSize = config[0].Tamano_Texto;
                            }

                            next(); // Continuamos con las configuraciones cargadas
                        }
                    );
                }
            );
        });
    } else {
        res.status(401).redirect('/user/login'); // Redirigimos al login si no tiene sesión
    }
}
module.exports = verificarSesion;