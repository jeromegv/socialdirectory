'use strict';

var secrets = require('../config/secrets');
var request = require('request');
var Organization = require('../models/Organization');
var moment = require('moment');
var util = require('util');
var utils = require ('./utils.js');
var _ = require('lodash');
var parser = require('odata-parser');

//check if the index configured for azuresearch is present, if not create the model for this new index
var initIndex = function() {
	var options = {
		url: 'https://'+secrets.azureSearch.url+'/indexes/'+secrets.azureSearch.indexName+'?api-version='+secrets.azureSearch.apiVersion,
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
			//console.log('index '+secrets.azureSearch.indexName+' already created on Azure Search, success');
		} else {
			//if 404, service is well configured but index needs to be created
			if (response && response.statusCode == 404){
				console.log('index '+secrets.azureSearch.indexName+' does not exist yet on Azure Search, creating it now');
				options.url= 'https://'+secrets.azureSearch.url+'/indexes/'+secrets.azureSearch.indexName+'?api-version='+secrets.azureSearch.apiVersion;
				options.method= 'PUT';
				options.body ={ 
				  'name': secrets.azureSearch.indexName, 
				  'fields': [
				    {'name': 'orgId', 'type': 'Edm.String', 'key':true, 'searchable': false},
				    {'name': 'name', 'type': 'Edm.String'}, 
				    {'name': 'name_slug', 'type': 'Edm.String', 'filterable': false,'facetable': false,'searchable': false}, 
				    {'name': 'email', 'type': 'Edm.String','filterable': false,'facetable': false}, 
				    {'name': 'logo', 'type': 'Edm.String', 'filterable': false,'facetable': false,'searchable': false},
				    {'name': 'logoThumbnail', 'type': 'Edm.String', 'filterable': false,'facetable': false,'searchable': false},
				    {'name': 'locationAddress', 'type': 'Edm.String','filterable': false,'facetable': false}, 
				    {'name': 'location', 'type': 'Edm.GeographyPoint'},
				    {'name': 'islandGroup', 'type': 'Edm.String','analyzer':'en.lucene'},
				    {'name': 'phoneNumber', 'type': 'Edm.String','filterable': false,'facetable': false},
				    {'name': 'website', 'type': 'Edm.String','filterable': false,'facetable': false}, 
				    {'name': 'store', 'type': 'Edm.String','filterable': false,'facetable': false}, 
				    {'name': 'parentOrganization', 'type': 'Edm.String'}, 
					{'name': 'yearFounded', 'type': 'Edm.Int32'}, 
				    {'name': 'descriptionService', 'type': 'Edm.String','filterable': false,'facetable': false, 'analyzer':'en.lucene'}, 
				    {'name': 'primaryBusinessSector_1', 'type': 'Edm.String','analyzer':'en.lucene'}, 
				    {'name': 'primaryBusinessSector_2', 'type': 'Collection(Edm.String)','analyzer':'en.lucene'}, 
				    {'name': 'descriptionCause', 'type': 'Edm.String','filterable': false,'facetable': false, 'analyzer':'en.lucene'}, 
				    {'name': 'socialPurposeCategoryTags', 'type': 'Collection(Edm.String)','analyzer':'en.lucene'},
				    {'name': 'demographicImpact', 'type': 'Collection(Edm.String)','analyzer':'en.lucene'},
				    {'name': 'organizationalStructure', 'type': 'Edm.String','analyzer':'en.lucene'}, 
				    {'name': 'active', 'type': 'Edm.Boolean'},
				    {'name': 'isSocialEnterprise', 'type': 'Edm.Boolean'}, 
				    {'name': 'dateCreated', 'type': 'Edm.DateTimeOffset'}, 
				    {'name': 'lastUpdated', 'type': 'Edm.DateTimeOffset'},     
				    {'name': 'additionalResourcesNameList', 'type': 'Collection(Edm.String)'}  
				     ],
				    'scoringProfiles':[
				    {
				    	'name': 'normalSearchBoost',
				    	'text':{
					    	'weights': { 
					    		//default value is 1, any number above 1 will increase boosting of the field, higher number = higher boost
		   						'name': 2
		   					}
	   					}
				    }],
				    suggesters: [

					{ "name": "suggestion", "searchMode": "analyzingInfixMatching", "sourceFields": ["name"] }

					]
				};
				request(options, function (error, response, body) {
					if (!error && (response.statusCode == 201 || response.statusCode==204)) {
						console.log('index '+secrets.azureSearch.indexName+' created on Azure Search, success');
					} else {
						if (error){console.log(error);}
						console.log('index '+secrets.azureSearch.indexName+' failed to be created on Azure Search. http status code was: '+response.statusCode);
					}
				});
			} else  {
				if (error){console.log(error);}
				console.log('Connection to Azure Search failed, query was: ');
				console.log(options);
		        if (response) {
		        	console.log('http status code was: '+response.statusCode);
		        }
			}
		}
	});
};

