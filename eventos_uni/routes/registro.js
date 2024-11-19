var express = require('express');
var router = express.Router();

/* GET registro page. */
router.get('/', function(req, res, next) {
  res.render('registro', { title: 'Express' });
});

module.exports = router;
