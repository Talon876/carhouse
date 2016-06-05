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
            cb({
                status: info.result,
                display: convertDoorState(info.result)
            });
        } else {
            console.error('Error retrieving door status ' + JSON.stringify(err));
            cb(null);
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
