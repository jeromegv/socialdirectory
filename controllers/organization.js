var secrets = require('../config/secrets');
var Organization = require('../models/Organization');
var request = require('request');

//make sure every url reference is saved with full HTTP or HTTPS
function saveUrl(entry){
  if (entry!=''){
    if (!/^(f|ht)tps?:\/\//i.test(entry)) {
      entry= "http://" + entry;
    }
  }
  return entry;
}

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
 * GET /api/organization/:id
 * Get a specific organization
 */

exports.getOrganizationId = function(req, res) {
  Organization.findById(req.params.id,function(err, organization) {
    if (!err){
      return res.jsonp(organization);
    } else {
      return res.send(err);
    }
  });
};

/**
 * GET /organization
 * Render form page to add a new organization
 */

exports.addOrganization = function(req, res) {
  res.render('organization/add', {
    title: 'Add Organization'
  });
};

/**
 * GET /organization/:id
 * Render form page to add a new organization
 */

exports.updateOrganization = function(req, res) {
  var options = {
      url: res.locals.host+'/api/organization/'+req.params.id,
      json: true
  };
  request(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.render('organization/update', {
        title: 'Update Organization',
        organization: body
      });
    }
  });
};

/**
 * POST /organization
 * Add a new organization
 */

exports.postOrganization = function(req, res,next) {
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

  if (req.body.yearFounded!=''){
    req.assert('yearFounded', 'Year Founded is not valid').isInt();
  }
  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('back');
  }

  if (req.body.resourceName.length != req.body.resourceUrl.length){
    req.flash('errors', { msg: 'You must fill both Resource name and URL for each Additional Resources' });
    return res.redirect('back');
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
    createdBy: req.user._id
  });

  var additionalResources = new Array();
  req.body.resourceName.forEach(function(entry,index) {
      additionalResources[index]={resourceName:entry,resourceUrl:saveUrl(req.body.resourceUrl[index])};
  });
  organization.additionalResources = additionalResources;

  Organization.findOne({ name: req.body.name }, function(err, existingOrganization) {
    if (existingOrganization) {
      req.flash('errors', { msg: 'Organization with that name already exists.' });
      return res.redirect('/organization');
    }
    organization.save(function(err) {
      if (err) { 
        return next(err);
      } else {
        return res.redirect('/');
      }
    });
  });
};


/**
 * PUT /organization/:id
 * Update an organization
 */
exports.putOrganization = function(req, res,next) {
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

    if (req.body.yearFounded!=''){
      req.assert('yearFounded', 'Year Founded is not valid').isInt();
    }
    var errors = req.validationErrors();

    if (errors) {
      req.flash('errors', errors);
      return res.redirect('back');
    }

    if (req.body.resourceName.length != req.body.resourceUrl.length){
      req.flash('errors', { msg: 'You must fill both Resource name and URL for each Additional Resources' });
      return res.redirect('back');
    }

    var organization = {
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
    lastUpdated: Date.now()
  };    
  var additionalResources = new Array();
  req.body.resourceName.forEach(function(entry,index) {
      additionalResources[index]={resourceName:entry,resourceUrl:saveUrl(req.body.resourceUrl[index])};
  });
  organization.additionalResources = additionalResources;

  Organization.update({ _id: req.params.id }, organization, {safe:true, multi:false}, function(err, result){
    if (err) {
        console.log(err);
        return next(err);
    } else {
      if (result===1){
        return res.redirect('/');
      } else {
        console.log('No records were updated');
        return next(new Error('No records were updated'));
      }
    }
    
  });
};

/**
 * DELETE /organization/:id
 * Update an organization
 */
exports.deleteOrganization = function (req,res,next){
  Organization.remove({
      _id:req.params.id
    }, function(err, org) {
      if (err){
        console.log(err);
        return next(err);
      } else {
        return res.redirect('/');
      }
    });
}
