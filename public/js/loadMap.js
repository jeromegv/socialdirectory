function generateVisualization(latitude,longitude){
	var map = L.map('map', {
        layers: MQ.mapLayer(),
        center: [ latitude, longitude],
        zoom: 6,
        minZoom: 5,
        detectRetina:true
    });

	var marker = L.marker([latitude,longitude]);
	map.addLayer(marker);
	//todo show popover on click with address
	marker.on('click',function (e) {
		console.log(entry);
	});
}