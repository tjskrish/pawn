var express = require('express');
var router = express.Router();
var stormpath=require('express-stormpath');
var stripe=require('stripe')("sk_test_g3WF6wdXVLB5GHA2bAgmW3RU");



/* GET home page. */
router.get('/', function(req, res, next) {
 res.render('index.ejs');
});

router.get('/health',function(req,res,next){
  res.send(200);
})




router.get('/payment',function(req,res,next){
 console.log(req.query.plan)
//  res.locals.plan=req.query.plan
 if(req.query.plan=='Organisation'){
res.render('payment.ejs')}
else if (req.query.plan=='individual'){
res.render('payment_2.ejs')
}
})
router.post('/payment', function(req, res, next) {
   console.log("check-1")
   console.log(req.body)
   console.log(res.locals.plan)
   var client = req.app.get('stormpathClient');
   stripe.customers.create({
       source: req.body.stripeToken,
       plan: 'Organisation',
       email:req.body.email
         }, function(err, customer) {
       if (err) return next(err);
       res.redirect('/signup_1/?valid=' + customer.id);

         });

         });

router.post('/payment_2', function(req, res, next) {
     console.log("check-1")
     console.log(req.body)
     console.log(res.locals.plan)
     var client = req.app.get('stormpathClient');
             stripe.customers.create({
                 source: req.body.stripeToken,
                 plan: 'individual',
                 email:req.body.email
                   }, function(err, customer) {
                 if (err) return next(err);
                 //req.somevariable=customer.id
                 res.redirect('/signup_2/?valid=' + customer.id);

                   });

                   });

router.get('/signup_1',function(req,res,next){
 res.render('signup_1.ejs',{
   stripe_tran_id:req.query.valid
 })
})

router.get('/signup_2',function(req,res,next){
 console.log(req.query.valid)
 res.render('signup_2.ejs',{
   stripe_tran_id:req.query.valid
 })
})

router.post('/signup_1',function(req,res,next){
//  var nameValue = document.getElementById("63211428158149").value;
console.log(req.somevariable)
 console.log(req.body.q36_organisation)
var client = req.app.get('stormpathClient');
 var newOrganization = {
 name: req.body.q36_organisation,
 nameKey: req.body.q39_organisationDescription
};

 client.createOrganization(newOrganization, function (err, organization) {
   if (err) {
     return console.log(err);
   }

   console.log(organization);

    var directoryData = {
  name: req.body.q37_directory,
  description: req.body.q38_directoryDescription
};

client.createDirectory(directoryData, function (err, directory) {
  if (err) {
    return console.error(err);
  }

  console.log('Created directory %s!', directory.href);
 //var directoryHref=directory.href

var accountStoreMapping = {
 accountStore: {
  href:directory.href
 },
 isDefaultAccountStore: true,
 isDefaultGroupStore: true
};

organization.createAccountStoreMapping(accountStoreMapping, function (err) {
 if (err) {
   return console.error(err);
 }

 console.log('Directory is mapped!');


var accountData = {
 givenName: req.body.q1_firstName,
 surname: req.body.q17_lastName,
 username: req.body.q1_firstName,
 email: req.body.q35_email,
 password: req.body.q18_password,
 customData:{stripeID:req.body.stripeID,
 role:'admin'}
};
organization.createAccount(accountData, function (err, account) {
if (err) {
return console.error(err);
}
console.log('----------\n', account);
req.session.user = account;
console.log('----------\n');

/*organization.setDefaultGroupStore(directory.href, function (err) {
 if (!err) {
   console.log('Directory was set as default group store');
 }
}); */

var href = 'https://api.stormpath.com/v1/applications/68V3ozAJT0faoX9o3z6Ipi'

client.getApplication(href, function (err, application) {
 console.log(application);
var group = {
 name: 'admin',
 description:'User with High Privileges'
};
var group_2={
 name:'user',
 description:'user with lowest privilege'
};

organization.createGroup(group_2,function(err,group){
if(!err){
 console.log('Group_2 created')
}
var groupStoreMapping_2 = {
accountStore: {
 href:group.href
}
}
application.createAccountStoreMapping(groupStoreMapping_2, function (err) {
if (err) {
  return console.error(err);
}

console.log('group_2  is mapped!');

})


})
organization.createGroup(group, function (err, group) {
 if (!err) {
   console.log('Group Created!');
 }

 var href=group.href

 account.addToGroup(group, function(err){
   if(err){
     return console.error(err);
   }

   console.log("Added to group")
   var groupStoreMapping = {
    accountStore: {
     href:group.href
    }
   // isDefaultAccountStore: true,
   // isDefaultGroupStore: true
   };

   application.createAccountStoreMapping(groupStoreMapping, function (err) {
    if (err) {
      return console.error(err);
    }

    console.log('group  is mapped!');

  })

})
 });


});//groups
});//accountCreation

});//accountMapping
});//createDirectory
res.redirect('/')
});//createOrganisation



})

router.post('/signup_2',function(req,res,next){
 console.log(req.body)
 var client = req.app.get('stormpathClient');
 var href="https://api.stormpath.com/v1/applications/68V3ozAJT0faoX9o3z6Ipi"
 var accountData = {
   givenName: req.body.q1_firstName,
   surname: req.body.q17_lastName,
   username: req.body.q1_firstName,
   email: req.body.q35_email,
   password: req.body.q18_password,
   customData:{stripeID:req.body.stripeID},
   role:'individual'
 };
 var group_href="https://api.stormpath.com/v1/groups/2N7BzZt3h3zbOiQoz6LBwb"
 var dir_href='https://api.stormpath.com/v1/directories/696e9fZ5rWuNbDSQu9CC0k'
client.getDirectory(dir_href,function(err,directory){
  //application.createAccount
  directory.createAccount(accountData, function(err, createdAccount) {
 console.log(createdAccount);
 createdAccount.addToGroup(group_href,function(err,membership){
   console.log(membership)
   if(err)
   console.log(err)
 })

});
})
res.redirect('/')

})




module.exports = router;
