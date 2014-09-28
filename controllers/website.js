/**
 * GET /
 * Show home page
 */
 exports.getHome = function(req, res) {
  res.render('websiteViews/home', {
    title: 'Home Page'
  });
};