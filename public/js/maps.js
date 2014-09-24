$(document).ready(function() {
    var map = L.map('map', {
        layers: MQ.mapLayer(),
        center: [ 12.277405, 122.665700],
        zoom: 6,
        minZoom: 5
    });

    jQuery.getJSON('/api/organization', function(organizations) {
    	organizations.forEach(function(entry,index) {
    		if (entry.Location.latitude!=null && entry.Location.latitude!=null){
    			var marker = L.marker([entry.Location.latitude,entry.Location.longitude]);
    			map.addLayer(marker);
    			marker.on('click',function (e) {
					console.log(entry);
				});
    		}
    	});
    });
});