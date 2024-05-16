var express = require('express');
var router = express.Router();
const {registerUser } = require ('../controllers/user_controller')
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


module.exports = router;
