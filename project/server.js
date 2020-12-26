const express = require('express');
const app = express();
const session = require('cookie-session');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const assert = require('assert');
const fs = require('fs');
const url= require("url");
const formidable = require('express-formidable');
const mongourl = 'mongodb+srv://Lok:Lok@cluster0.x6dds.mongodb.net/project?retryWrites=true&w=majority';
//const mongourl = 'mongodb+srv://admin:admin@cluster0.8vw8w.mongodb.net/project?retryWrites=true&w=majority';

const dbName = 'project';//10

app.use(session({
	name: 'session',
	keys: ['key1','key2']
	}));

app.use(bodyParser.raw(
	{
		type : 'image/*',
		limit:'20mb'
	}
))


app.use(formidable());
app.set('view engine', 'ejs');

const login = (db, criteria, callback) => {
	let cursor = db.collection('user').find(criteria);
	console.log(`findDocument: ${JSON.stringify(criteria)}`);
	cursor.toArray((err,result) => {

		console.log(`findUser: ${result.length}`);
		callback(result);
	});
}




const handle_login = (req, res)=>{
	const client = new MongoClient(mongourl);
	client.connect((err) => {
		assert.equal(null, err);
		console.log("Connected successfully to server");
		const db = client.db(dbName);
		var criteria={};
		criteria['username'] = req.fields.uname;
		criteria['password'] = req.fields.password;
		login(db, criteria, (result) => {
			
			client.close();
			console.log("Closed DB connection");
			console.log(`findUser: ${result.length}`);
			if(result.length>=1){
				req.session.authenticated = true;
				req.session.username = req.fields.uname;
				res.redirect('/');
				//res.status(200).render('restaurants', {message: req.fields.uname})
			}else{
				res.render('login_page');
			}
		})
	});
}
const handle_register = (req, res)=>{
	const client = new MongoClient(mongourl);
	client.connect((err) => {
		assert.equal(null, err);
		console.log("Connected successfully to server");
		const db = client.db(dbName);
		var criteria={};
		criteria['username'] = req.fields.uname;
		criteria['password'] = req.fields.password;
		db.collection('user').insert(criteria);
		res.status(200).render('info', {message: `register sucessfully`})
		client.close();
		console.log("Closed DB connection");
		});
}

const handle_insert = (req, res) => {
	const client = new MongoClient(mongourl);
	client.connect((err) => {
		assert.equal(null, err);
		console.log("Connected successfully to server");
		const db = client.db(dbName);


		fs.readFile(req.files.sampleFile.path, (err,data) =>{
		
			
		var criteria={};
		var criteria_address={}
			
		criteria['name'] = req.fields.name;
		criteria['borough'] = req.fields.borough;
		criteria['cuisine'] = req.fields.cuisine;
		criteria['photo'] = req.files.sampleFile.name;
		criteria['photo_mimetype'] = req.files.sampleFile.type;
		criteria_address['street'] = req.fields.street;
		criteria_address['building'] = req.fields.building;
		criteria_address['zipcode'] = req.fields.zipcode;
		criteria_address['coord'] = [req.fields.lat,req.fields.lon]
		criteria['address'] = criteria_address;
		criteria['grade'] = [];
		criteria['creator'] = req.session.username;


		criteria['image'] = new Buffer(data).toString('base64');
			
		db.collection('restaurant').insert(criteria);
		res.status(200).render('info', {message: `create sucessfully`})
		client.close();
		console.log("Closed DB conection");

			})
		
		

		
		
	//	criteria['sampleFile'] = req.fields.sampleFile;
		//db.collection('restaurants').insert(criteria);
	//	res.status(200).render('info', {message: `create sucessfully`})
	//	client.close();
	//	console.log("Closed DB connection");
		});
}


