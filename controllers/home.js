var Organization = require('../models/Organization');
var moment = require('moment');
var request = require('request');

/**
 * GET /
 * Home page.
 */

var host = 'http://localhost:3000/';

exports.index = function(req, res) {
	var options = {
	    url: host+'api/organization',
	    json: true
	};
	request(options, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			(body);
			res.render('home', {
				title: 'Home',
				organizations: body,
				moment: moment
			});
		}
	});
};
