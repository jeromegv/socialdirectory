$(document).ready(function() {
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
    //slideshow slick
	$('.slick').each(function(i) {
	    $(this).slick({
		  	lazyLoad: 'ondemand',
		  	infinite:true
		});
	});
	//sidebar click to hide navigation
	$(".sidebar h5").click(function (e) {
        e.preventDefault();
        $(this).parent().find(".tgl_c").slideToggle(300);
        if ($(this).hasClass("active")) {
            $(this).removeClass('active');
        } else {
            $(this).addClass('active');
        }
    });
});