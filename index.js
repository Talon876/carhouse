var express = require('express');
var app = express();
var logger = require('morgan');
var bodyParser = require('body-parser');
var server = require('http').Server(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3010;

var db = require('./database');
db.init();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
    res.sendfile('index.html');
});

var garage = require('./routes/garage')(io);
app.use('/', garage);

io.on('connection', function (client) {
    console.log('Client ' + client.id + ' connected.');
    client.join('eventstream');
});

server.listen(port);
server.on('listening', function() {
    console.log('Listening on port ' + port);
});