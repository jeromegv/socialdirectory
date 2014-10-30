var Organization = require('../models/Organization');
var secrets = require('../config/secrets');
var _ = require('lodash');
var request = require('request');
var socialPurposeCategory = require('../public/json/socialPurposeCategory.json');
var azureSearch = require('../libs/azuresearch.js');
var fieldsName = require('../public/json/listFields.json');
var nodemailer = require('nodemailer');


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
		Organization.find({active: true}).select('logoThumbnail name name_slug socialPurposeCategoryTags _id descriptionService').exec(function(error, organizations) {
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
 * @param email
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