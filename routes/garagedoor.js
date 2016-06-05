var express = require('express');
var router = express.Router();
var channel = 'garage-events';
var newEvent = require('../database').newEvent;

var fetchStatus = function (door, io) {
    door.checkStatus(function (status) {
        if (status) {
            io.to(channel).emit('garage-door-status', status);
        }
    });
};

var routerBuilder = function (door) {
    var router = express.Router();

    router.get('/status', function (req, res) {
        fetchStatus(door, res.emitter);
        res.sendStatus(202);
    });

    router.post('/toggle', function (req, res) {
        door.toggle();
        res.sendStatus(202);
    });

    router.post('/events', function (req, res) {
        var data = {
            event: req.body.event,
            data: req.body.data,
            when: req.body.published_at
        };
        res.emitter.to(channel).emit(data.event, data);
        newEvent(data.event, data.when, data.data);
        res.sendStatus(202);
    });

    return router;
};

module.exports = function (io, door) {
    console.log('Initializing garage door controller for door controlled via photon ' + door.photonName);
    io.on('connection', function (client) {
        client.join(channel);
        fetchStatus(door, io);
    });
    return routerBuilder(door);
};
