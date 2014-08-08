$(document).ready(function() {

  $('#addorganization').parsley({
      successClass: 'success',
      errorClass: 'error',
      classHandler: function(el) {
        return el.$element.closest(".form-group");
      },
      errorsWrapper: '<span class=\"help-inline\"></span>',
      errorTemplate: '<span></span>'
  });

});