var buildAzureOrganizationObject = function(organization){
	//was able to update mongo, now update azure search
	var organizationAzure = {
		'@search.action': 'upload',
		orgId: organization._id.toString(),
		name: organization.name,
		name_slug: utils.convertToSlug(organization.name),
		logo: organization.logo,
		islandGroup: organization.islandGroup,
		logoThumbnail:organization.logoThumbnail,
		email: organization.email,
		locationAddress: organization.Location.address,
		phoneNumber: organization.phoneNumber,
		website: organization.website,
		store: organization.store,
		parentOrganization: organization.parentOrganization,
		descriptionService: organization.descriptionService,
		primaryBusinessSector_1: organization.primaryBusinessSector_1,
		descriptionCause: organization.descriptionCause,
		organizationalStructure: organization.organizationalStructure,
		active: organization.active,
		isSocialEnterprise: organization.isSocialEnterprise,
		//need to derive date created from ID 
		dateCreated: moment.utc(parseInt(organization._id.toString().substr(0, 8),16)*1000).toISOString(),
		lastUpdated: moment.utc(Date.now()).toISOString()
	};
	
	//		
	var additionalResourcesName = [];
	organization.additionalResources.forEach(function(entry,index) {
		if (entry.resourceName!=''){
	    	additionalResourcesName[index]=entry.resourceName;
	    }
	});
	organizationAzure.additionalResourcesNameList=additionalResourcesName;

	if (Array.isArray(organization.demographicImpact)){
		organizationAzure.demographicImpact=organization.demographicImpact;
	} else {
		organizationAzure.demographicImpact = new Array(organization.demographicImpact.toString());
	}
	if (Array.isArray(organization.socialPurposeCategoryTags)){
		organizationAzure.socialPurposeCategoryTags=organization.socialPurposeCategoryTags;
	} else {
		organizationAzure.socialPurposeCategoryTags = new Array(organization.socialPurposeCategoryTags.toString());
	}
	if (Array.isArray(organization.primaryBusinessSector_2)){
		organizationAzure.primaryBusinessSector_2=organization.primaryBusinessSector_2;
	} else {
		organizationAzure.primaryBusinessSector_2 = new Array(organization.primaryBusinessSector_2.toString());
	}
	if (organization.yearFounded!==null){
		organizationAzure.yearFounded=parseInt(organization.yearFounded);
	}
	if (organization.Location.longitude!==null && organization.Location.latitude!==null){
		organizationAzure.location=organization.loc;
	}
	return organizationAzure;
};
//to make a POST query to azure search that will upsert the organization
var uploadRecord = function(organization,callback){
	var organizationAzure = [];
	if (!Array.isArray(organization)){
		organizationAzure[0] = buildAzureOrganizationObject(organization);
	} else {
		if (organization.length<=1000){
			organization.forEach(function(entry,index) {
				organizationAzure[index]=buildAzureOrganizationObject(entry);
			});
		} else {
			callback('You can only send up to 1000 records at the time to AzureSearch');
		}
	}

	var options = {
	url: 'https://'+secrets.azureSearch.url+'/indexes/'+secrets.azureSearch.indexName+'/docs/index?api-version='+secrets.azureSearch.apiVersion,
	json: true,
	method: 'POST',
	headers: {
	  'host': secrets.azureSearch.url,
	  'api-key': secrets.azureSearch.apiKey,
	  'Content-Type': 'application/json'
	},
		body: {'value':organizationAzure}
	};
	console.log(util.inspect(options.body,{  depth: null }));
	request(options, function (error, response, body) {
		if (!error && response.statusCode == 200) {
		  console.log('organization '+ organization.name + ' created, success');
		  callback();
		} else {
		  console.log('organization '+ organization.name + ' failed to be updated on Azure Search, query was: ');
		  console.log(options);
		  if (error){
		    console.log(error);
		    callback(error);
		  } else if (response) {
		    console.log('http status code was: '+response.statusCode);
		    console.log(util.inspect(response.body,{  depth: null }));
		    callback('http status code was: '+response.statusCode);
		  }
		}
	});
};

