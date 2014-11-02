/**
 * Module dependencies.
 */

var express = require('express');
var cookieParser = require('cookie-parser');
var compress = require('compression');
var session = require('express-session');
var bodyParser = require('body-parser');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var csrf = require('lusca').csrf();
var methodOverride = require('method-override');

var _ = require('lodash');
var MongoStore = require('connect-mongo')(session);
var flash = require('express-flash');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');
var expressValidator = require('express-validator');
var connectAssets = require('connect-assets');

//load local azuresearch config
var azureSearch = require('./libs/azuresearch');
/**
 * Controllers (route handlers).
 */

var homeController = require('./controllers/home');
var userController = require('./controllers/user');
var organizationController = require('./controllers/organization');
var websiteController = require('./controllers/website');

/**
 * API keys and Passport configuration.
 */

var secrets = require('./config/secrets');
var passportConf = require('./config/passport');

/**
 * Create Express server.
 */

var app = express();

/**
 * Connect to MongoDB.
 */

mongoose.connect(secrets.db);
mongoose.connection.on('error', function() {
  console.error('MongoDB Connection Error. Make sure MongoDB is running.');
});

azureSearch.initIndex();

var hour = 3600000;
var day = hour * 24;
var week = day * 7;

/**
 * CSRF whitelist.
 */

var csrfExclude = ['/url1', '/url2'];

/**
 * Express configuration.
 */

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(function(req, res, next){
  var contentParse = function (content){
      content = content.replace(/\n?\r\n/g, '<br />' );
      return content;
  };
  res.locals.contentParse = contentParse;
  next();
});
app.use(compress());
app.use(connectAssets({
  paths: [path.join(__dirname, 'public/css'), path.join(__dirname, 'public/js'),path.join(__dirname, 'public/components')],
  helperContext: app.locals
}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(methodOverride(function(req, res){
  //config of method override to be able to use a POST form to make a PUT query to the API
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    var method = req.body._method
    delete req.body._method
    return method
  }
}));
app.use(cookieParser());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: secrets.sessionSecret,
  store: new MongoStore({
    url: secrets.db,
    auto_reconnect: true
  }, function () {
    console.log("mongostore db connection open");
  })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(function(req, res, next) {
  // CSRF protection.
  if (_.contains(csrfExclude, req.path)) return next();
  csrf(req, res, next);
});
app.use(function(req, res, next) {
  // Make user object available in templates.
  res.locals.user = req.user;
  res.locals.host = 'http://localhost:'+app.get('port');
  next();
});
app.use(function(req, res, next) {
  // Remember original destination before login.
  var path = req.path.split('/')[1];
  if (/auth|login|components|logout|signup|fonts|favicon/i.test(path)) {
    return next();
  }
  req.session.returnTo = req.path;
  next();
});
app.use(express.static(path.join(__dirname, 'public'), { maxAge: week }));

/**
 * Main routes. Pages
 */
app.get('/admin', passportConf.isAuthenticated,homeController.index);
app.get('/login', userController.getLogin);
app.post('/login', userController.postLogin);
app.get('/logout', userController.logout);
app.get('/forgot', userController.getForgot);
app.post('/forgot', userController.postForgot);
app.get('/reset/:token', userController.getReset);
app.post('/reset/:token', userController.postReset);
app.get('/signup', userController.getSignup);
app.post('/signup', userController.postSignup);
app.get('/account', passportConf.isAuthenticated, userController.getAccount);
app.post('/account/profile', passportConf.isAuthenticated, userController.postUpdateProfile);
app.post('/account/password', passportConf.isAuthenticated, userController.postUpdatePassword);
app.post('/account/delete', passportConf.isAuthenticated, userController.postDeleteAccount);
app.get('/admin/organization',passportConf.isAuthenticated,organizationController.addOrganization);
app.get('/searchorganization',organizationController.searchOrganization);
app.post('/admin/organization', passportConf.isAuthenticated,organizationController.postOrganization);
app.get('/admin/organization/:slug',passportConf.isAuthenticated,organizationController.updateOrganization);
app.put('/admin/organization/:slug', passportConf.isAuthenticated,organizationController.putOrganization);
app.delete('/admin/organization/:slug', passportConf.isAuthenticated,organizationController.deleteOrganization);
app.get('/reloadOrganizationsInAzure',passportConf.isAuthenticated,organizationController.getReloadOrganizationsInAzure);
//public facing views
app.get('/map',organizationController.getMap);
app.get('/',websiteController.getHome);
app.get('/aboutus',websiteController.getAboutUs);
app.get('/contactus',websiteController.getContactUs);
app.post('/contactus',websiteController.postContactUs);
app.get('/organization/:slug',websiteController.getOrganization);

/**
* Public REST API routes
*/
app.get('/api/organization', organizationController.getOrganization);
app.get('/api/organization/:slug', organizationController.getOrganizationSlug);


/**
 * 500 Error Handler.
 */
if (process.env.NODE_ENV === 'development') {
  app.use(errorHandler());
}

// catch 404 & 500 errors
app.use(websiteController.notFound);

/**
 * Start Express server.
 */

app.listen(app.get('port'), function() {
  console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
});

module.exports = app;