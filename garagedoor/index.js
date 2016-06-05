var request = require('request');

var BASE_URL = 'https://api.particle.io/v1/devices/';
var OPEN = 0;
var CLOSED = 1;

function GarageDoor(options) {
    this.token = options.token;
    this.photonName = options.photonName;
}

GarageDoor.prototype.checkStatus = function (cb) {
    var statusOptions = {
        url: this.getDeviceUrl() + '/doorState',
        method: 'get',
        qs: {'access_token': this.token}
    };
    console.log('Checking garage door status using photon ' + this.photonName);
    request(statusOptions, function (err, resp, body) {
        if (!err) {
            var info = JSON.parse(body);
            var results = {
                status: info.result,
                display: convertDoorState(info.result)
            };
            console.log('Garage door is ' + results.display);
            cb(results);
        } else {
            console.error('Error retrieving door status ' + JSON.stringify(err));
            cb(null);
        }
    });
};

GarageDoor.prototype.toggle = function () {
    var toggleDoorOptions = {
        url: this.getDeviceUrl() + '/toggle',
        method: 'post',
        qs: {'access_token': this.token}
    };
    request(toggleDoorOptions, function (err, resp, body) {
        if (err) {
            console.error('Error toggling garage door ' + JSON.stringify(err));
        }
    });
};

GarageDoor.prototype.getDeviceUrl = function () {
    return BASE_URL + this.photonName;
};

var convertDoorState = function (value) {
    if (value === OPEN) {
        return 'open';
    } else if (value === CLOSED) {
        return 'closed';
    } else {
        return 'unknown';
    }
};

module.exports = {
    GarageDoor: function (options) {
        options.token = options.token || 'your-particle-auth-token';
        return new GarageDoor(options);
    },
    OPEN: OPEN,
    CLOSED: CLOSED
};
