var express = require('express');
var moment = require('moment');
moment.relativeTimeThreshold('m', 51);
var router = express.Router();
var channel = 'garage-events';
var db = require('../database');
var convertDoorState = require('../garagedoor').convertDoorState;
var smsSecret = process.env.SMSSECRET.toLowerCase();

var fetchStatus = function (door, io) {
    door.checkStatus(function (status) {
        if (status) {
            io.to(channel).emit('garage-door-status', status);
        }
    });
};

var fetchStats = function (io) {
    db.stats.lastOpened(function (lastOpen) {
        db.stats.lastClosed(function (lastClosed) {
            db.stats.amount(function (amount) {
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

    router.post('/refresh', function (req, res) {
        fetchStats(res.emitter);
        fetchStatus(door, res.emitter);
        res.sendStatus(202);
    });

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
        db.stats.newEvent(data.event, data.when, data.data);
        console.log('Publishing Event ' + data.event + ' on ' + channel + ': ' + JSON.stringify(data));
        var handler = eventHandlers[data.event];
        if (handler) {
            handler(data, res.emitter);
        } else {
            console.log('No event handler for ' + data.event);
        }
        res.sendStatus(202);
    });

    router.post('/sms', function (req, res) {
        res.set('content-type', 'text/plain');
        var from = req.body.From;
        var body = req.body.Body;
        console.log('Received ' + body + ' from ' + from);

        db.people.findByPhone(from, function (person) {
            var canToggle = body.toLowerCase() === smsSecret;
            console.log(body.toLowerCase() + " " + smsSecret);
            if (person) {
                if (person.canToggleDoor) {
                    console.log('Toggling garage door for ' + from);
                    door.toggle();
                    res.send('toggled');
                } else if (canToggle) {
                    person.canToggleDoor = true;
                    person.save();
                    res.send('Success! All future messages will now toggle the garage door.');
                } else {
                    console.log('Failed attempt from ' + from);
                    res.sendStatus(403);
                }
                person.lastHeard = new Date();
                person.save();
            } else {
                console.log('No record of someone from ' + from);
                console.log(smsSecret);
                db.people.add(from, canToggle);
                if (canToggle) {
                    res.send('Welcome, all future messages will now toggle the garage door.');
                } else {
                    res.send('Incorrect. You will not receive any more responses until you send me the secret phrase.');
                }
            }
        });

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
