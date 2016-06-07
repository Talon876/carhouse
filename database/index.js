var Sequelize = require('sequelize');
var dbfile = process.env.DBFILE || 'database.db';

var CLOSED = '1';
var OPEN = '0';

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

var Person = sequelize.define('people', {
    personId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    displayName: {
        type: Sequelize.STRING
    },
    phone: {
        type: Sequelize.STRING,
        unique: true
    },
    lastHeard: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    },
    canToggleDoor: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    }
}, {
    underscored: true
});

var Message = sequelize.define('messages', {
    messageId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    from: {
        type: Sequelize.STRING
    },
    body: {
        type: Sequelize.STRING
    }
}, {
    underscored: true,
    updatedAt: false
});

var messages = {
    add: function (from, body) {
        Message.create({
            from: from,
            body: body
        });
    }
};

var people = {
    add: function (phone, canToggle) {
        Person.create({
            phone: phone,
            displayName: phone,
            canToggleDoor: canToggle || false
        });
    },
    findByPhone: function (phone, cb) {
        Person.findOne({
            where: {
                phone: phone
            }
        }).then(cb);
    }
};

var generateEvent = function (kind, when, data) {
    GarageEvent.create({
        kind: kind,
        when: when,
        data: data
    }).then(function (event) {
        console.log('Created ' + JSON.stringify(event));
    });
};

var getLastState = function (data, cb) {
    GarageEvent.findOne({
        where: {
            data: data
        },
        order: [['when', 'DESC']]
    }).then(cb);
};

var getEventAmount = function (cb) {
    GarageEvent.count().then(cb);
};

var getLastOpened = function (cb) {
    getLastState(OPEN, cb);
};
var getLastClosed = function (cb) {
    getLastState(CLOSED, cb);
};

module.exports = {
    init: function () {
        sequelize.sync().then(function () {
            console.log(dbfile + ' database initialized');
        });
    },
    stats: {
        lastOpened: getLastOpened,
        lastClosed: getLastClosed,
        amount: getEventAmount,
        newEvent: generateEvent
    },
    people: people,
    messages: messages
};