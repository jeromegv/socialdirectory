var secrets = require('../config/secrets');
var Organization = require('../models/Organization');

/**
 * GET /api/organization
 * List of all organizations
 */

exports.getOrganization = function(req, res) {
    Organization.find(function(err, organizations) {
      if (!err){
        return res.jsonp(organizations);
      } else {
        return res.send(err);
      }
    });
};

/**
 * GET /addorganization
 * Render form page to add a new organization
 */

exports.addOrganization = function(req, res) {
  res.render('organization/add', {
    title: 'Add Organization'
  });
};

/**
 * POST /addorganization
 * Add a new organization
 */

exports.postOrganization = function(req, res) {

  req.assert('name', 'Name cannot be blank').notEmpty();
  req.assert('email', 'Email is not valid').notEmpty().isEmail();

  if (req.body.website!=''){
    req.assert('website','URL is not valid').isURL();
  }
  if (req.body.twitter!=''){
    req.assert('twitter','URL is not valid').isURL();
  }
  if (req.body.facebook!=''){
    req.assert('facebook','URL is not valid').isURL();
  }
  if (req.body.tumblr!=''){
    req.assert('tumblr','URL is not valid').isURL();
  }
  if (req.body.logo!=''){
    req.assert('logo','URL is not valid').isURL();
  }
  if (req.body.resourceUrl!=''){
    req.assert('resourceUrl','URL is not valid').isURL();
  }

  if (req.body.yearFounded!=''){
    req.assert('yearFounded', 'Year Founded is not valid').isInt();
  }
  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/addorganization');
  }

  //make sure every url reference is saved with full HTTP or HTTPS
  function saveUrl(entry){
    if (entry!=''){
      if (!/^(f|ht)tps?:\/\//i.test(entry)) {
        entry= "http://" + entry;
      }
    }
    return entry;
  }

  var organization = new Organization({
    name: req.body.name,
    email: req.body.email,
    Location: {
          address: req.body.address
        , latitude: req.body.latitude
        , longitude: req.body.longitude
        },
    phoneNumber: req.body.phoneNumber,
    website: saveUrl(req.body.website),
    twitter: saveUrl(req.body.twitter),
    facebook: saveUrl(req.body.facebook),
    tumblr: saveUrl(req.body.tumblr),
    logo: saveUrl(req.body.logo),
    parentOrganization: req.body.parentOrganization,
    yearFounded: req.body.yearFounded,
    descriptionService: req.body.descriptionService,
    primaryBusinessSector: req.body.primaryBusinessSector,
    descriptionCause: req.body.descriptionCause,
    socialPurposeCategory: req.body.socialPurposeCategory,
    organizationalStructure: req.body.organizationalStructure,
    privateNote: req.body.privateNote,
    active: req.body.active,
    additionalResources: [ {resourceUrl: saveUrl(req.body.resourceUrl), resourceName: req.body.resourceName } ],
    createdBy: req.user._id
  });

  Organization.findOne({ name: req.body.name }, function(err, existingOrganization) {
    if (existingOrganization) {
      req.flash('errors', { msg: 'Organization with that name already exists.' });
      return res.redirect('/addorganization');
    }
    organization.save(function(err) {
      if (err) { 
        return next(err);
      } else {
        res.redirect('/');
      }
    });
  });

};
