var Organization = require('../models/Organization');
var moment = require('moment');
/**
 * GET /
 * Home page.
 */

exports.index = function(req, res) {
	Organization.find(function(err, organizations) {
		res.render('home', {
			title: 'Home',
			organizations: organizations,
			moment: moment
		});
	});
};
