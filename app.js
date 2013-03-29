var fs = require('fs');
var express = require('express');
    var app = express();

var mongoose = require('mongoose');
  var Schema = mongoose.Schema;

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.locals.pretty = true;
// app.use(express.favicon(__dirname + '/public/img/favicon.ico'));
app.use(express.bodyParser({ keepExtensions: true, uploadDir:__dirname + '/uploads' }));
app.use(express.cookieParser());
app.use(express.session({ secret: 'keyboard cat' }));
app.use(express.static(__dirname + '/public'));

app.configure(function(){
  //...
  app.use(function(req, res, next){
    res.locals.session = req.session;
    res.locals.menu = null;
    next();
  });
  //...
});

mongoose.connect('localhost', 'test');

var scheduleSchema = new Schema({
  year: Number,
  month: String,
  day: Number
});

var courseSchema = new Schema({
  title: String,
  description: String,
  price: Number,
  cathegory: String,
  schedule: [scheduleSchema],
  date: {type: Date, default: Date.now},
});

var UserSchema = new Schema({
  name: String,
  login: String,
  pass: String,
  email: String,
  skype: String,
  status: {type: String, default: 'User'},
  date: {type: Date, default: Date.now},
  items: [courseSchema]
});


var User = mongoose.model('User', UserSchema);
var Course = mongoose.model('Item', courseSchema);
/*
var user = new User();
user.name = 'foo';
user.pass = 'bar';
user.items.push({title:'Macbook', description:'Apple Computer', img:'img1.jpg'});

user.save(function(err) {
  if (err) { throw err;}
  console.log('User created');
  //mongoose.disconnect();
});
*/
// 1 рассинхрон загрузки файла с очередью БД

// var course = new Course();
// course.title = 'Cool';
// course.description = 'ZOZOOZOZOZ';
// course.cathegory = 'two';
// course.save(function() {
//   console.log('course created');
// });


function checkAuth(req, res, next) {
  if (!req.session.user_id) {
    res.redirect('/registr');
  } else {
    next();
  }
}

app.get('/', function(req, res){
  if (req.session.user_id)
    res.redirect('/courses')
  else
    res.render('index');
});

// app.get('/login', function(req, res){
//   if (req.session.user_id == '4786242642') {
//     res.redirect('/');
//   }
//   else {
//     res.render('login', {status: true});
//   }
// });

app.post('/', function (req, res) {
  var post = req.body;

  User.findOne({ 'login': post.login, 'pass': post.password }, function (err, person) {
    if (err) return handleError(err);
    if (person) {
      req.session.user_id = person._id; 
      req.session.status = person.status;
      req.session.name = person.name;
      res.redirect('/');
    } else {
      res.render('index', {status: false});
    }
  });
});

app.get('/logout', function (req, res) {
  delete req.session.user_id;
  delete req.session.status;
  delete req.session.name;
  res.redirect('/');
});

app.get('/registr', function(req, res) {
  res.render('registr');
});

app.post('/registr', function (req, res) {
  var post = req.body;
  var user = new User();
  var regMail = /^([a-z0-9_-]+\.)*[a-z0-9_-]+@[a-z0-9_-]+(\.[a-z0-9_-]+)*\.[a-z]{2,6}$/;


  user.login = post.login;
  user.name = post.name;
  user.pass = post.password;
  // !!!!!!!!!
  if (regMail.test(post.email)) {
    user.email = post.email;
  }
  else {
    res.redirect('/');
  }
  user.skype = post.skype;

  user.save(function(err) {
    if(err) {
      throw err;
    }
    console.log('New User created');
    res.redirect('/');
  });
});

app.get('/courses', function (req, res) {
  res.locals({menu:'courses'});

  res.render('courses');
});

app.get('/courses/:course', function (req, res) {
  res.locals({menu:'courses'});

  Course.find({'cathegory': req.params.course}, function(err, course) {
    res.render('course', {course: course});
  });
});

app.get('/courses/:course/:id', function (req, res) {
  res.locals({menu:'courses'});

  var id = req.params.id;
  Course.findById(id, function(err, item) {
    res.render('item', {item: item});
  });
});

