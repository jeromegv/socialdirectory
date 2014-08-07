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
 * List of all organizations
 */

exports.addOrganization = function(req, res) {
  res.render('organization/add', {
    title: 'Add Organization'
  });
};


/**
 * POST /organization
 * Add a new organization
 * @param email
 * @param name
 * @param message
 */

exports.postOrganization = function(req, res) {
  req.assert('name', 'Name cannot be blank').notEmpty();
  req.assert('email', 'Email is not valid').isEmail();
  req.assert('message', 'Message cannot be blank').notEmpty();

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/contact');
  }

  var from = req.body.email;
  var name = req.body.name;
  var body = req.body.message;
  var to = 'your@email.com';
  var subject = 'Contact Form | Hackathon Starter';

  var mailOptions = {
    to: to,
    from: from,
    subject: subject,
    text: body
  };

  transporter.sendMail(mailOptions, function(err) {
    if (err) {
      req.flash('errors', { msg: err.message });
      return res.redirect('/contact');
    }
    req.flash('success', { msg: 'Email has been sent successfully!' });
    res.redirect('/contact');
  });
};
