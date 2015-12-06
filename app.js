var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var routes = require('./routes/index');
var users = require('./routes/users');
var gcm = require('./routes/gcm');
var yo = require('./routes/yo');
var fs = require('fs');

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

var app = express();
app.set('port', process.env.PORT || 8330);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//yo api
app.post('/adduser', yo.adduser);

//deprecate
//app.post('/username', yo.username);
app.post('/sendauth', yo.sendauth);
app.post('/authaccept', yo.authaccept);
app.post('/knock', yo.knock);
app.post('/image', multipartMiddleware, yo.image);
app.post('/clear', yo.reset);
app.post('/img', yo.imgs);
app.get('/profileImg', function(req,res){
    var id = req.query.id;
    console.log(id);
    fs.readFile('profileImg/'+id, function(error, data){
	res.writeHead(200, {'Content-Type': 'image/jpeg'});
	res.end(data);
    });
});
http.createServer(app).listen(app.get('port'), function(){
    console.log("Server is Running! 8330");
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
