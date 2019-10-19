const express = require('express');
const Datastore = require('nedb');
const port = process.env.PORT || 3000;
const app = express();
app.listen(port, () => console.log('listening'));
app.use(express.static('public'));
app.use(express.json({ limit: '1mb' }));

const database = new Datastore('database.db');
database.loadDatabase();

app.post('/api', (request, response) => {
  	const data = request.body;
  	const timestamp = Date.now();
    data.timestamp = timestamp;
  	response.json(data);
  	database.insert(data);
  	console.log(data);
});

app.get('/api', (request, response) => {
        database.find({}, function (err,docs){
        response.json(docs);
    });
});
