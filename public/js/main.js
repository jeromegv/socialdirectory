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

	$(function() {
	  $('#address').autoGeocoder({disableDefaultUI:false});
	});



});
