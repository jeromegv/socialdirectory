'use strict';

$(document).ready(function() {

	$('#addOrganization').parsley({
	  successClass: 'success',
	  errorClass: 'error',
	  classHandler: function(el) {
	    return el.$element.closest('.form-group');
	  },
	  errorsWrapper: '<span class=\"help-inline\"></span>',
	  errorTemplate: '<span></span>'
	});
	$('#updateOrganization').parsley({
	  successClass: 'success',
	  errorClass: 'error',
	  classHandler: function(el) {
	    return el.$element.closest('.form-group');
	  },
	  errorsWrapper: '<span class=\"help-inline\"></span>',
	  errorTemplate: '<span></span>'
	});
	$('#delete').click(function(){
		var confirm = window.confirm('Are you sure you want to delete permanently this organization?');
		
		if (confirm===false){
			return;
		}

		var CSRF_HEADER = 'X-CSRF-Token';

		var setCSRFToken = function(securityToken) {
		  jQuery.ajaxPrefilter(function(options, _, xhr) {
		    if ( !xhr.crossDomain ) 
		        xhr.setRequestHeader(CSRF_HEADER, securityToken);
		  });
		};

		setCSRFToken($('meta[name="csrf-token"]').attr('content'));
		event.preventDefault();
		var slug=window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1);
		jQuery.ajax({
	      url: '/admin/organization/'+slug,
	      type: 'DELETE'
	    }).done(function() {
	      //redirect to previous page after successful form submission
	      window.location=document.referrer;
	    });
	    return false;
	});

	$('#addButtonSocialMedia').click(function(){
		var row = '<div class="row"><div class="col-sm-8"><input type="text" name="socialMediaUrl[]" id="socialMediaUrl" placeholder="Just enter the full URL of the social media profile" class="form-control" data-parsley-type="url"></div></div>';
		$('#duplicateSocialMedia').append(row);
	});
	$('#addButtonResource').click(function(){
		var row = '<div class="row"><div class="col-sm-6"><input type="text" name="resourceName[]" id="resourceName" placeholder="Resource Name (Could be Article Name)" class="form-control"></div><div class="col-sm-5"><input type="text" name="resourceUrl[]" id="resourceUrl" placeholder="URL" data-parsley-type="url" class="form-control"></div></div>';
		$('#duplicateResource').append(row);
	});

	$(function() {
	  $('#address').autoGeocoder({disableDefaultUI:false});
	});

    //enable the autocomplete search as you type (azure suggestions) on the searchbar
    //call the internal API for the query and show results returned by API
	$('#search').autocomplete({
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
	    select: function( event, ui ) {
				window.location.href = '/admin/organization/'+ui.item.name_slug;
			},
			focus: function (event, ui) {
	       this.value = ui.item['@search.text'];
	       event.preventDefault(); 
		}

    })
    .autocomplete('instance')._renderItem = function( ul, item ) {
      return $('<li>')
        .append('<a href="/admin/organization/'+item.name_slug+'">' + item['@search.text'] + '</a>' )
        .appendTo( ul );
    };
    //enable select2 on various fields of add/update pages
    $('#demographicImpact').select2({
	    placeholder: 'Choose up to 3 demographic groups',
	    maximumSelectionSize: 3
	});
	$('#socialPurposeCategoryTags').select2({
	    placeholder: 'Choose up to 3 social purpose categories',
	    maximumSelectionSize: 3
	});
	$('#primaryBusinessSector_1').select2({
		placeholder: 'Select a Primary Business Sector',
		allowClear: true
	});
	//primary business sector has a complex 2 levels hierarchy so we load this category hierarchy
	//from a JSON file and show a second level category if it exists
	$('#primaryBusinessSector_1')
    .on('change', function(e) { 
    	if(e.val!=''){
	    	$.getJSON('/json/primaryBusinessSector.json', function(json) {
			    if (json[e.val].length>0){
			    	//remove second level if it exists
			    	if ($('#primaryBusinessSector_2_formgroup')){
			    		$('#primaryBusinessSector_2_formgroup').remove();
			    	}
			    	var location = $('<div class="form-group" id="primaryBusinessSector_2_formgroup"><label for="primaryBusinessSector_2" id="label_primaryBusinessSector_2" class="col-sm-2 control-label">Sub-Category Business Sector</label><div class="col-sm-4"><select multiple required class="form-control" name="primaryBusinessSector_2", id="primaryBusinessSector_2"><option></option></select></div></div>').insertAfter($('#label_primaryBusinessSector_1').parent());
				    json[e.val].forEach(function(entry) {
				    	$('#primaryBusinessSector_2').append('<option value="'+entry+'">'+entry+'</option>');
					});
					$('#primaryBusinessSector_2').select2({
						placeholder: 'Choose up to 3 sub Primary Business Sector',
						maximumSelectionSize: 3
					});
				} else {
					//remove second level if it exists when there is no value for second level
			    	if ($('#primaryBusinessSector_2_formgroup')){
			    		$('#primaryBusinessSector_2_formgroup').remove();
			    	}
				}
			});
		} else {
			//remove second level if user clears the selection of first level
			if ($('#primaryBusinessSector_2_formgroup')){
	    		$('#primaryBusinessSector_2_formgroup').remove();
	    	}
		}
    });

	if ($('#primaryBusinessSector_2_formgroup')){
		$('#primaryBusinessSector_2').select2({
			placeholder: 'Choose up to 3 sub Primary Business Sector',
			maximumSelectionSize: 3
		});
	}
});
