document.addEventListener('DOMContentLoaded', function () {
    //var toggleDoor = function() {
    //    var request = new XMLHttpRequest();
    //    request.open('POST', '/toggle', true);
    //    request.onload = function() {
    //        if (request.status >= 200 && request.status < 400) {
    //            var data = request.responseText;
    //            console.log(data);
    //        } else { console.log('Request failed'); }
    //    };
    //    request.send();
    //};
    //
    //var toggleDoorButton = document.getElementById('doorToggle');
    //toggleDoorButton.onclick = function() {
    //    console.log('Toggling garage door.');
    //    toggleDoor();
    //};

    var socket = io.connect({
        transports: ['websocket', 'polling']
    });
    //var doorStatus = document.getElementById('doorStatus');
    //var stats = document.getElementById('stats');
    socket.on('garage-door-state-change', function (newState) {
        var message = 'Garage door is now ' + newState + '.';
        console.log(message);
        doorStatus.innerText = message;
    });
    socket.on('garage-door-toggled', function () {
        console.log('Garage door was toggled');
    });
    socket.on('garage-stats', function (stats) {
        console.log('Received Stats: ' + JSON.stringify(stats));
    });
    socket.on('garage-door-status', function (status) {
        console.log("garage door is " + status.display);
    });

});
