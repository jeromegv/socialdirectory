'use strict';

function generateVisualization(latitude,longitude,slug){
	
	var map = L.map('map', {
        layers: MQ.mapLayer(),
        center: [ latitude, longitude],
        zoom: 10,
        minZoom: 5,
        detectRetina:true
    });
	L.Icon.Default.imagePath = '/components/leaflet/dist/images/';
	var marker = L.marker([latitude,longitude]);
	map.addLayer(marker);
	var popupLoaded = false;
	//show address when clicking on popover
	if (!popupLoaded){
		jQuery.getJSON('/api/organization/'+slug, function(organization) {
			marker.bindPopup('<h4>'+organization.name+'</h4>'+organization.Location.address);
		});
		popupLoaded=true;
	}

	//there's a bug with leaflet when using inside a bootstrap tab, force a refresh when the tab loads
	$('a[data-toggle="tab"]').on('shown.bs.tab', function() {
	    L.Util.requestAnimFrame(map.invalidateSize,map,!1,map._container);
	});
}

function generateAllVisualization(currentFilters){
	//things to do when the page is loaded first, look at the filter selected in the URL 
	//and hide the related refinement menus
	_.forEach(currentFilters,function(filter) { 
		$('#'+filter.refinementName).hide(0);
	});
	//expand the first navigation menu that is visible
	if ($(window).width() >= 768 && currentFilters.length<3) {
		$( '.collapse' ).each(function() {
			if ($(this).parent( '.panel' ).is(':visible')){
				$(this).collapse({'toggle': true, 'parent': '#accordion' });
				return false;
			}
		});
	}

	//create and display map
	var map = L.map('mapall', {
        minZoom: 4
    });
    map.setView([ 12.277405, 122.665700], 5);
    L.tileLayer('http://{s}.tiles.mapbox.com/v3/jeromegv.kk20fege/{z}/{x}/{y}.png', {
	    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
	    detectRetina: true
	}).addTo(map);
    L.Icon.Default.imagePath = '/components/leaflet/dist/images/';
	var organizationsLoaded;
	var organizationsLoadedFiltered;
	var markers = L.markerClusterGroup({showCoverageOnHover:false,maxClusterRadius:40});
	jQuery.getJSON('/api/organization?light=true', function(organizations) {
    	organizationsLoaded = organizations;
    	//for the first load, based on the URL, only show the org that should be shown
    	organizationsLoadedFiltered = filterOrganizations(organizations,currentFilters);
    	//refresh the map
    	refreshAllMarkers(organizationsLoadedFiltered);
    });

    function refreshAllMarkers(organizations) {
    	markers.clearLayers();
    	organizations.forEach(function(entry,index) {
    		if (entry.Location.latitude!=null && entry.Location.latitude!=null){
    			var marker = L.marker([entry.Location.latitude,entry.Location.longitude]);
    			markers.addLayer(marker);
    			marker.bindPopup('<h4><a href="/organization/'+entry.name_slug+'">'+entry.name+'</a></h4>'+entry.Location.address);
    		}
    	});
    	map.addLayer(markers);
    	//auto zoom to fit all the markers
	    map.fitBounds(markers.getBounds().pad(0.5),{maxZoom:13});
    }

	//compile how many refinements and which refinement should be shown in navigation
	function createRefinements(organizations,field){
		var result = _.reduce(organizations, function (prev, current) {
			var index;
			if (Array.isArray(current[field])){
				current[field].forEach(function(tag,index) {
					index = _.findIndex( prev, {'name':tag});
					if (index=== -1 ){
						prev.push({'name': tag, 'val': 1});
					} else {
						prev[index].val = prev[index].val+1;
					}
				});
			} else {
				index = _.findIndex( prev, {'name':current[field]});
				if (index=== -1 ){
					prev.push({'name': current[field], 'val': 1});
				} else {
					prev[index].val = prev[index].val+1;
				}
			}
			return prev;
		}, []);
		result = _.sortBy(result, 'val').reverse(); 

		return result;
	}
	//function to execute once someone click on a refinement or remove a selected one
	//this refresh all the refinements in the navigation
	function updateRefinementList(organizations){
		var activeRefinementBusiness = createRefinements(organizations,'primaryBusinessSector_1');
		var activeRefinementSocial = createRefinements(organizations,'socialPurposeCategoryTags');
		var activeRefinementDemographic = createRefinements(organizations,'demographicImpact');

		var items = [];
		//update list of refinements in each section
		$('#primaryBusinessSector_1').find('li').remove();
		items = [];
		$.each( activeRefinementBusiness, function( key, val ) {
			items.push('<li> <a href="javascript:void(0)" onclick="filterRefinement(\'primaryBusinessSector_1\',\''+val.name+'\')" class="pull-left">'+val.name+'</a><span class="badge">'+val.val+'</span></li>');
		});
		$('#primaryBusinessSector_1').find('ul').append(items);

		$('#socialPurposeCategoryTags').find('li').remove();
		items = [];
		$.each( activeRefinementSocial, function( key, val ) {
			items.push('<li> <a href="javascript:void(0)" onclick="filterRefinement(\'socialPurposeCategoryTags\',\''+val.name+'\')" class="pull-left">'+val.name+'</a><span class="badge">'+val.val+'</span></li>');
		});
		$('#socialPurposeCategoryTags').find('ul').append(items);

		$('#demographicImpact').find('li').remove();
		items = [];
		$.each( activeRefinementDemographic, function( key, val ) {
			items.push('<li> <a href="javascript:void(0)" onclick="filterRefinement(\'demographicImpact\',\''+val.name+'\')" class="pull-left">'+val.name+'</a><span class="badge">'+val.val+'</span></li>');
		});
		$('#demographicImpact').find('ul').append(items);
	}
	//filter the organization object based on all the filters currently selected
	function filterOrganizations(organizations,filters){
		var organizationsFiltered=organizations;
		_(filters).forEach(function(filter) { 
			organizationsFiltered = _.filter(organizationsFiltered, function(org) { 
				if (Array.isArray(org[filter.refinementName])){
					var found=false;
					_.forEach(org[filter.refinementName],function(orgRefValue) { 
						if (orgRefValue==filter.refinementValue){
							found=true;
							return true;
						} 
					});
					if (found){
						return true;
					}
				} else {
					if (org[filter.refinementName]==filter.refinementValue){
						return true;
					}
				}
			});
		});
		return organizationsFiltered;
	}
	//go over each org logo and hide or show them based on the filtered org object
	function updateLogos(organizations){
		var orgNamesLoaded = _.pluck(organizations, 'name');
		//for transition sake, we want to hide everything before we start fading in
		$( '.product_c h5' ).each(function() {
			if (!(_.contains(orgNamesLoaded,$( this ).text()))){
				$( this ).closest('.col-md-4').hide();
			}
		});
		$( '.product_c h5' ).each(function() {
			if (_.contains(orgNamesLoaded,$( this ).text())){
				$( this ).closest('.col-md-4').fadeIn();
			}
		});
	}
	function convertToSlug(Text)
	{
	    return Text
	        .toLowerCase()
	        .replace(/[^\w ]+/g,'')
	        .replace(/ +/g,'-')
	        ;
	}
	//build URL when selecting refinement
	function getSEOUrl(filters){
		var url='/explore';
		_(filters).forEach(function(filter) { 
			var refinementNameBeautiful = filter.refinementName;
			if (filter.refinementName=='primaryBusinessSector_1'){
				refinementNameBeautiful = 'business';
			} else if (filter.refinementName=='socialPurposeCategoryTags') {
				refinementNameBeautiful = 'social';
			} else if (filter.refinementName=='demographicImpact') {
				refinementNameBeautiful = 'impact';
			}
			url = url+'/'+refinementNameBeautiful+'/'+convertToSlug(filter.refinementValue)
		});
		return url;
	}
	//action executed when someone click the X on the UI to remove a filter
	window.removeRefinement = function (refinementName,refinementValue,currentRefinementObject){
		if (organizationsLoaded){
			_.remove(currentFilters,
				{
					'refinementName':refinementName,
					'refinementValue':refinementValue
				});
			organizationsLoadedFiltered = filterOrganizations(organizationsLoaded,currentFilters);
			updateRefinementList(organizationsLoadedFiltered);
			updateLogos(organizationsLoadedFiltered);
			window.history.replaceState('', 'title', getSEOUrl(currentFilters));
			$(currentRefinementObject).closest('.whitetag').fadeOut(600, function(){ 
			    $(this).remove();
			});
			$('#'+refinementName).slideDown();
			$('#accordion').find('.collapse.in').collapse({'toggle': true, 'parent': '#accordion' });
			$('#'+refinementName).find('.collapse').collapse({'toggle': true, 'parent': '#accordion' });
			//refresh the map
			refreshAllMarkers(organizationsLoadedFiltered);
		}
	};
	//action to do to hide a refinement menu
	function hideRefinementMenu(refinementName){
		$('#'+refinementName).find('.collapse').collapse({'toggle': true, 'parent': '#accordion' });
		//try to show the next refinement if there are still some left to show
		if (currentFilters.length<3){
			if ($('#'+refinementName).next().find('.collapse').parent( '.panel' ).is(':visible')){
				var element = $('#'+refinementName).next().find('.collapse').collapse({'toggle': true, 'parent': '#accordion' });
			} else {
				$('#'+refinementName).prev().find('.collapse').collapse({'toggle': true, 'parent': '#accordion' });
			}
		}
	}
	//action executed from browser when someone click on a refinement
	window.filterRefinement = function(refinementName,refinementValue) {
		if (organizationsLoadedFiltered){
			var refinementFilter = {
				'refinementName':refinementName,
				'refinementValue':refinementValue
			};
			currentFilters.push(refinementFilter);
			organizationsLoadedFiltered = filterOrganizations(organizationsLoaded,currentFilters);
			updateLogos(organizationsLoadedFiltered);
			window.history.replaceState('', 'title', getSEOUrl(currentFilters));
			//add selected refinements
			$('#selectedTags').append('<div class="whitetag"><h2>'+refinementValue+'<a href="javascript:void(0)" onclick="removeRefinement(\''+refinementName+'\',\''+refinementValue+'\',this)"><i class="fa fa-close"></i></a></h2></div>').hide().fadeIn(600);
			//hide current navigation menu + show next one available
			$('#'+refinementName).slideUp(600);
			hideRefinementMenu(refinementName);
			//update the count of refinement in each category
			updateRefinementList(organizationsLoadedFiltered);
			//refresh the map
			refreshAllMarkers(organizationsLoadedFiltered);
		}
	};
}

