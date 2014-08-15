$(document).ready(function() {

	$('#addOrganization').parsley({
	  successClass: 'success',
	  errorClass: 'error',
	  classHandler: function(el) {
	    return el.$element.closest(".form-group");
	  },
	  errorsWrapper: '<span class=\"help-inline\"></span>',
	  errorTemplate: '<span></span>'
	});
	$("#updateOrganization").submit(function(){
		event.preventDefault();
		var obj_id=window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1);
		jQuery.ajax({
	      url: "/organization/"+obj_id,
	      data: $('#updateOrganization').serialize(),
	      type: 'PUT'
	    }).done(function() {
	      //redirect to previous page after successful form submission
	      window.location=document.referrer;
	    });
	    return false;
	});

	$("#addButton").click(function(){
		var row = '<div class="row"><div class="col-sm-6"><input type="text" name="resourceName[]" id="resourceName" placeholder="Resource Name (Could be Article Name)" class="form-control"></div><div class="col-sm-5"><input type="text" name="resourceUrl[]" id="resourceUrl" placeholder="URL" data-parsley-type="url" class="form-control"></div></div>'
		$("#duplicate").append(row);
	});

	$(function() {
	  $('#address').autoGeocoder({disableDefaultUI:false});
	});



});
