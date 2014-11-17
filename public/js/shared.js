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
	var organizationsLoaded;
	var organizationsLoadedFiltered;
	var currentFilters=[];
	jQuery.getJSON('/api/organization', function(organizations) {
    	organizationsLoaded = organizations;
    	organizationsLoadedFiltered = organizations;
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

	function createRefinements(organizations,field){
		var result = _.reduce(organizations, function (prev, current) {
			if (Array.isArray(current[field])){
				current[field].forEach(function(tag,index) {
					var index = _.findIndex( prev, {'name':tag});
					if (index=== -1 ){
						prev.push({'name': tag, 'val': 1});
					} else {
						prev[index].val = prev[index].val+1;
					}
				});
			} else {
				var index = _.findIndex( prev, {'name':current[field]});
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
	function updateRefinementList(organizations){
		var activeRefinementBusiness = createRefinements(organizations,'primaryBusinessSector_1');
		var activeRefinementSocial = createRefinements(organizations,'socialPurposeCategoryTags');
		var activeRefinementDemographic = createRefinements(organizations,'demographicImpact');

		var items = [];
		//update list of refinements in each section
		$("#primaryBusinessSector_1").find("li").remove();
		items = [];
		$.each( activeRefinementBusiness, function( key, val ) {
			items.push('<li> <a href="javascript:void(0)" onclick="filterRefinement(\'primaryBusinessSector_1\',\''+val.name+'\')" class="pull-left">'+val.name+'</a><span class="badge">'+val.val+'</span></li>');
		});
		$("#primaryBusinessSector_1").find("ul").append(items);

		$("#socialPurposeCategoryTags").find("li").remove();
		items = [];
		$.each( activeRefinementSocial, function( key, val ) {
			items.push('<li> <a href="javascript:void(0)" onclick="filterRefinement(\'socialPurposeCategoryTags\',\''+val.name+'\')" class="pull-left">'+val.name+'</a><span class="badge">'+val.val+'</span></li>');
		});
		$("#socialPurposeCategoryTags").find("ul").append(items);

		$("#demographicImpact").find("li").remove();
		items = [];
		$.each( activeRefinementDemographic, function( key, val ) {
			items.push('<li> <a href="javascript:void(0)" onclick="filterRefinement(\'demographicImpact\',\''+val.name+'\')" class="pull-left">'+val.name+'</a><span class="badge">'+val.val+'</span></li>');
		});
		$("#demographicImpact").find("ul").append(items);
	}
	function filterOrganizations(organizations,filters){
		var organizationsFiltered=organizations;
		_(filters).forEach(function(filter) { 
			refinementName= filter.refinementName; 
			refinementValue = filter.refinementValue;
			organizationsFiltered = _.filter(organizationsFiltered, function(org) { 
				if (Array.isArray(org[refinementName])){
					var found=false;
					_.forEach(org[refinementName],function(orgRefValue) { 
						if (orgRefValue==refinementValue){
							found=true
							return true;
						}; 
					});
					if (found){
						return true;
					}
				} else {
					if (org[refinementName]==refinementValue){
						return true;
					}
				}
			});
		})	
		return organizationsFiltered;
	}
	function updateLogos(organizations){
		var orgNamesLoaded = _.pluck(organizations, 'name');
		//for transition sake, we want to hide everything before we start fading in
		$( ".product_c h5" ).each(function() {
			if (!(_.contains(orgNamesLoaded,$( this ).text()))){
				$( this ).closest(".col-md-4").hide();
			}
		});
		$( ".product_c h5" ).each(function() {
			if (_.contains(orgNamesLoaded,$( this ).text())){
				$( this ).closest(".col-md-4").fadeIn();
			}
		});
	}
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
			$(currentRefinementObject).closest(".whitetag").fadeOut(600, function(){ 
			    $(this).remove();
			});
			$("#"+refinementName).slideDown();
			$("#accordion").find(".collapse.in").removeClass("in");
			$("#"+refinementName).find(".collapse").collapse('show');
		}

	}
	window.filterRefinement = function(refinementName,refinementValue) {
		if (organizationsLoadedFiltered){
			var refinementFilter = {
				'refinementName':refinementName,
				'refinementValue':refinementValue
			};
			currentFilters.push(refinementFilter);
			organizationsLoadedFiltered = filterOrganizations(organizationsLoaded,currentFilters);
			updateLogos(organizationsLoadedFiltered);

			//add selected refinements
			$("#selectedTags").append('<div class="whitetag"><h5>'+refinementValue+'<a href="javascript:void(0)" onclick="removeRefinement(\''+refinementName+'\',\''+refinementValue+'\',this)"><i class="fa fa-close"></i></a></h5></div>').hide().fadeIn(600);
			//hide current navigation menu + show next one available
			$("#"+refinementName).slideUp(600);
			$("#"+refinementName).find(".collapse").first().removeClass("in");
			if ($("#"+refinementName).next().find(".collapse").parent( ".panel" ).is(":visible")){
				var element = $("#"+refinementName).next().find(".collapse").first();
				element.addClass("in");
			} else {
				$("#"+refinementName).prev().find(".collapse").first().addClass("in");
			}
			updateRefinementList(organizationsLoadedFiltered);
		}
	}
			/*
			var orgCross = crossfilter(organizationsLoaded);
			var byId = orgCross.dimension(function(p) { return p._id; });
			var byPrimaryBusinessSector_1 = orgCross.dimension(function(p) { return p.primaryBusinessSector_1; });
			var bySocialPurposeCategoryTags = orgCross.dimension(function(p) { return p.socialPurposeCategoryTags; });
			var byDemographicImpact = orgCross.dimension(function(p) { return p.demographicImpact; });
			
			//filter based on the refinement chosen
			if (refinementName=='primaryBusinessSector_1'){
				byPrimaryBusinessSector_1.filter(refinementValue);
			} else if (refinementName=='socialPurposeCategoryTags'){
				bySocialPurposeCategoryTags.filterFunction(function(tags) { 
					return _.contains(tags,refinementValue);				
				});
			} else if (refinementName=='demographicImpact'){
				byDemographicImpact.filterFunction(function(tags) { 
					return _.contains(tags,refinementValue);				
				});
			}
			//for list of org
			byId.top(Infinity).forEach(function(org, i) {
				console.log('org');
				console.log(org);
			});
			//for guided nav
			byPrimaryBusinessSector_1.group().top(Infinity).forEach(function(group, i) {
				if (group.value>0){
					console.log('group primary');
					console.log(group.key);
					console.log(group.value);
				}
			});
			function reduceAdd(attr) {
				return function(p,v) {
				  v[attr].forEach (function(val, idx) {
				     p[val] = (p[val] || 0) + 1; //increment counts
				  });
				  return p;
				};
			}
			function reduceRemove(attr) {
				return function(p,v) {
				  v[attr].forEach (function(val, idx) {
				     p[val] = (p[val] || 0) - 1; //decrement counts
				  });
				  return p;
				};
			}

			function reduceInitial() {
			  return {};  
			}
			//for guided nav

			var group = byDemographicImpact.groupAll().reduce(reduceAdd('demographicImpact'), reduceRemove('demographicImpact'), reduceInitial).value();
			group.all = function() {
			  var newObject = [];
			  for (var key in this) {
			  	console.log(key);
			    if (this.hasOwnProperty(key) && key != "all") {
			      newObject.push({
			        key: key,
			        value: this[key]
			      });
			    }
			  }
			  return newObject;
			}
			group.all().forEach(function(group, i) {
				//if (group.value>0){
					console.log('demo refinement');
					console.log(group.key);
					console.log(group.value);
				//}
			});*/
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