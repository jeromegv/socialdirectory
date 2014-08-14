var Organization = require('../models/Organization');
var moment = require('moment');
var request = require('request');

/**
 * GET /
 * Home page.
 */


exports.index = function(req, res) {
	var options = {
	    url: res.locals.host+'/api/organization',
	    json: true
	};
	request(options, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			body.sort(function(a, b) {
				//extract timestamp from _id and sort by this value
				var first = parseInt(a['_id'].substr(0, 8),16)*1000;
				var second = parseInt(b['_id'].substr(0, 8),16)*1000;
				return (second-first);
			});
			res.render('home', {
				title: 'Home',
				organizations: body,
				moment: moment
			});
		}
	});
};
