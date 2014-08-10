var secrets = require('../config/secrets');
var Organization = require('../models/Organization');

/**
 * GET /organization
 * List of all organizations
 */

exports.getOrganization = function(req, res) {
  res.render('organization/list', {
    title: 'List of Organizations'
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
 * POST /organization
 * Add a new organization
 */

exports.postOrganization = function(req, res) {
  console.log(req);

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

  var organization = new Organization({
    name: req.body.name,
    email: req.body.email,
    Location: {
          address: req.body.address
        , latitude: req.body.latitude
        , longitude: req.body.longitude
        },
    phoneNumber: req.body.phoneNumber,
    website: req.body.website,
    twitter: req.body.twitter,
    facebook: req.body.facebook,
    tumblr: req.body.tumblr,
    logo: req.body.logo,
    parentOrganization: req.body.parentOrganization,
    yearFounded: req.body.yearFounded,
    descriptionService: req.body.descriptionService,
    primaryBusinessSector: req.body.primaryBusinessSector,
    descriptionCause: req.body.descriptionCause,
    socialPurposeCategory: req.body.socialPurposeCategory,
    organizationalStructure: req.body.organizationalStructure,
    privateNote: req.body.privateNote,
    active: req.body.active,
    additionalResources: [ {resourceUrl: req.body.resourceUrl, resourceName: req.body.resourceName } ],
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
