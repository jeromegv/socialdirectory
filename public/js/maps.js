$(document).ready(function() {
    L.map('map', {
        layers: MQ.mapLayer(),
        center: [ 11.977405, 122.665700],
        zoom: 6
    });
});