//to make a POST query to azure search that will delete the organization
var deleteRecord = function(organization,callback){
	var organizationAzure = [];

	organizationAzure[0] =  {
		'@search.action': 'delete',
		orgId: organization._id.toString()
	};

	var options = {
	url: 'https://'+secrets.azureSearch.url+'/indexes/'+secrets.azureSearch.indexName+'/docs/index?api-version='+secrets.azureSearch.apiVersion,
	json: true,
	method: 'POST',
	headers: {
	  'host': secrets.azureSearch.url,
	  'api-key': secrets.azureSearch.apiKey,
	  'Content-Type': 'application/json'
	},
		body: {'value':organizationAzure}
	};
	console.log(util.inspect(options.body,{  depth: null }));
	request(options, function (error, response, body) {
		if (!error && response.statusCode == 200) {
		  console.log('organization '+ organization.name + ' deleted, success');
		  callback();
		} else {
		  console.log('organization '+ organization.name + ' failed to be deleted on Azure Search, query was: ');
		  console.log(options);
		  if (error){
		    console.log(error);
		    callback(error);
		  } else if (response) {
		    console.log('http status code was: '+response.statusCode);
		    callback('http status code was: '+response.statusCode);
		  }
		}
	});
};

var searchSuggestions = function(req,callback) {
	var searchTerm = req.sanitize('search').trim();
	if (typeof(searchTerm)=='undefined'){
		return callback('Search term is undefined');
	}
	if (searchTerm.length<2 || searchTerm.length>100){
		return callback('Suggestion length must be between 2 and 100 characters');
	}
	   
    //if someone is not authenticated, we hide inactive organization from typeahead results
    var filter = '';
    if (!req.isAuthenticated() && (req.get('secretkey')!=secrets.internalAPIKey)) {
      filter = '&$filter=active eq true';
    }
    var options = {
      url: 'https://'+secrets.azureSearch.url+'/indexes/'+secrets.azureSearch.indexName+'/docs/suggest?search='+searchTerm+filter+'&$select=name_slug&fuzzy=true&suggesterName=suggestion&api-version='+secrets.azureSearch.apiVersion,
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
        return callback(null,body.value);
       } else {
          if (error){
            console.log(error);
          }
          console.log('search failed to execute on Azure Search, query was:');
          console.log(options);
          if (response) {
            console.log('http status code was: '+response.statusCode);
          }
        return callback('Search suggestion failed');
       }
    });
};