app.post('/courses/:course/:id', checkAuth, function (req, res) {
  var id = req.params.id;
  var post = req.body;
  var userID = req.session.user_id;
  // !!!!!!!!!!!!!
  User.findById(userID, function (err, person) {
    Course.findById(id, function(err, item) {
      person.items.push(item);
      person.save(function() {
        res.redirect('back');
      });
    });
  });
});

app.get('/you', function (req, res) {
  res.locals({menu:'you'});
  var userID = req.session.user_id;

  User.findById(userID, function (err, person) {
    res.render('you', {items: person.items});
  });
});

app.get('/auth', checkAuth, function(req, res) {
  if (req.session.status == 'User')
    res.render('auth');
  else
    res.render('error');
});

app.get('/auth/add', checkAuth, function(req, res) {
  res.render('add');
});

app.post('/auth/add', function(req, res) {
  var post = req.body;
  var course = new Course();

  course.title = post.title;
  course.description = post.description;
  course.cathegory = post.cathegory;
  course.price = post.price;
  course.schedule.push({
    year: post.year,
    month: post.month,
    day: post.day
  });
  course.save(function() {
    console.log('New course created');
    res.redirect('/auth');
  });
});

app.get('/auth/schedule', checkAuth, function(req, res) {
  Course.find({}, function(err, items) {
    res.render('schedule', {items: items});
  });
});

app.get('/auth/schedule/:id', checkAuth, function(req, res) {
  var id = req.params.id;

  Course.findById(id, function(err, course) {
    res.render('edit_schedule', {course: course});
  });
});

app.post('/auth/schedule/:id', checkAuth, function(req, res) {
  var id = req.params.id;
  var post = req.body;

  Course.findById(id, function(err, course) {
    course.schedule.push({
      year: post.year,
      month: post.month,
      day: post.day
    });
    console.log(course);
    course.save(function() {
      console.log('New schedule add');
      res.redirect('/auth');
    });
  });
});


app.get('/buy', checkAuth, function (req, res) {
  var userID = req.session.user_id;

  User.findById(userID, function(err, person) {
    res.render('buy', {name: person.name});
  });
});

app.get('/error', function (req, res) {
  res.render('error');
});

app.get('/contacts', function (req, res) {
  res.locals({menu:'contacts'});

  res.render('contacts');
});

app.get('/about', function (req, res) {
  res.locals({menu:'about'});

  res.render('about');
});









app.get('/auth/edit/:item', checkAuth, function(req, res) {
  var itemID = req.params.item;
  var user = req.session.user;
  var pass = req.session.pass;

  User.findOne({'name': user, 'pass': pass}, function(err, user) {
    var doc = user.items.id(itemID);
    if (doc) {
      res.render('edit', {item: doc});
    } else {
      res.redirect('/auth/view');
    }
  });
});

app.post('/auth/edit/:item', function(req, res) {
  var post = req.body;
  var itemID = req.params.item;
  var user = req.session.user;
  var pass = req.session.pass;

  User.findOne({'name': user, 'pass': pass}, function(err, user) {
    var title = user.items.id(itemID).title = post.title;
    var description = user.items.id(itemID).description = post.description;
    user.save();
    res.redirect('/auth/view');
  });
});

app.get('/auth/view', checkAuth, function(req, res) {
  var user = req.session.user;
  var pass = req.session.pass;

  User.findOne({'name': user, 'pass': pass}, function(err, user) {
    res.render('view', {items:user.items});
  });
});

app.get('/auth/view/:item', checkAuth, function(req, res) {
  var user = req.session.user;
  var pass = req.session.pass;

  User.findOne({'name': user, 'pass': pass}, function(err, user) {
    doc = user.items.id(req.params.item);
    res.render('item', {item:doc});
  });
});

app.post('/auth/view/:item', function(req, res) {
  var post = req.body;
  var user = req.session.user;
  var pass = req.session.pass;

  if (post.delete) {
    User.findOne({'name': user, 'pass': pass}, function(err, user) {
      fs.unlink(__dirname + '/public' + user.items.id(post.delete).img);
      doc = user.items.id(post.delete).remove();
      user.save();
      res.redirect('/auth/view');
    });
  }
  else if (post.edit) {
    res.redirect('/auth/edit/' + post.edit);
  }
});

app.get('/history', function (req, res) {
  res.render('history');
});

app.listen(3000);
console.log('http://127.0.0.1:3000')