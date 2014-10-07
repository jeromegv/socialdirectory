var Organization = require('../models/Organization');
var secrets = require('../config/secrets');
var _ = require('lodash');
var request = require('request');
var socialPurposeCategory = require('../public/json/socialPurposeCategory.json');
/**
 * GET /
 * Show home page
 */
 exports.getHome = function(req, res) {
 	Organization.find({active: true}).select('logoThumbnail name name_slug socialPurposeCategoryTags _id').exec(function(err, organizations) {
	    if (!err && organizations!=null){
	        res.render('websiteViews/home', {
				title: 'Home Page',
				organizations:organizations,
				socialPurposeCategory:socialPurposeCategory,
				_ : _
			});
	    } else {
	      res.status(400);
	      return res.send(err);
	    }
	});
};

/**
 * GET /organization/:slug
 * Show home page
 */
 exports.getOrganization = function(req, res) {
 	var options = {
      url: res.locals.host+'/api/organization/'+req.params.slug,
      json: true
 	};
	request(options, function (error, response, body) {
		if (!error && response.statusCode == 200) {
		  res.render('websiteViews/organization', {
		    title: body.name,
		    organization: body,
		    _ : _
		  });
		} else {
		  req.flash('errors', { msg: 'The organization requested can\'t be rendered' });
		  return res.redirect('back');
		}
  	});
};