const handle_change = (req, res) => {
	const client = new MongoClient(mongourl);
	client.connect((err) => {
		assert.equal(null, err);
		console.log("Connected successfully to server");
		const db = client.db(dbName);
		
		fs.readFile(req.files.sampleFile.path, (err,data) =>{
		
			var criteria={};
		var criteria_address={};
		var criteria_id={};
		criteria_id['_id'] = ObjectID(req.fields._id);
			
				
			criteria['name'] = req.fields.name;
			criteria['borough'] = req.fields.borough;
			criteria['cuisine'] = req.fields.cuisine;
			criteria['photo'] = req.files.sampleFile.name;
			criteria['photo_mimetype'] = req.files.sampleFile.type;
			criteria_address['street'] = req.fields.street;
			criteria_address['building'] = req.fields.building;
			criteria_address['zipcode'] = req.fields.zipcode;
			criteria_address['coord'] = [req.fields.lat,req.fields.lon]
			criteria['address'] = criteria_address;
			criteria['image'] = new Buffer(data).toString('base64');
			//console.log(criteria);
		console.log(criteria);
	db.collection('restaurant').findOneAndUpdate(criteria_id,{ $set: criteria});
			
		//criteria['creator'] = req.session.username;
		

		show_detail(db, criteria_id, (result) => {
			client.close();
			//console.log(result);
			for (results of result) {
				if(results.image){
					var image = new Buffer.from(results.image,'base64');
					var mimetype = results.photo_mimetype;
					var photo = results.photo;
				//	console.log(image);
				//	console.log(results.photo);
					var imge ="data:"+mimetype+";base64,"+results.image
					var img = 'img src='+imge;
				}
				else{
					img = "p hidden";
				}
				console.log("Closed DB connection");
				res.status(200).render('detail', {image:img, res_detail:result, res_address:[results.address], id :req.fields._id, res_grade: results.grade});
				}
			})
		})
		//res.status(200).render('detail', )
	//	client.close();
	//	console.log("Closed DB connection");
		});
		
}


const handle_search = (req, res) => {
	const client = new MongoClient(mongourl);
	client.connect((err) => {
		assert.equal(null, err);
		console.log("Connected successfully to server");
		const db = client.db(dbName);
		check_name = req.session.username;
		var criteria_search_name={};
		var criteria_search_borough={};
		var criteria_search_cuisine={};
		var criteria_search=[]; 
		criteria_search_name['name'] = req.fields.name;
		criteria_search_borough['borough'] = req.fields.borough;
		criteria_search_cuisine['cuisine'] = req.fields.cuisine;
		console.log()

		if(req.fields.name){
		 criteria_search.push(criteria_search_name);}

		if(req.fields.borough){
		 criteria_search.push(criteria_search_borough);}

		if(req.fields.cuisine){
		 criteria_search.push(criteria_search_cuisine);}

		
		console.log("a " +criteria_search);
		
		search_fun(db, criteria_search, (docs) => {
			console.log(docs);
			client.close();
			console.log("Closed DB connection");
			for (doc of docs) {
				//console.log(doc.name);
				//res.status(200).render('restaurants', {message: req.session.username, noofres: docs.length, res_name:doc.name});
			
			}
			//var docs_name_str = JSON.stringify(docs);
				res.status(200).render('search_result', {message: criteria_search, noofres: docs.length, res_name:docs});
			//console.log(docs);

		})

	})	;


}

const search_fun = (db, criteria, callback) => {
	console.log(criteria);
	let cursor = db.collection('restaurant').find({$and : criteria}, { projection: { _id: 1, name: 1} })
	cursor.toArray((err,docs) => {
	//	assert.equal(null,err);
	//	console.log(docs);
        callback(docs);
    })
}

const findDocument = (db,callback) => {
    let cursor = db.collection('restaurant').find({}, { projection: { _id: 1, name: 1} });
    cursor.toArray((err,docs) => {
      //  assert.equal(null,err);
        callback(docs);
    })
}
const show_detail = (db, criteria, callback) => {
	let cursor = db.collection('restaurant').find(criteria);
	console.log(`findDocument: ${JSON.stringify(criteria)}`);
	cursor.toArray((err,result) => {
		console.log(result);
		callback(result);
	});
}

const checkname = (db, criteria, callback) => {
	let cursor = db.collection('restaurant').find(criteria,{ projection: { _id: 0, creator: 1} });
	console.log(`findDocument: ${JSON.stringify(criteria)}`);
	cursor.toArray((err,result) => {
		console.log(result);
		callback(result);
	});
}

const handle_rate = (req, res) => {
	const client = new MongoClient(mongourl);
	client.connect((err) => {
		assert.equal(null, err);
		console.log("Connected successfully to server");
		const db = client.db(dbName);
		check_name = req.session.username;
		var criteria_rate={};
		criteria_rate['username'] = req.session.username;
		criteria_rate['score'] = req.fields.score;
		var criteria_id={};
		criteria_id['_id'] = ObjectID(req.fields._id);
	
		
		checkrate(db, criteria_id, check_name, (results_rate) => {
			console.log(results_rate);
			if(results_rate){
				
			res.status(200).render('info', {message: `Error. You have already rated the retaurant!`})
			}
			else

			{
				console.log(criteria_id);
				console.log(criteria_rate);
				db.collection('restaurant').updateOne(criteria_id,{$push: {"grade": criteria_rate}});

				show_detail(db, criteria, (result) => {
					
					console.log(result);
					for (results of result) {
						if(results.image){
							var image = new Buffer.from(results.image,'base64');
							var mimetype = results.photo_mimetype;
							var photo = results.photo;
						//	console.log(image);
						//	console.log(results.photo);
							var imge ="data:"+mimetype+";base64,"+results.image
							var img = 'img src='+imge;
						}
						else{
							img = "p hidden";
						}
					//	console.log([results.address]);
					//	console.log(results.address.street);
					//	client.close();
						console.log("Closed DB connection");
					
						res.status(200).render('detail', {image:img, res_detail:result, res_address:[results.address], id :req.fields._id, res_grade: results.grade});
						}
					})

			}
		});
		

	});

}

