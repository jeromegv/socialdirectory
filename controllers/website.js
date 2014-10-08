var Organization = require('../models/Organization');
var secrets = require('../config/secrets');
var _ = require('lodash');
var request = require('request');
var socialPurposeCategory = require('../public/json/socialPurposeCategory.json');
var azureSearch = require('../libs/azuresearch.js');
var fieldsName = require('../public/json/listFields.json');


/**
 * GET /
 * Show home page
 */
 exports.getHome = function(req, res) {
 	if (typeof(req.query.search)!='undefined' && req.query.search!=''){
		var searchTerm = req.sanitize('search').trim();
		var filter ='';
		if (typeof(req.query.filter)!='undefined'){
			filter = req.query.filter;
		}
		azureSearch.search(req,function(error,response){
			if (error){
				res.status(400);
		      	return res.send(error);
			}
			res.render('websiteViews/search', {
				title: 'Search for '+searchTerm,
				organizations: response.value,
				facets: azureSearch.buildFacets(response['@search.facets'],req.originalUrl),
				resultCount: response.value.length,
				searchTerm: searchTerm,
				fieldsName:fieldsName,
				selectedFilters:azureSearch.buildSelectedFilters(filter,req.originalUrl)
			});
		});
	} else {
		Organization.find({active: true}).select('logoThumbnail name name_slug socialPurposeCategoryTags _id').exec(function(error, organizations) {
		    if (!error && organizations!=null){
		        res.render('websiteViews/home', {
					title: 'Home Page',
					organizations:organizations,
					socialPurposeCategory:socialPurposeCategory,
					_ : _
				});
		    } else {
		      res.status(400);
		      return res.send(error);
		    }
		});
	}
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