var search = function(req,callback) {
	var searchTerm = req.sanitize('search').trim();
	//we add start to every result, helps to bring back more results
	if (searchTerm.indexOf('*') === -1){
		searchTerm = searchTerm + '*';
	}
	var filter ='';
	if (typeof(req.query.filter)!='undefined'){
		filter = req.query.filter;
	}

	if (!searchTerm){
		return callback('Search term is undefined');
	}

    //define the fields we want as facet and how to present the refinement values
	var facetFields = ['primaryBusinessSector_1,sort:count','primaryBusinessSector_2,sort:count','socialPurposeCategoryTags,sort:count','demographicImpact,sort:count','islandGroup,sort:count'];

	var highlighFields=['descriptionService','descriptionCause','demographicImpact',
	'primaryBusinessSector_1','primaryBusinessSector_2','socialPurposeCategoryTags',
	'additionalResourcesNameList','name','parentOrganization','locationAddress',
	'organizationalStructure,islandGroup,website,store,email'];

	var scoringProfile = 'normalSearchBoost';

	//maximum of 1000 results in the search results
	var topNumberResults = 1000;

	//if someone is not authenticated, we hide inactive organization from typeahead results
    if (!req.isAuthenticated() && (req.get('secretkey')!=secrets.internalAPIKey)) {
      if (!filter){
      	filter = 'active eq true';
      } else {
      	filter = filter+' and active eq true';
      }
    } else {
    	facetFields.push('active,sort:-value');
    }

	//build the URL for the query
	var url = 'https://'+secrets.azureSearch.url+'/indexes/'+secrets.azureSearch.indexName+'/docs?search='+searchTerm;
	
	facetFields.forEach(function(entry,index) {
		url+='&facet='+entry;
	});

	url+='&highlight=';
	highlighFields.forEach(function(entry,index) {
		if (typeof(highlighFields[index+1])!='undefined'){
			url+=entry+',';
		} else {
			url+=entry;
		}
	});
	if (filter){
		url+='&$filter='+encodeURIComponent(filter);
	}
	url+='&scoringProfile='+scoringProfile;
	url+='&$top='+topNumberResults;
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
			callback(null,body);
		 } else {
            if (error){
            	console.log(error);
            }
            console.log('search failed to execute on Azure Search, query was:');
            console.log(options);
            if (response) {
            	console.log('http status code was: '+response.statusCode);
            }
         	return callback('Search failed');
         }
	});
};

//To add/replace a parameter to an existing URL
function insertParam(key, value,sourceURL) {
    key = encodeURI(key); value = encodeURIComponent(value);
    var kvp = sourceURL.split('&');
    var i=kvp.length; var x; while(i--) 
    {
        x = kvp[i].split('=');
        if (x[0]==key)
        {
            x[1] = value;
            kvp[i] = x.join('=');
            break;
        }
    }
    if(i<0) {kvp[kvp.length] = [key,value].join('=');}
    return kvp.join('&'); 
}

//to remove a parameter from an url
function removeParam(key, sourceURL) {
    var rtn = sourceURL.split('?')[0],
        param,
        params_arr = [],
        queryString = (sourceURL.indexOf('?') !== -1) ? sourceURL.split('?')[1] : '';
    if (queryString !== '') {
        params_arr = queryString.split('&');
        for (var i = params_arr.length - 1; i >= 0; i -= 1) {
            param = params_arr[i].split('=')[0];
            if (param === key) {
                params_arr.splice(i, 1);
            }
        }
        rtn = rtn + '?' + params_arr.join('&');
    }
    return rtn;
}

//get parameter in the URL provided
function getParam(key,sourceURL) {
    var query = sourceURL.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == key) {
            return decodeURIComponent(pair[1]);
        }
    }
}

//This function is being used to add a filter URL to the facet object 
//to be used when users click the facet filter
var buildFacets = function(facets,currentUrl){
	for (var facetName in facets) {
		var facetRefinements = facets[facetName];
		if (Array.isArray(facetRefinements)){
			facetRefinements.forEach(function(entry,index) {
				facets[facetName][index]['link']=buildUrlFromFacet(facetName,facetRefinements[index]['value'],currentUrl);
			});
		}
	}
	return facets;
};