const checkrate = (db, criteria, check_name, callback) => {
	let cursor = db.collection('restaurant').find(criteria,{ projection: { _id: 0, "grade.username": 1} });

	var x = false
	cursor.toArray((err,result) => {
		console.log(result);
		for(results of result){	

			results.grade.forEach(function(grade){
			
			console.log("a" + grade.username);
			if(grade.username == check_name){
				x=true;
				}
			});
		}
		console.log(x);
	callback(x);
	});
	
}		
const findDocument_api = (db, criteria, callback) => {
    let cursor = db.collection('restaurant').find(criteria);
    console.log(`findDocument: ${JSON.stringify(criteria)}`);
    cursor.toArray((err,docs) => {
        assert.equal(err,null);
        console.log(`findDocument: ${docs.length}`);
        callback(docs);
    });
}

			
		//console.log(result);
		
	



app.get('/', (req,res) => {
	//console.log(req.session);
	if (!req.session.authenticated) { 
	res.redirect('/login_page');}
	else {
		
		res.redirect('/restaurants');
	}
	
})

app.get('/login_page', (req,res) => {
    res.render('login_page');
})

app.post('/login', (req,res) => {
	handle_login(req, res);
})

app.post('/logout', (req,res) => {
	req.session = null;   // clear cookie-session
	res.redirect('/');
})

app.get('/search_page', (req,res) => {
    res.render('search_page');
})

app.post('/search', (req,res) => {
	handle_search(req, res);
})

app.get('/insertres_page', (req,res) => {
    res.render('insertres_page');
})


app.post('/insertres', (req,res) => {
	handle_insert(req, res);
})

app.post('/rate_f', (req,res) => {
	handle_rate(req, res);
})

app.get('/rate', (req,res) => {
	let timestamp = new Date().toISOString();
    console.log(`Incoming request ${req.method}, ${req.url} received at ${timestamp}`);

		var parsedURL = url.parse(req.url,true); // true to get query as object 
		console.log("id =" + parsedURL.query._id);
		const client = new MongoClient(mongourl);
		criteria ={};
		criteria['_id'] = ObjectID(parsedURL.query._id);
		console.log(criteria);

		client.connect((err) => {
		assert.equal(null, err);
		console.log("Connected successfully to server");
		const db = client.db(dbName);
		//console.log(req.session.username);
		res.status(200).render('rate', {username: req.session.username, id:parsedURL.query._id});
		client.close();
		console.log("Closed DB connection");
			
			
		
		})
	
})


app.get('/remove', (req,res) => {
    let timestamp = new Date().toISOString();
    console.log(`Incoming request ${req.method}, ${req.url} received at ${timestamp}`);

	var parsedURL = url.parse(req.url,true); // true to get query as object 
		console.log("id =" + parsedURL.query._id);
		const client = new MongoClient(mongourl);
		criteria ={};
		criteria['_id'] = ObjectID(parsedURL.query._id);
		console.log(criteria);
		client.connect((err) => {
		assert.equal(null, err);
		console.log("Connected successfully to server");
		const db = client.db(dbName);
		checkname(db, criteria, (results) => {
			console.log(req.session.username);
			for (result of results) {
			//	console.log(doc.name);
				//res.status(200).render('restaurants', {message: req.session.username, noofres: docs.length, res_name:doc.name});
			
		
				if(result.creator != req.session.username){
					client.close();
					console.log("Closed DB connection");
					res.status(200).render('info', {message: `Error. You are not authorized to delete!!!`})
				}
				else{
					db.collection('restaurant').remove(criteria);
					client.close();
					console.log("Closed DB connection");
					res.status(200).render('info', {message: `Restaurant has been deleted!!!`})
					}
			}
			
		});
		})

})

app.post('/change_h', (req,res) => {
	handle_change(req, res);
})

