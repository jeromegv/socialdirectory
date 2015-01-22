'use strict';

var Organization = require('../models/Organization');
var moment = require('moment');
var request = require('request');
var secrets = require('../config/secrets');
var fieldsName = require('../public/json/listFields.json');
var azureSearch = require('../libs/azuresearch.js');

/**
 * GET /
 * Home page.
 */
exports.index = function(req, res) {
	//if there is a search url parameter, we query azure search using that term and render the results
	if (typeof(req.query.search)!='undefined' && req.query.search!==''){
		var searchTerm = req.sanitize('search').trim();
		var filter ='';
		if (typeof(req.query.filter)!='undefined'){
			filter = req.query.filter;
		}
		azureSearch.search(req,function(error,response){
			if (error){
				return res.redirect('/admin');
			}
			res.render('organization/adminSearch', {
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
		//if this is just a normal home page, we display from our internal organization API
		var options = {
		    url: res.locals.host+'/api/organization',
		    json: true,
		    headers: {
		    	secretkey:secrets.internalAPIKey
		    }
		};
		request(options, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				body.sort(function(a, b) {
					//extract timestamp from _id and sort by this value
					var first = parseInt(a['_id'].substr(0, 8),16)*1000;
					var second = parseInt(b['_id'].substr(0, 8),16)*1000;
					return (second-first);
				});
				res.render('organization/adminHome', {
					title: 'Home',
					organizations: body,
					moment: moment
				});
			} else {
				if (error){console.log(error);}
				if (response) {
					console.log('http status code was: '+response.statusCode);
				}
				res.render('organization/adminHome', {
					title: 'Home',
					organizations: new Array(),
					moment: moment
				});
			}
		});
	}
};
