var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/user',function(req,res,next){
	res.render('user.ejs')
})

router.post('/login',function(req,res,next){

	
})



module.exports = router;
