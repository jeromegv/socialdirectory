var Organization = require('../models/Organization');
var _ = require('lodash');
var socialPurposeCategory = require('../public/json/socialPurposeCategory.json');
/**
 * GET /
 * Show home page
 */
 exports.getHome = function(req, res) {
 	Organization.find({active: true}).select('logo name name_slug socialPurposeCategoryTags _id').exec(function(err, organizations) {
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