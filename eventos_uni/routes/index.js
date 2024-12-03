var express = require('express');
var router = express.Router();
const verificarSesion = require('../middleware/autenticar');

/* GET home page. */
router.get('/', function (req, res, next) { 

  let isLogged = false;
  let isAdmin = false;

  if(req.session.role){
    isLogged = true;
    if(req.session.role === 'organizador'){
      isAdmin = true;
    }
  }

  res.render('index', { title: 'OrgaNice', isLogged:isLogged, isAdmin:isAdmin, username:"notlogged"});
});

module.exports = router;
