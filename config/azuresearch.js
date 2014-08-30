var secrets = require('./secrets');
var request = require('request');

//check if the index configured for azuresearch is present, if not create the model for this new index
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
			    {"name": "email", "type": "Edm.String","filterable": false,"facetable": false, "retrievable": false}, 
			    {"name": "locationAddress", "type": "Edm.String","filterable": false,"facetable": false}, 
			    {"name": "location", "type": "Edm.GeographyPoint"},
			    {"name": "phoneNumber", "type": "Edm.String","filterable": false,"facetable": false, "retrievable": false}, 
			    {"name": "website", "type": "Edm.String","filterable": false,"facetable": false}, 
			    {"name": "parentOrganization", "type": "Edm.String", "suggestions": true}, 
				{"name": "yearFounded", "type": "Edm.Int32"}, 
			    {"name": "descriptionService", "type": "Edm.String","filterable": false,"facetable": false}, 
			    {"name": "primaryBusinessSector", "type": "Edm.String"}, 

			    {"name": "descriptionCause", "type": "Edm.String","filterable": false,"facetable": false}, 

			    {"name": "socialPurposeCategory", "type": "Edm.String"}, 
			    {"name": "organizationalStructure", "type": "Edm.String"}, 
			    {"name": "active", "type": "Edm.Boolean"}, 
			    {"name": "dateCreated", "type": "Edm.DateTimeOffset"}, 
			    {"name": "lastUpdated", "type": "Edm.DateTimeOffset"}, 
			    
			    {"name": "additionalResourcesNameList", "type": "Collection(Edm.String)"}  
			     ]
			};
			request(options, function (error, response, body) {
				if (!error && response.statusCode == 201) {
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
