var Organization = require('../models/Organization');
var moment = require('moment');
var request = require('request');
var secrets = require('../config/secrets');
var fieldsName = require('../public/json/listFields.json');


/**
 * GET /
 * Home page.
 */
exports.index = function(req, res) {
	//if there is a search url parameter, we query azure search using that term and render the results
	if (typeof(req.query.search)!='undefined' && req.query.search!=''){
		var searchTerm = req.query.search;

		var facetFields = ["primaryBusinessSector_1","primaryBusinessSector_2","socialPurposeCategoryTags",
		"demographicImpact","active"];

		var highlighFields=["descriptionService","descriptionCause","demographicImpact",
		"primaryBusinessSector_1","primaryBusinessSector_2","socialPurposeCategoryTags",
		"additionalResourcesNameList","name","parentOrganization","locationAddress",
		"organizationalStructure,website,email"];

		var url = 'https://'+secrets.azureSearch.url+'/indexes/'+secrets.azureSearch.indexName+'/docs?search='+searchTerm;
		facetFields.forEach(function(entry,index) {
			url+="&facet="+entry;
		});
		url+="&highlight=";
		highlighFields.forEach(function(entry,index) {
			if (typeof(highlighFields[index+1])!='undefined'){
				url+=entry+",";
			} else {
				url+=entry;
			}
		});
		url+='&api-version='+secrets.azureSearch.apiVersion;

		var options = {
		  url: url,
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
					title: 'Search for '+searchTerm,
					organizations: body.value,
					facets: body['@search.facets'],
					moment: moment,
					resultCount: body.value.length,
					searchTerm: searchTerm,
					fieldsName:fieldsName
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
			} else {
				if (error){console.log(error);}
				if (response) {console.log('http status code was: '+response.statusCode)};
				res.render('home', {
					title: 'Home',
					organizations: new Array(),
					moment: moment
				});
			}
		});
	}
};
