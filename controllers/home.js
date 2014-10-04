var Organization = require('../models/Organization');
var moment = require('moment');
var request = require('request');
var secrets = require('../config/secrets');
var fieldsName = require('../public/json/listFields.json');
var _ = require('lodash');
var parser = require("odata-parser");

//To add/replace a parameter to an existing URL
function insertParam(key, value,sourceURL)
{
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
    var rtn = sourceURL.split("?")[0],
        param,
        params_arr = [],
        queryString = (sourceURL.indexOf("?") !== -1) ? sourceURL.split("?")[1] : "";
    if (queryString !== "") {
        params_arr = queryString.split("&");
        for (var i = params_arr.length - 1; i >= 0; i -= 1) {
            param = params_arr[i].split("=")[0];
            if (param === key) {
                params_arr.splice(i, 1);
            }
        }
        rtn = rtn + "?" + params_arr.join("&");
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
function buildFacets(facets,currentUrl){
	for (var facetName in facets) {
		var facetRefinements = facets[facetName];
		if (Array.isArray(facetRefinements)){
			facetRefinements.forEach(function(entry,index) {
				facets[facetName][index]['link']=buildUrlFromFacet(facetName,facetRefinements[index]['value'],currentUrl);
			});
		}
	}
	return facets;
}

//function is being used to show in the UI the list of filters selected (after someone clicked a facet)
//the search response coming back from azure does not contain this information
//so we have to look at the filter parameter in the URL to know how the response was filtered
//the format of the filter parameter is in OData. we use a odata-parser to parse it but unfortunately
//this library does not support any/all collection(tags) type of parameters so we have to parse it manually
function buildSelectedFilters(filterQueryString,currentUrl){
	var selectedFilters=new Object();
	//if there was a filter defined
	if (filterQueryString){
		//manually parse url if there are tag-style (/any) parameters
		if (filterQueryString.indexOf("/any") > -1){
			//match on " and " when not located between single quotes
			//to avoid issue with values that can have |and| as part of their value
			var re = new RegExp(" and (?=(?:[^']*'[^']*')*[^']*$)");
			var filterArray = filterQueryString.split(re);
			var filterArrayForForeach = new Array();
			filterArray.forEach(function(entry,index) {
				if (entry.indexOf("/any")>-1){
					//remove the element that is a tag selector from the filterQueryString
					filterArrayForForeach.push(entry);
					//add the selected filter to our array of selectedFilters
					var positionLastApostrophe=entry.lastIndexOf("'");
					selectedFilters[entry.substring(0,entry.indexOf("/any"))]={value:entry.substring(entry.lastIndexOf("'",positionLastApostrophe-1)+1,positionLastApostrophe)};
				}
			});
			filterArrayForForeach.forEach(function(entry,index) {
				_.pull(filterArray, entry);
			});
			//rebuild the query string without the tag selector
			filterQueryString=filterArray.join(" and ");
		}
		//if there is a value left that was not removed from original filterquerystring, parse it
		if (filterQueryString){
			var parsedFilter = parser.parse('$filter='+filterQueryString);
			//if there was no error with the parser, save the refinements
			if (parsedFilter.error!='undefined'){
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
}



function buildUrlFromFacet(facetName,facetValue,currentUrl){
	var link;

	//get the 'filter' part of the current url, if it exists
	var filterQueryString = getParam('filter',currentUrl);

	if (facetName=='primaryBusinessSector_1'){
		if (!filterQueryString){
			link=insertParam("filter",facetName+" eq '"+facetValue+"'",currentUrl);
		} else {
			//if there is already a refinement selected, add the existing refinement first + add new refinement
			link=insertParam("filter",filterQueryString+' and '+facetName+" eq '"+facetValue+"'",currentUrl);							
		}
	} else if (facetName=='active'){
		if (!filterQueryString){
			link=insertParam("filter",facetName+" eq "+facetValue,currentUrl);
		} else {
			link=insertParam("filter",filterQueryString+' and '+facetName+" eq "+facetValue,currentUrl);
		}
	} else {
		if (!filterQueryString){
			link=insertParam("filter",facetName+"/any(t: t eq '"+facetValue+"')",currentUrl);
		} else {
			link=insertParam("filter",filterQueryString+' and '+facetName+"/any(t: t eq '"+facetValue+"')",currentUrl);						
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
		var cleanUrl = removeParam("filter",currentUrl);
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
/**
 * GET /
 * Home page.
 */
exports.index = function(req, res) {
	//if there is a search url parameter, we query azure search using that term and render the results
	if (typeof(req.query.search)!='undefined' && req.query.search!=''){
		var searchTerm = req.sanitize('search').trim();

	    var scoringProfile = "normalSearchBoost";

		var facetFields = ["primaryBusinessSector_1,sort:count","primaryBusinessSector_2,sort:count","socialPurposeCategoryTags,sort:count","demographicImpact,sort:count","active,sort:-value"];

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
		var filterQueryString;
		if (typeof(req.query.filter)!='undefined'){
			url+='&$filter='+encodeURIComponent(req.query.filter);
			var filterQueryString = req.query.filter;
		}
		url+='&scoringProfile='+scoringProfile;
		//maximum of 1000 results in the search results
		url+='&$top=1000';
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
				res.render('organization/adminSearch', {
					title: 'Search for '+searchTerm,
					organizations: body.value,
					facets: buildFacets(body['@search.facets'],req.originalUrl),
					moment: moment,
					resultCount: body.value.length,
					searchTerm: searchTerm,
					fieldsName:fieldsName,
					selectedFilters:buildSelectedFilters(filterQueryString,req.originalUrl)
				});
			 } else {
	            if (error){console.log(error);}
	            console.log('search failed to execute on Azure Search, query was:');
	            console.log(options);
	            if (response) {console.log('http status code was: '+response.statusCode)};
	         	return res.redirect('/admin');
	         }
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
				if (response) {console.log('http status code was: '+response.statusCode)};
				res.render('organization/adminHome', {
					title: 'Home',
					organizations: new Array(),
					moment: moment
				});
			}
		});
	}
};
