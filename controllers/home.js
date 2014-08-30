var Organization = require('../models/Organization');
var moment = require('moment');
var request = require('request');
var secrets = require('../config/secrets');

/**
 * GET /
 * Home page.
 */
exports.index = function(req, res) {
	//if there is a search url parameter, we query azure search using that term and render the results
	if (typeof(req.query.search)!='undefined' && req.query.search!=''){
		var options = {
		  url: 'https://'+secrets.azureSearch.url+'/indexes/'+secrets.azureSearch.indexName+'/docs?search='+req.query.search+'&api-version='+secrets.azureSearch.apiVersion,
          json: true,
          method: 'GET',
          headers: {
            'host': secrets.azureSearch.url,
            'api-key': secrets.azureSearch.apiKey,
            'Content-Type': 'application/json'
          }
		};
		request(options, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				res.render('search', {
					title: 'Search for '+req.query.search,
					organizations: body.value,
					moment: moment,
					resultCount: body.value.length,
					searchTerm: req.query.search
				});
			 } else {
	            if (error){console.log(error);}
	            console.log('search failed to execute on Azure Search, query was:');
	            console.log(options);
	            if (response) {console.log('http status code was: '+response.statusCode)};
	         	return res.redirect('/');
	         }
		});
	} else {
		//if this is just a normal home page, we display from our internal organization API
		var options = {
		    url: res.locals.host+'/api/organization',
		    json: true
		};
		request(options, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				body.sort(function(a, b) {
					//extract timestamp from _id and sort by this value
					var first = parseInt(a['_id'].substr(0, 8),16)*1000;
					var second = parseInt(b['_id'].substr(0, 8),16)*1000;
					return (second-first);
				});
				res.render('home', {
					title: 'Home',
					organizations: body,
					moment: moment
				});
			}
		});
	}
};
