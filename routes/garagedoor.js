var express = require('express');
var moment = require('moment');
moment.relativeTimeThreshold('m', 51);
var router = express.Router();
var channel = 'garage-events';
var newEvent = require('../database').newEvent;
var Stats = require('../database').Stats;
var convertDoorState = require('../garagedoor').convertDoorState;

var fetchStatus = function (door, io) {
    door.checkStatus(function (status) {
        if (status) {
            io.to(channel).emit('garage-door-status', status);
        }
    });
};

var fetchStats = function (io) {
    Stats.lastOpened(function (lastOpen) {
        Stats.lastClosed(function (lastClosed) {
            Stats.amount(function (amount) {
                var stats = {
                    lastOpen: lastOpen.when,
                    lastOpenDisplay: moment(lastOpen.when).fromNow(),
                    lastClosed: lastClosed.when,
                    lastClosedDisplay: moment(lastClosed.when).fromNow(),
                    timeLastOpen: moment.duration(lastClosed.when - lastOpen.when, moment.SECOND).seconds(),
                    amount: amount
                };
                io.to(channel).emit('garage-stats', stats);
            });
        });
    });
};

var eventHandlers = {
    'garage-door-state-change': function (info, io) {
        var doorState = parseInt(info.data);
        io.to(channel).emit('garage-door-status', {
            status: doorState,
            display: convertDoorState(doorState)
        });
        fetchStats(io);
    },
    'garage-door-toggled': function (info, io) {
        io.to(channel).emit('garage-door-toggled');
    }
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
        newEvent(data.event, data.when, data.data);
        console.log('Publishing Event ' + data.event + ' on ' + channel + ': ' + JSON.stringify(data));
        var handler = eventHandlers[data.event];
        if (handler) {
            handler(data, res.emitter);
        } else {
            console.log('No event handler for ' + data.event);
        }
        res.sendStatus(202);
    });

    return router;
};

module.exports = function (io, door) {
    console.log('Initializing garage door controller for door controlled via photon ' + door.photonName);
    io.on('connection', function (client) {
        client.join(channel);
        fetchStatus(door, io);
        fetchStats(io);
    });
    return routerBuilder(door);
};
