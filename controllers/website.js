var Organization = require('../models/Organization');
var secrets = require('../config/secrets');
var _ = require('lodash');
var request = require('request');
var socialPurposeCategory = require('../public/json/socialPurposeCategory.json');
var businessSector = require('../public/json/primaryBusinessSector.json');
var demographicImpact = require('../public/json/demographicImpact.json');
var azureSearch = require('../libs/azuresearch.js');
var fieldsName = require('../public/json/listFields.json');
var nodemailer = require('nodemailer');
var moment = require('moment');
var utils = require('../libs/utils.js');

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
		Organization.find({active: true}).select('logoThumbnail name name_slug socialPurposeCategoryTags descriptionService').exec(function(error, organizations) {
		    if (!error && organizations!=null){
		        res.render('websiteViews/home', {
					title: 'Home',
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

function createRefinements(organizations,field){
	var result = _.reduce(organizations, function (prev, current) {
		if (current.hidden==false || current.hidden==undefined){
			if (Array.isArray(current[field])){
				current[field].forEach(function(tag,index) {
					var index = _.findIndex( prev, {'name':tag});
					if (index=== -1 ){
						prev.push({'name': tag, 'val': 1});
					} else {
						prev[index].val = prev[index].val+1;
					}
				});
			} else {
				var index = _.findIndex( prev, {'name':current[field]});
				if (index=== -1 ){
					prev.push({'name': current[field], 'val': 1});
				} else {
					prev[index].val = prev[index].val+1;
				}
			}
		}
		return prev;
	}, []);
	result = _.sortBy(result, 'val').reverse(); 
	return result;
}

//since the URL is based on slug, we convert back to real DB values
function convertUrlToRealValue(filters){
	_(filters).forEach(function(filter) { 
		if (filter.refinementName==='primaryBusinessSector_1'){
			_(businessSector).forEach(function(subCategoryName,categoryName) { 
				if (utils.convertToSlug(categoryName)===filter.refinementValue){
					filter.refinementValue=categoryName;
				}
			});
		} else if (filter.refinementName==='socialPurposeCategoryTags'){
			_(socialPurposeCategory).forEach(function(socialPurpose) { 
				if (utils.convertToSlug(socialPurpose)===filter.refinementValue){
					filter.refinementValue=socialPurpose;
				}
			});
		} else if (filter.refinementName==='demographicImpact') {
			_(demographicImpact).forEach(function(demographic) { 
				if (utils.convertToSlug(demographic)===filter.refinementValue){
					filter.refinementValue=demographic;
				}
			});
		}
	});
	return filters;
}
//decode URL parameters that might filter the explore page and return a list of filters selected
function createSelectedRefinementsFromUrl(longUrl){
 	var currentFilters=[];
 	longUrl = decodeURIComponent(longUrl);
 	//only if there are parameters in the URL after the explore path
 	if (longUrl!='/explore' && longUrl!='/explore/'){
	    var refinementsInUrl = longUrl.substring(1).split('/');
	    refinementsInUrl.shift();
	    var refinementFilter;
	    for (var i=0;i<refinementsInUrl.length;i++){
		    if (i%2==0 && refinementsInUrl[i] && refinementsInUrl[i+1]){
		    	var refinementNameBeautiful = refinementsInUrl[i];
		    	if (refinementsInUrl[i]=='business'){
					refinementNameBeautiful = 'primaryBusinessSector_1';
				} else if (refinementsInUrl[i]=='social') {
					refinementNameBeautiful = 'socialPurposeCategoryTags';
				} else if (refinementsInUrl[i]=='impact') {
					refinementNameBeautiful = 'demographicImpact';
				}
			    refinementFilter = {
					'refinementName':refinementNameBeautiful,
					'refinementValue':refinementsInUrl[i+1]
				};
				currentFilters.push(refinementFilter);
			}
		}
	}
	currentFilters = convertUrlToRealValue(currentFilters);
	return currentFilters;
}
//will add a tag hidden=true or hidden=false to each organizations depending on either they should
//be shown or not based on the filters coming from the URL
function filterOrganizations(organizations,filters){
	var organizationsFiltered=organizations;
	_(filters).forEach(function(filter) { 
		organizationsFiltered = _.forEach(organizationsFiltered, function(org) {
			if (org.hidden===true){
				return;
			}
			org.hidden=true;
			if (Array.isArray(org[filter.refinementName])){
				_.forEach(org[filter.refinementName],function(orgRefValue) { 
					if (orgRefValue==filter.refinementValue){
						org.hidden=false
						return true;
					}; 
				});
			} else {
				if (org[filter.refinementName]==filter.refinementValue){
					org.hidden=false;
				}
			}
		});
	});
	return organizationsFiltered;
}

/**
 * GET /explore
 * Show Explore page
 */
 exports.getExplore = function(req, res) {

 	var selectedRefinements = createSelectedRefinementsFromUrl(req.originalUrl);

	Organization.find({active: true}).select('logoThumbnail name name_slug socialPurposeCategoryTags descriptionService primaryBusinessSector_1 demographicImpact').exec(function(error, organizations) {
	    if (!error && organizations!=null){
	    	organizations = filterOrganizations(organizations,selectedRefinements);
	        res.render('websiteViews/explore', {
				title: 'Explore',
				organizations:organizations,
				socialPurposeRefinements:createRefinements(organizations,'socialPurposeCategoryTags'),
				businessSectorRefinements:createRefinements(organizations,'primaryBusinessSector_1'),
				demographicImpactRefinements:createRefinements(organizations,'demographicImpact'),
				_ : _,
				selectedRefinements:selectedRefinements
			});
	    } else {
	      res.status(400);
	      return res.send(error);
	    }
	});
};

/**
 * GET /sitemap
 * Show sitemap page
 */
 exports.getSiteMap = function(req, res) {
	Organization.find({active: true}).select('name_slug lastUpdated').exec(function(error, organizations) {
	    if (!error && organizations!=null){
	    	res.header('Content-Type', 'application/xml');
	        res.render('websiteViews/sitemap', {
				organizations:organizations,
				moment:moment,
				externalUrl:secrets.externalUrl
			});
	    } else {
	      res.status(400);
	      return res.send(error);
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

/**
 * GET /contactus
 * Show contact us page
 */
 exports.getContactUs= function(req, res) {
	res.render('websiteViews/contactus', {
		title: 'Contact Us'
	});
};

/**
 * GET /contactus
 * Show contact us page
 */
 exports.getAboutUs= function(req, res) {
	res.render('websiteViews/aboutus', {
		title: 'About Us'
	});
};

/**
 * POST /contactus
 * 
 */
exports.postContactUs = function(req, res, next) {
  req.assert('name','Please enter your name').notEmpty();
  req.assert('email', 'Please enter a valid email address.').isEmail();
  req.assert('message','Please enter your message').notEmpty();

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/contactus');
  }

  var transporter = nodemailer.createTransport({
    service: 'SendGrid',
    auth: {
      user: secrets.sendgrid.user,
      pass: secrets.sendgrid.password
    }
  });

  var mailOptions = {
    to: secrets.sendgrid.emailForContactUs,
    from: req.body.name + '<' + req.body.email + '>',
    subject: 'Contact Us form sent from ChooseSocial.PH',
    text: 'You just received this email from '+ req.body.name + ' from the contact us page of the website:\n\n' +
      req.body.message
  };
  transporter.sendMail(mailOptions, function(err) {
  	if (!err){
    	req.flash('info', { msg: 'Your message has been sent to ChooseSocial.PH, thank you!' });
	} else {
		req.flash('errors', { msg: 'An error occured with the form and your email was not delivered, please use an email client to email us directly' });
	}
    return res.redirect('/contactus');
  });
};

/*
* 404 page not found
*/
exports.notFound = function(req, res){
  res.status(404);
  if(req.accepts('html')){
    res.render('websiteViews/404', {title: '404: Not Found', url: req.url });
  }
  else if(req.accepts('json')){
    res.json({ error: '404: Not Found' });
  }
  else{
    res.send('404: Not Found');
  }
};