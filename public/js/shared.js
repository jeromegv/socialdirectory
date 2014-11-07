function generateVisualization(latitude,longitude,slug){
	var map = L.map('map', {
        layers: MQ.mapLayer(),
        center: [ latitude, longitude],
        zoom: 10,
        minZoom: 5,
        detectRetina:true
    });

	var marker = L.marker([latitude,longitude]);
	map.addLayer(marker);
	var popupLoaded = false;
	//show address when clicking on popover
	marker.on('click',function (e) {
		if (!popupLoaded){
			jQuery.getJSON('/api/organization/'+slug, function(organization) {
				marker.bindPopup("<h4>"+organization.name+"</h4>"+organization.Location.address).openPopup();
			});
			popupLoaded=true;
		}
	});

	//there's a bug with leaflet when using inside a bootstrap tab, force a refresh when the tab loads
	$('a[data-toggle="tab"]').on("shown.bs.tab", function() {
	    L.Util.requestAnimFrame(map.invalidateSize,map,!1,map._container);
	});
};

function generateAllVisualization(){
	var map = L.map('mapall', {
        layers: MQ.mapLayer(),
        center: [ 12.277405, 122.665700],
        zoom: 6,
        minZoom: 4,
        detectRetina:true
    });

	jQuery.getJSON('/api/organization', function(organizations) {
    	organizations.forEach(function(entry,index) {
    		if (entry.Location.latitude!=null && entry.Location.latitude!=null){
    			var marker = L.marker([entry.Location.latitude,entry.Location.longitude]);
    			map.addLayer(marker);
    			marker.on('click',function (e) {
					marker.bindPopup("<h4><a href='/organization/"+entry.name_slug+"'>"+entry.name+"</a></h4>"+entry.Location.address).openPopup();
					//TODO add abbreviation of "About the organization"
				});
    		}
    	});
    });
};

$(document).ready(function() {

	//sidebar click to hide navigation
	if ($(window).width() >= 768) {
		$("#collapse1").addClass('in');
	}
	//slideshow slick
	$('.slick').each(function(i) {
	    $(this).slick({
		  	lazyLoad: 'ondemand',
		  	infinite:true
		});
	});

	//enable the autocomplete search as you type (azure suggestions) on the searchbar
    //call the internal API for the query and show results returned by API
	$( "#search" ).autocomplete({
		source: function( request, response ) {
			$.ajax({
			  url: "/searchorganization",
			  data: {
			    search: request.term
			  },
			  success: function( data ) {
			    response( data );
			  }
			});
		},
		minLength: 3,
		appendTo: $("#search").parent(),
		select: function( event, ui ) {
			window.location.href = '/organization/'+ui.item.name_slug
		},
		focus: function (event, ui) {
			this.value = ui.item['@search.text'];
			event.preventDefault(); 
		}

    })
    .autocomplete( "instance" )._renderItem = function( ul, item ) {
      return $( "<li>" )
        .append( "<a href='/organization/"+item.name_slug+"'>" + item['@search.text'] + "</a>" )
        .appendTo( ul );
    };
    //switch arrows up/down on explore navigation
    $('.panel').on('hide.bs.collapse', function () {
		$(this).find("i").removeClass("fa-caret-down");
		$(this).find("i").addClass("fa-caret-up");
	});
	$('.panel').on('show.bs.collapse', function () {
		$(this).find("i").addClass("fa-caret-down");
		$(this).find("i").removeClass("fa-caret-up");
	});

	$(".clickable").click(function (e) {
        e.preventDefault();
        $(this).parent().find(".tgl_c").slideToggle(300);
        if ($(this).hasClass("active")) {
            $(this).removeClass('active');
            $(this).find("i").addClass("fa-caret-down");
            $(this).find("i").removeClass("fa-caret-up");
        } else {
            $(this).addClass('active');
            $(this).find("i").removeClass("fa-caret-down");
            $(this).find("i").addClass("fa-caret-up");
        }
    });
    //form validation on contact us page
    $('#contactus').parsley({
	  successClass: 'success',
	  errorClass: 'error',
	  classHandler: function(el) {
	    return el.$element.closest(".form-group");
	  },
	  errorsWrapper: '<span class=\"help-inline\"></span>',
	  errorTemplate: '<span></span>'
	});
	//smooth scrolling
	var $root = $('html, body');
	$('a[href*=#]').click(function() {
		var href = $.attr(this, 'href');
		if (href!='#' && href!='#general' && href!='#additionalresources' && href!='#contactinfo' && href.substr(0,1)!='/'){
			    $root.animate({
		        scrollTop: $('[name="' + href.substr(1) + '"]').offset().top
		    }, 500, function () {
		        window.location.hash = href;
		    });
	    } else {
	    	return true;
	    }
	    return false;
	});
});