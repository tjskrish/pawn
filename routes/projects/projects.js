var express = require('express');
var router = express.Router();
var mongodb = require('mongodb');
var mongoClient = mongodb.MongoClient;

var url = 'mongodb://tjs:password@ds039684.mlab.com:39684/mongo';

// var promise = require('Promise')

/* GET users listing. */
router.get('/',function(req,res,next){
	//console.log(req.user.groups.href)
	console.log(req.user);
	var client=req.app.get('stormpathClient')
	var href = req.user.href
	var count=0;
	var user_projects=[];
	var project_users=[];
	var allusers=[];
	var dir_href=req.user.directory.href
 //getting directory to get groups specific to organisation
 /////////////////////////////////////////////////////////////////////
	client.getDirectory(dir_href,function (err, directory) {
  //console.log(directory);
	//through directory every group present are returned
		directory.getGroups(function(err, groupsCollection) {
	//groups collection is iterated to print each group and its href
  			groupsCollection.each(function(group, next) {
				if(group.name!='user' && group.name!='admin' && group.name!='individual'){
		//console.log('^^^^^^^^^^^^^^')
    				//console.log(group.name);
		//console.log(group.href.split('/')[5]);
		 			user_projects.push({project_name:group.name,project_href:group.href,t_ph:group.href.split('/')[5]});
		//console.log('^^^^^^^^^^^^^^^^^^^^^^^^^')
				}
    		next();
			})
			count++;
			//ex_end();
  		});

	});
 /////////////////////////////////////////////////////////////////////////////	
	
//this flow is to get account to get groups its related to
	client.getAccount(href, function (err, account) {
	//then its associated groups are returned
  		account.getGroups(function(err,collection){
  			
			if (!err) {
    			collection.each(function(group, next){
    				var users=[];
			//accounts present in each group are iteratively returned except admin and user groups (we need only project groups)
					if(group.name!='user' && group.name!='admin'){
			//	console.log(group.name+"--------------------------")
			//	console.log(group.href+"--------------------------------")
						group.getAccounts(function (err, collection) {
	 	      				collection.each(function (account, next) {
     //console.log('Found account for ' + account.givenName + ' (' + account.email + ')');
		 //console.log('*******************')

		 						users.push(account);
          						next();
  							});
       						project_users.push({project_name:group.name,project_href:group.href,users:users,t_ph:group.href.split('/')[5]})
       						
						});
					}
					//next();
				});
				count++;
       			//ex_end();
  			}
 ///////////////////////////////////////////////////////////////////////// 
	//this flow is to get all accounts in the organisation i.e directory
			var href_dir=req.user.directory.href
			client.getDirectory(href_dir,function(err,directory){
				directory.getAccounts(function(err, collection) {
			//console.log('Getting all Accounts')
			//console.log(collection)
	  				collection.each(function(account, next) {
	    //console.log('Found account for ' + account.givenName + ' (' + account.email + ')');
				    	allusers.push(account);
	    				next();
	  				});
	  				count++;
	  				//ex_end();
				});
				
			})
		})
	});
 
 setTimeout(function(){
		//if(count==3){
				//console.log("-----------------------------------------------------");
				// console.log(user_projects);
				// console.log("------------------------------------------------------");
				// console.log(project_users);
				// console.log("------------------------------------------------------");
				// console.log(allusers);
				// console.log("------------------------------------------------------");
				console.log(project_users);
				res.render('project.ejs',{userProjects:user_projects,projectUsers:project_users,allUsers:allusers,role:req.user.customData.role});
		//	}

	}, 3000);
 

//send list of users in the user group,existing users
	
})



