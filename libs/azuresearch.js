var secrets = require('../config/secrets');
var request = require('request');
var Organization = require('../models/Organization');
var moment = require('moment');
var util = require('util');
var utils = require ('./utils.js');


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
				  "name": secrets.azureSearch.indexName, 
				  "fields": [
				    {"name": "orgId", "type": "Edm.String", "key":true, "searchable": false},
				    {"name": "name", "type": "Edm.String", "suggestions": true}, 
				    {"name": "name_slug", "type": "Edm.String", "filterable": false,"facetable": false,"searchable": false}, 
				    {"name": "email", "type": "Edm.String","filterable": false,"facetable": false}, 
				    {"name": "locationAddress", "type": "Edm.String","filterable": false,"facetable": false}, 
				    {"name": "location", "type": "Edm.GeographyPoint"},
				    {"name": "phoneNumber", "type": "Edm.String","filterable": false,"facetable": false}, 
				    {"name": "website", "type": "Edm.String","filterable": false,"facetable": false}, 
				    {"name": "parentOrganization", "type": "Edm.String"}, 
					{"name": "yearFounded", "type": "Edm.Int32"}, 
				    {"name": "descriptionService", "type": "Edm.String","filterable": false,"facetable": false}, 
				    {"name": "primaryBusinessSector_1", "type": "Edm.String"}, 
				    {"name": "primaryBusinessSector_2", "type": "Collection(Edm.String)"}, 
				    {"name": "descriptionCause", "type": "Edm.String","filterable": false,"facetable": false}, 
				    {"name": "socialPurposeCategoryTags", "type": "Collection(Edm.String)"},
				    {"name": "demographicImpact", "type": "Collection(Edm.String)"},
				    {"name": "organizationalStructure", "type": "Edm.String"}, 
				    {"name": "active", "type": "Edm.Boolean"},
				    {"name": "isSocialEnterprise", "type": "Edm.Boolean"}, 
				    {"name": "dateCreated", "type": "Edm.DateTimeOffset"}, 
				    {"name": "lastUpdated", "type": "Edm.DateTimeOffset"},     
				    {"name": "additionalResourcesNameList", "type": "Collection(Edm.String)"}  
				     ],
				    "scoringProfiles":[
				    {
				    	"name": "normalSearchBoost",
				    	"text":{
					    	"weights": { 
					    		//default value is 1, any number above 1 will increase boosting of the field, higher number = higher boost
		   						"name": 2
		   					}
	   					}
				    }]
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
		        if (response) {console.log('http status code was: '+response.statusCode)};
			}
		}
	});
};

var buildAzureOrganizationObject = function(organization){
	//was able to update mongo, now update azure search
	var organizationAzure = {
		"@search.action": "upload",
		orgId: organization._id.toString(),
		name: organization.name,
		name_slug: utils.convertToSlug(organization.name),
		email: organization.email,
		locationAddress: organization.Location.address,
		phoneNumber: organization.phoneNumber,
		website: organization.website,
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
	var additionalResourcesName = new Array();
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
	if (organization.yearFounded!=null){
		organizationAzure.yearFounded=parseInt(organization.yearFounded);
	}
	if (organization.Location.longitude!=null && organization.Location.latitude!=null){
		organizationAzure.location={ 
		  "type": "Point", 
		  "coordinates": [parseFloat(organization.Location.longitude), parseFloat(organization.Location.latitude)]
		};
	}
	return organizationAzure;
}
//to make a POST query to azure search that will upsert the organization
var uploadRecord = function(organization,callback){
	
	var organizationAzure = new Array();
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
		body: {"value":organizationAzure}
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
		    console.log('http status code was: '+response.statusCode)
		    callback('http status code was: '+response.statusCode);
		  };
		}
	});
}

var searchSuggestions = function(req,searchTerm,callback) {
	if (typeof(searchTerm)=='undefined'){
		return callback('Search term is undefined');
	}
	if (searchTerm.length<3 || searchTerm.length>100){
		return callback('Suggestion length must be between 3 and 100 characters');
	}
	   
    //if someone is not authenticated, we hide inactive organization from typeahead results
    var filter = "";
    if (!req.isAuthenticated() && (req.get('secretkey')!=secrets.internalAPIKey)) {
      filter = "&$filter=active eq true";
    }
    var options = {
      url: 'https://'+secrets.azureSearch.url+'/indexes/'+secrets.azureSearch.indexName+'/docs/suggest?search='+req.query.search+filter+'&$select=name_slug&fuzzy=true&api-version='+secrets.azureSearch.apiVersion,
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
            console.log('http status code was: '+response.statusCode)
          };
        return callback('search failed');
       }
    });
}

exports.initIndex = initIndex;
exports.uploadRecord = uploadRecord;
exports.buildAzureOrganizationObject = buildAzureOrganizationObject;
exports.searchSuggestions = searchSuggestions;
