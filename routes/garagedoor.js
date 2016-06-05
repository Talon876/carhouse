var express = require('express');
var router = express.Router();
var channel = 'garage-events';

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
        res.sendStatus(202);
    });

    return router;
};

module.exports = function (io, door) {
    console.log('Initializing garage door controller for door controlled via photon ' + door.photonName);
    io.on('connection', function (client) {
        console.log('Client ' + client.id + ' connected.');
        client.join(channel);
        fetchStatus(door, io);
    });
    return routerBuilder(door);
};