$(document).ready(function() {

	//slideshow slick
	$('.slick').each(function(i) {
	    $(this).slick({
		  	lazyLoad: 'ondemand',
		  	infinite:true
		});
	});

	//enable the autocomplete search as you type (azure suggestions) on the searchbar
    //call the internal API for the query and show results returned by API
	$( '#search' ).autocomplete({
		source: function( request, response ) {
			$.ajax({
			  url: '/searchorganization',
			  data: {
			    search: request.term
			  },
			  success: function( data ) {
			    response( data );
			  }
			});
		},
		minLength: 3,
		appendTo: $('#search').parent(),
		select: function( event, ui ) {
			window.location.href = '/organization/'+ui.item.name_slug;
		},
		focus: function (event, ui) {
			this.value = ui.item['@search.text'];
			event.preventDefault(); 
		}

    })
    .autocomplete( 'instance' )._renderItem = function( ul, item ) {
      return $( '<li>')
        .append( '<a href="/organization/'+item.name_slug+'">' + item['@search.text'] + '</a>' )
        .appendTo( ul );
    };
    //switch arrows up/down on explore navigation
    $('.panel').on('hide.bs.collapse', function () {
		$(this).find('i').removeClass('fa-caret-down');
		$(this).find('i').addClass('fa-caret-up');
	});
	$('.panel').on('show.bs.collapse', function () {
		$(this).find('i').addClass('fa-caret-down');
		$(this).find('i').removeClass('fa-caret-up');
	});

	$('.clickable').click(function (e) {
        e.preventDefault();
        $(this).parent().find('.tgl_c').slideToggle(300);
        if ($(this).hasClass('active')) {
            $(this).removeClass('active');
            $(this).find('i').addClass('fa-caret-down');
            $(this).find('i').removeClass('fa-caret-up');
        } else {
            $(this).addClass('active');
            $(this).find('i').removeClass('fa-caret-down');
            $(this).find('i').addClass('fa-caret-up');
        }
    });
	//smooth scrolling on home page links buttons
	var $root = $('html, body');
	$('.smoothscroll').click(function() {
		var href = $.attr(this, 'href');
		$root.animate({
	        scrollTop: $('[name="' + href.substr(1) + '"]').offset().top
	    }, 500, function () {
	        window.location.hash = href;
	    });
	    return false;
	});
});