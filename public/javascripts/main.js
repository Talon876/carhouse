(function() {

    var toggleDoor = function() {
        var request = new XMLHttpRequest();
        request.open('POST', '/toggle', true);
        request.onload = function() {
            if (request.status >= 200 && request.status < 400) {
                var data = request.responseText;
                console.log(data);
            } else { console.log('Request failed'); }
        };
        request.send();
    };

    var toggleDoorButton = document.getElementById('doorToggle');
    toggleDoorButton.onclick = function() {
        console.log('Toggling garage door.');
        toggleDoor();
    };
}());