app.get('/change', (req,res) => {
	let timestamp = new Date().toISOString();
    console.log(`Incoming request ${req.method}, ${req.url} received at ${timestamp}`);

		var parsedURL = url.parse(req.url,true); // true to get query as object 
		console.log("id =" + parsedURL.query._id);
		const client = new MongoClient(mongourl);
		criteria ={};
		criteria['_id'] = ObjectID(parsedURL.query._id);
		console.log(criteria);

		client.connect((err) => {
		assert.equal(null, err);
		console.log("Connected successfully to server");
		const db = client.db(dbName);
		checkname(db, criteria, (results) => {
			console.log(req.session.username);
			for (result of results) {
			//	console.log(doc.name);
				//res.status(200).render('restaurants', {message: req.session.username, noofres: docs.length, res_name:doc.name});
			
		
				if(result.creator != req.session.username){
					client.close();
					//console.log(result);
					console.log("Closed DB connection");
					res.status(200).render('info', {message: `Error. You are not authorized to edit!!!`})
				}
				else{
					show_detail(db, criteria, (result) => {
						client.close();
						//console.log(result);
						for (results of result) {
							
							console.log("Closed DB connection");
							res.status(200).render('change', {res_value:result, res_address:[results.address], id :parsedURL.query._id, res_grade: results.grade, username: req.session.username});
							}
						})
				
			
					}
			}
			
		});
		})
	
})



app.get('/register_page', (req,res) => {	
	res.render('register_page');
})

app.get('/detail', (req,res) => {	

	let timestamp = new Date().toISOString();
    console.log(`Incoming request ${req.method}, ${req.url} received at ${timestamp}`);

	var parsedURL = url.parse(req.url,true); // true to get query as object 
	console.log("id =" + parsedURL.query._id);

	const client = new MongoClient(mongourl);
	criteria ={};
	criteria['_id'] = ObjectID(parsedURL.query._id);
	console.log(criteria);
	client.connect((err) => {
		assert.equal(null, err);
		console.log("Connected successfully to server");
		const db = client.db(dbName);
		show_detail(db, criteria, (result) => {
			client.close();
			//console.log(result);
			for (results of result) {
				if(results.image){
				var image = new Buffer.from(results.image,'base64');
				var mimetype = results.photo_mimetype;
				var photo = results.photo;
			//	console.log(image);
			//	console.log(results.photo);
				var imge ="data:"+mimetype+";base64,"+results.image
				var img = 'img src='+imge;
			}
			else{
				img = "p hidden";
			}
			//	console.log(img);
				console.log([results.address]);
				console.log(results.address.street);
				req.session.lat=results.address.coord[0];
				req.session.lon=results.address.coord[1];
				console.log("Closed DB connection");
				res.status(200).render('detail', {image:img, res_detail:result, res_address:[results.address], id :parsedURL.query._id, res_grade: results.grade});
				}
			})
		});
	//	res.render('detail', {id: parsedURL.query._id }) ;
	})

	app.post('/register', (	req,res) => {
	handle_register(req, res);
})

app.get('/restaurants', (req,res) => {
	//const client = new MongoClient(mongourl);
	const client = new MongoClient(mongourl);
	client.connect((err) => {
		assert.equal(null, err);
		console.log("Connected successfully to server");
		const db = client.db(dbName);
		findDocument(db, (docs) => {
			client.close();
			console.log("Closed DB connection");
			for (doc of docs) {
				console.log(doc.name);
				//res.status(200).render('restaurants', {message: req.session.username, noofres: docs.length, res_name:doc.name});
			
			}
			var docs_name_str = JSON.stringify(docs);
		res.status(200).render('restaurants', {message: req.session.username, noofres: docs.length, res_name:docs});
			console.log(docs);
		});
	});
	//res.status(200).render('restaurants', {message: req.session.username });
})

app.get('/api/restaurant/name/:name', (req,res) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);

        let criteria = {}
        criteria.name = req.params.name
        findDocument_api(db, criteria, (docs) => {
            client.close();
            console.log("Closed DB connection");
            res.status(200).json(docs)
        });
	});
})
app.get('/api/restaurant/borough/:borough', (req,res) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);

        let criteria = {}
        criteria.borough = req.params.borough
        findDocument_api(db, criteria, (docs) => {
            client.close();
            console.log("Closed DB connection");
            res.status(200).json(docs)
        });
	});
})

app.get('/api/restaurant/cuisine/:cuisine', (req,res) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);

        let criteria = {}
        criteria.cuisine = req.params.cuisine
        findDocument_api(db, criteria, (docs) => {
            client.close();
            console.log("Closed DB connection");
            res.status(200).json(docs)
        });
	});
})

app.get("/map", (req,res) => {
	res.render("map.ejs", {
		lat:req.session.lat,
		lon:req.session.lon,
		zoom: 15
	});
	res.end();
});

app.listen(app.listen(process.env.PORT || 8099));
