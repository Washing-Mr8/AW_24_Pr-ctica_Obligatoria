var express = require('express');
var router = express.Router();
const verificarSesion = require('../middleware/autenticar');

/* GET home page. */
router.get('/', function (req, res, next) { 

  let isLogged = false;
  let isAdmin = false;
  let name = "notLogged";

  if(req.session.role){
    isLogged = true;
    name = req.session.name;

    if(req.session.role === 'organizador'){
      isAdmin = true;
    }
  }

  res.render('index', { title: 'OrgaNice', isLogged:isLogged, isAdmin:isAdmin, username:name});
});

module.exports = router;