//function is being used to show in the UI the list of filters selected (after someone clicked a facet)
//the search response coming back from azure does not contain this information
//so we have to look at the filter parameter in the URL to know how the response was filtered
//the format of the filter parameter is in OData. we use a odata-parser to parse it but unfortunately
//this library does not support any/all collection(tags) type of parameters so we have to parse it manually
var buildSelectedFilters = function(filterQueryString,currentUrl){
	var selectedFilters=new Object();
	//if there was a filter defined
	if (filterQueryString){
		//manually parse url if there are tag-style (/any) parameters
		if (filterQueryString.indexOf('/any') > -1){
			//match on " and " when not located between single quotes
			//to avoid issue with values that can have |and| as part of their value
			var re = new RegExp(" and (?=(?:[^']*'[^']*')*[^']*$)");
			var filterArray = filterQueryString.split(re);
			var filterArrayForForeach = [];
			filterArray.forEach(function(entry,index) {
				if (entry.indexOf('/any')>-1){
					//remove the element that is a tag selector from the filterQueryString
					filterArrayForForeach.push(entry);
					//add the selected filter to our array of selectedFilters
					var positionLastApostrophe=entry.lastIndexOf("'");
					selectedFilters[entry.substring(0,entry.indexOf('/any'))]={value:entry.substring(entry.lastIndexOf("'",positionLastApostrophe-1)+1,positionLastApostrophe)};
				}
			});
			filterArrayForForeach.forEach(function(entry,index) {
				_.pull(filterArray, entry);
			});
			//rebuild the query string without the tag selector
			filterQueryString=filterArray.join(' and ');
		}
		//if there is a value left that was not removed from original filterquerystring, parse it
		if (filterQueryString){
			var parsedFilter = parser.parse('$filter='+filterQueryString);
			//if there was no error with the parser, save the refinements
			if (parsedFilter.error===undefined){
				var firstSelection = parsedFilter['$filter'];
				while (firstSelection['type']!='eq'){
					if (firstSelection['left']['type']=='eq'){
						selectedFilters[firstSelection['left']['left']['name']]={value:firstSelection['left']['right']['value']};
					}
					if (firstSelection['right']['type']=='eq'){
						selectedFilters[firstSelection['right']['left']['name']]={value:firstSelection['right']['right']['value']};
					}
					firstSelection=firstSelection['right'];
				}
				selectedFilters[firstSelection['left']['name']]={value:firstSelection['right']['value']};
			}
		}
	}
	//once we are done building the selected filters, we add the "removeUrl" to each selected filters
	//to allow removing the filter from the query when clicking on X button next to selected filter
	selectedFilters = buildUrlToRemove(selectedFilters,currentUrl);
	return selectedFilters;
};

function buildUrlFromFacet(facetName,facetValue,currentUrl){
	var link;

	//get the 'filter' part of the current url, if it exists
	var filterQueryString = getParam('filter',currentUrl);

	if (facetName=='primaryBusinessSector_1' || facetName==='islandGroup'){
		if (!filterQueryString){
			link=insertParam('filter',facetName+" eq '"+facetValue+"'",currentUrl);
		} else {
			//if there is already a refinement selected, add the existing refinement first + add new refinement
			link=insertParam('filter',filterQueryString+' and '+facetName+" eq '"+facetValue+"'",currentUrl);							
		}
	} else if (facetName=='active'){
		if (!filterQueryString){
			link=insertParam('filter',facetName+" eq "+facetValue,currentUrl);
		} else {
			link=insertParam('filter',filterQueryString+' and '+facetName+" eq "+facetValue,currentUrl);
		}
	} else {
		if (!filterQueryString){
			link=insertParam('filter',facetName+"/any(t: t eq '"+facetValue+"')",currentUrl);
		} else {
			link=insertParam('filter',filterQueryString+' and '+facetName+"/any(t: t eq '"+facetValue+"')",currentUrl);						
		}
	}
	return link;
}
//We take the object that contains all selected filters and we build the URL that will be
//used for when someone click to REMOVE the refinement
function buildUrlToRemove(selectedFilters,currentUrl){
	//so we go over every selected filters
	for (var key in selectedFilters) {
		//we remove the filter parameter from the URL of the current page, and we rebuild it
		var cleanUrl = removeParam('filter',currentUrl);
		//the removed url will basically be a list of refinements of every selected filters
		//EXCEPT for the current selected filters (since this one gets removed)
		for (var key2 in selectedFilters) {
			if (key2!=key){
				cleanUrl = buildUrlFromFacet(key2,selectedFilters[key2]['value'],cleanUrl);
			}
			selectedFilters[key]['removeUrl']=cleanUrl;
		}
	}
	return selectedFilters;
}

exports.initIndex = initIndex;
exports.uploadRecord = uploadRecord;
exports.deleteRecord = deleteRecord;
exports.searchSuggestions = searchSuggestions;
exports.search = search;
exports.buildFacets = buildFacets;
exports.buildSelectedFilters = buildSelectedFilters;
