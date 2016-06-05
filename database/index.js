var Sequelize = require('sequelize');
var dbfile = process.env.DBFILE || 'database.db';

var sequelize = new Sequelize('garagedb', null, null, {
    dialect: 'sqlite',
    storage: dbfile
});

var GarageEvent = sequelize.define('garage_events', {
    eventId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    kind: {
        type: Sequelize.STRING
    },
    data: {
        type: Sequelize.STRING
    },
    when: {
        type: Sequelize.DATE
    }
}, {
    underscored: true,
    updatedAt: false
});

var generateEvent = function (kind, when, data) {
    GarageEvent.create({
        kind: kind,
        when: when,
        data: data
    }).then(function (event) {
        console.log('Created ' + JSON.stringify(event));
    });
};

module.exports = {
    init: function () {
        sequelize.sync().then(function() {
            console.log(dbfile + ' database initialized');
        });
    },
    GarageEvent: GarageEvent,
    newEvent: generateEvent
};