const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const assert = require('assert');
const fs = require('fs');
const formidable = require('express-formidable');
const mongourl = 'mongodb+srv://Lok:Lok@cluster0.x6dds.mongodb.net/project?retryWrites=true&w=majority';
const dbName = 'project';//10

app.use(formidable());
app.set('view engine', 'ejs');

const login = (db, criteria, callback) => {
	let cursor = db.collection('user').find(criteria);
	console.log(`findDocument: ${JSON.stringify(criteria)}`);
	cursor.toArray((err,result) => {
		assert.equal(err,null);
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
			if(result.length>=1){
				res.render('restaurants');
			}else{
				res.render('login_page');
			}
		})
	});
}
const handle_regsiter = (req, res)=>{
	const client = new MongoClient(mongourl);
	client.connect((err) => {
		assert.equal(null, err);
		console.log("Connected successfully to server");
		const db = client.db(dbName);
		var criteria={};
		criteria['username'] = req.fields.uname;
		criteria['password'] = req.fields.password;
		db.collection('user').insert(criteria);
		res.status(200).render('info', {message: `regester sucessfully`})
		client.close();
		console.log("Closed DB connection");
		});
}






app.get('/', (req,res) => {
    res.redirect('/login_page');
})

app.get('/login_page', (req,res) => {
    res.render('login_page');
})

app.post('/login', (req,res) => {
	handle_login(req, res);
})

app.get('/register_page', (req,res) => {	
	res.render('register_page');
})

app.post('/register', (req,res) => {
	handle_regsiter(req, res);
})

app.get('/restaurants', (req,res) => {
    res.render('restaurants');
})

app.listen(app.listen(process.env.PORT || 8099));
