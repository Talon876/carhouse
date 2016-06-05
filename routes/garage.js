var express = require('express');
var request = require('request');
var io = require('socket.io');
var newEvent = require('../database').newEvent;
var stats = require('../database').Stats;
var router = express.Router();
var token = process.env.TOKEN || 'your-particle-auth-token';
var smsSecret = process.env.SMSSECRET || 'sms-secret';
var emitter;

var BASE_URL = 'https://api.particle.io/v1/devices/garage_bro';
var OPEN = 0;
var CLOSED = 1;

router.get('/', function(req, res) {
    var statusOptions = {
        url: BASE_URL + '/doorState',
        method: 'get',
        qs: { 'access_token': token }
    };
    request(statusOptions, function(err, resp, body) {
        console.log('Device info: ' + body);
        var status = 'unknown';
        if (!err) {
            var data = JSON.parse(body);
            var doorState = data.result;
            status = convertDoorState(doorState);
        }
        res.render('garage', {
            status: status
        })
    });
});

var toggleDoor = function(cb) {
    var toggleDoorOptions = {
        url: BASE_URL + '/toggle',
        method: 'post',
        qs: { 'access_token': token }
    };
    request(toggleDoorOptions, function(err, resp, body) {
        cb(err, resp, body);
    });
};

router.post('/toggle', function(req, res) {
    toggleDoor(function(err, resp, body) {
        if (!err) {
            res.end('ok');
        } else {
            res.end('fail');
        }
    });
});

var allowed = {};
router.post('/garage/sms', function(req, res) {
    var from = req.body.From;
    var body = req.body.Body;
    console.log('Received ' + body + ' from ' + from);

    if (body === smsSecret) {
        allowed[from] = true;
    }

    if (allowed[from] === true) {
        console.log('Toggling garage door for ' + from);
        toggleDoor(function(err, resp, body) {});
        res.set('content-type', 'text/plain');
        res.send('toggled');
    } else {
        console.log('Failed attempt from ' + from);
        res.sendStatus(403);
    }

});

var eventHandlers = {
    'garage-door-state-change': function(info) {
        var doorState = convertDoorState(parseInt(info.data));
        var when = info.published_at;
        console.log('Door is ' + doorState + ' as of ' + when);
        emitter.to('garage-events').emit('garage-door-state-change', doorState);
        newEvent('garage-door-state-change', new Date(when), info.data);
    },
    'garage-door-toggled': function(info) {
        var when = info.published_at;
        console.log('Door was toggled at ' + when);
        emitter.to('garage-events').emit('garage-door-toggled');
        newEvent('garage-door-toggled', new Date(when), null);
    }
};

router.post('/garage/events', function(req, res) {
    var event = req.body.event;
    var handler = eventHandlers[req.body.event];
    if (handler) {
        handler(req.body);
    } else {
        console.log('No handler found for ' + event);
    }
    res.sendStatus(200);
});

var convertDoorState = function(value) {
    if (value === OPEN) {
        return 'open';
    } else if (value === CLOSED) {
        return 'closed';
    } else {
        return 'unknown';
    }
};

var socketIoHandler = function(server) {
    var socket = io(server);
    emitter = socket;

    socket.on('connection', function (client) {
        console.log('Client ' + client.id + ' joined');
        client.join('garage-events');
        stats.lastOpened(function (openEvent) {
            console.log('Garage door last opened at ' + openEvent.when);
            stats.lastClosed(function (closeEvent) {
                console.log('Garage door last closed at ' + closeEvent.when);
                emitter.to('garage-events').emit('garage-stats', {
                    'lastOpened': openEvent,
                    'lastClosed': closeEvent
                })
            });
        });
    });
};

module.exports = {
    routes: router,
    listen: socketIoHandler
};

module.exports = function(io) {
    return router;
};