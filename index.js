var express = require('express');
var app = express();
var logger = require('morgan');
var bodyParser = require('body-parser');
var server = require('http').Server(app);
var io = require('socket.io')(server);
var garageDoor = require('./garagedoor');

var port = process.env.PORT || 3010;
var token = process.env.TOKEN;

var db = require('./database');
db.init();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(__dirname + '/public'));

//middleware to add the socket.io object to the response object
app.use(function (req, res, next) {
    res.emitter = io;
    next();
});

var door = garageDoor.GarageDoor({
    token: token,
    photonName: 'garage_bro'
});
var garage = require('./routes/garagedoor')(io, door);
app.use('/garage', garage);

app.get('/', function (req, res) {
    res.sendfile('index.html');
});

server.listen(port);
server.on('listening', function () {
    console.log('Listening on port ' + port);
});