router.post('/add_project',function(req,res,next){
	//this flow is for project group creation
newGroup={
 //name:req.body.projectName
	//description:req.body.projres.renderectDesc
	name:req.body.newProjName,
	description:req.body.newProjDesc
}
var app_href = 'https://api.stormpath.com/v1/applications/68V3ozAJT0faoX9o3z6Ipi';
var client=req.app.get('stormpathClient')
  var href=req.user.directory.href
	//directory is called to create group specific to organisation
	client.getDirectory(href,function(err,directory){
		console.log(directory)
		directory.createGroup(newGroup,function(err,group){
			console.log(group.name)
			var groupStoreMapping={
				accountStore:{
					href:group.href
				}
			}
			client.getAccount(req.user.href,function(err,accessToken){
				accessToken.addToGroup(group.href,function(err,GroupMembership){
					if(err){
						console.log('error to add')
					}
					else {
						console.log(GroupMembership)
					}
				})
			})
//though group is created ,it should be mapped to the application
     client.getApplication(app_href,function(err,application){
			 console.log(application.name)
			 application.createAccountStoreMapping(groupStoreMapping, function (err) {
			  if (err) {
			    return console.error(err);
			  }
			  else{
			  	mongoClient.connect(url, function (err, db) {
  					if (err) {
    					console.log('Unable to connect to the mongoDB server. Error:', err);
  					} else {
    				//HURRAY!! We are connected. :)
    					console.log('Connection established to', url);

					    // Get the documents collection
    					var collection = db.collection('projects');

    					collection.insert([{projId:group.href.split('/')[5],projName:req.body.newProjName,projDesc:req.body.newProjDesc
}], function (err, result) {
      					if (err) {
        					console.log(err);
      					} else {
      						res.redirect('/projects');
        					console.log('Inserted %d documents into the "users" collection. The documents inserted with "_id" are:', result.length, result);
      					}
      				//Close connection
      					db.close();
    					});
  					}
				});
			  }

			  
			  console.log('Project  is mapped!');

			 })
		 })

		})
	})





})

router.post('/get_status',function(req,res,next){
	console.log(req.body.projId);
	
	var createsystem = require('../../lib/msgqueue/rabbit.js');
	createsystem.sendData({projId:req.body.projId},'svcStatus');

	mongoClient.connect(url, function (err, db) {
  					if (err) {
    					console.log('Unable to connect to the mongoDB server. Error:', err);
  					} else {
    				//HURRAY!! We are connected. :)
    					console.log('Connection established to', url);

					    // Get the documents collection
    					var collection = db.collection('projectStatus');

    					collection.find({projId:req.body.projId}).toArray(function (err, result) {
      						if (err) {
      							res.status(204);
        						console.log(err);
      						} else if (result.length) {
        						res.status(200).send({status:result[0].status,ip:result[0].ip})
      						} else {
      							res.status(200).send({status:"notstarted"});
        						console.log('No document(s) found with defined "find" criteria!');
      						}
      					//Close connection
      						db.close();
    					});

  					}
				});

});


router.post('/add_users',function(req,res,next){
//req.body.projectName
//req.body.projectHref
//var href_dir=req.user.directory.href

console.log(req.body);
 var projectHref=req.body.projHref;
try{
var client=req.app.get('stormpathClient')
//to add user group is obtained
client.getGroup(projectHref,function(err,group){
	// var group_href=rq.body.group_href
	for(account in req.body.addedUsers){
		var href = account.userHref
		//users are iterated to add to the group i.e project obtained
client.getAccount(href, function (err, account) {
  console.log(account.name);
	account.addToGroup(group,function(err){
		if(err){
			return console.error(err)
		}
		// console.log('added to'+group.name)
		
	})
});

	}
})
///////////////////////////////////////////////////////

// remove_user_list=['https://api.stormpath.com/v1/accounts/1AU80rErxTb7aMnhpQdcTe']
  // var href_group='https://api.stormpath.com/v1/groups/5IMtsRrMLTOs4RqIZ080ye'
  var href_group=req.body.projHref;
  var remove_user_list=req.body.removedUsers;
  client.getGroup(href_group,function(err,group)
    {
    //  console.log(group)
      for (i=0;i<remove_user_list.length; i++){
    //    console.log(remove_user_list[i])
      client.getAccount(remove_user_list[i],function (err, account) {
    //    console.log(account)
      account.getGroupMemberships(function(err,CollectionResource){
       CollectionResource.each(function(membership,next){
         console.log(membership)
         if(membership.group.href==href_group){
           membership.delete(function(err){
             if(err){
               console.log(err)
             } else{
               
             }
           })
         }
       })

      })
  });
}
})
/////////////////////////////////////////////////////////
}catch(err){}

setTimeout(function(){
	res.redirect("/projects");
},2000)

})

router.post('/delete_project',function(req,res,next){
	//delHref=req.body.delete_href
	var client=req.app.get('stormpathClient')
	//similar to add user function
	client.getGroup(delHref, function (err, group) {
	  console.log(group);
		group.delete(function(err){
			if(!err){
				console.log('Successfully Removed')
			}
			else {
				console.log('Failed to Delete')
			}
		})
	});
})

router.get('/delete_users',function(req,res,next){
	//delHref=req.body.delete_href
	var client=req.app.get('stormpathClient')
	//similar to add user function
	client.getGroup(delHref, function (err, group) {
	  console.log(group);
		group.delete(function(err){
			if(!err){
				console.log('Successfully Removed')
			}
			else {
				console.log('Failed to Delete')
			}

		})
	});
})

module.exports = router;