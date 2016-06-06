document.addEventListener('DOMContentLoaded', function () {
    var toggleDoor = function () {
        var request = new XMLHttpRequest();
        request.open('POST', '/garage/toggle', true);
        request.onload = function () {
            if (request.status >= 200 && request.status < 400) {
            } else {
                console.log('Request failed');
            }
        };
        request.send();
    };

    var toggleDoorButton = document.getElementById('doorToggle');
    toggleDoorButton.onclick = function () {
        console.log('Toggling garage door.');
        toggleDoor();
    };

    var socket = io.connect({
        transports: ['websocket', 'polling']
    });
    socket.on('garage-door-state-change', function (data) {
        var info = JSON.stringify(data);
        var message = 'Garage door is now ' + info.data + '.';
        console.log(message);
    });
    socket.on('garage-door-toggled', function () {
        console.log('Garage door was toggled');
    });
    socket.on('garage-stats', function (stats) {
        console.group('stats update');
        console.log('Raw Stats: ' + JSON.stringify(stats));

        var lastOpenedDiv = $('#lastOpened');
        var lastOpenedTextDiv = $('strong', lastOpenedDiv);
        lastOpenedDiv.attr('title', new Date(stats.lastOpen));
        lastOpenedTextDiv.fadeOut(function () {
            lastOpenedTextDiv.text(stats.lastOpenDisplay).fadeIn();
        });
        console.log('Last Opened: ' + stats.lastOpenDisplay);

        var secondsOpenDiv = $('#secondsOpen');
        secondsOpenDiv.fadeOut(function () {
            secondsOpenDiv.text(stats.timeLastOpen).fadeIn();
        });
        console.log('Seconds Open: ' + stats.timeLastOpen);

        var eventsRecordedDiv = $('#eventsRecorded');
        eventsRecordedDiv.fadeOut(function () {
            eventsRecordedDiv.text(stats.amount).fadeIn();
        });
        console.log('Events Recorded: ' + stats.amount);
        console.groupEnd();
    });

    socket.on('garage-door-status', function (status) {
        console.log(JSON.stringify(status));
        var doorStatus = $('#doorStatus');
        switch (status.status) {
            case 0: //open
                doorStatus.fadeOut(function () {
                    doorStatus.removeClass('list-group-item-success')
                        .addClass('list-group-item-warning')
                        .text(status.display)
                        .fadeIn();
                });
                break;
            case 1: //closed
                doorStatus.fadeOut(function () {
                    doorStatus.removeClass('list-group-item-warning')
                        .addClass('list-group-item-success')
                        .text(status.display)
                        .fadeIn();
                });
                break;
            default:
                doorStatus.fadeOut(function () {
                    doorStatus.removeClass('list-group-item-warning')
                        .removeClass('list-group-item-success')
                        .text(status.display)
                        .fadeIn();
                });
                break;
        }
    });

});
