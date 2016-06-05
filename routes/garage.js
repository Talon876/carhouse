var express = require('express');
var request = require('request');
var router = express.Router();
var token = process.env.TOKEN || 'your-particle-auth-token';

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

router.post('/toggle', function(req, res) {
    var toggleDoor = {
        url: BASE_URL + '/toggle',
        method: 'post',
        qs: { 'access_token': token }
    };
    request(toggleDoor, function(err, resp, body) {
        if (!err) {
            res.end('ok');
        } else {
            res.end('fail');
        }
    });
});

var eventHandlers = {
    'garage-door-state-change': function(info) {
        var doorState = convertDoorState(parseInt(info.data));
        var when = info.published_at;
        console.log('Door is ' + doorState + ' as of ' + when);
    },
    'garage-door-toggled': function(info) {
        var when = info.published_at;
        console.log('Door was toggled at ' + when);
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

module.exports = router;