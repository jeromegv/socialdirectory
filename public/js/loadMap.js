function generateVisualization(latitude,longitude,organization){
	var map = L.map('map', {
        layers: MQ.mapLayer(),
        center: [ latitude, longitude],
        zoom: 10,
        minZoom: 5,
        detectRetina:true
    });

	var marker = L.marker([latitude,longitude]);
	map.addLayer(marker);
	//todo show popover on click with address
	marker.on('click',function (e) {
		console.log(e);
	});

	//there's a bug with leaflet when using inside a bootstrap tab, force a refresh when the tab loads
	$('a[data-toggle="tab"]').on("shown.bs.tab", function() {
	    //$("#map").invalidateSize(false);
	    L.Util.requestAnimFrame(map.invalidateSize,map,!1,map._container);
	});
}