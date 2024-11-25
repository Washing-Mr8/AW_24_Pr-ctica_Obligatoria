function verificarSesion(req, res, next) {
    //variables locales para mostrar u ocultar partes de la navbar 
    res.locals.isLogged = false;
    res.locals.isAdmin = false;

    if (req.session.userId) {
        res.locals.isLogged = true;

        // Comprobamos si es administrador
        if (req.session.role === 'organizador') {
            res.locals.isAdmin = true;
        }
        next(); // continuamos porque el usuario tiene sesion
    } else {
        res.status(401).redirect('/user/login'); //si no tiene sesion para el login
    }
}
module.exports = verificarSesion;