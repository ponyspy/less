var fs = require('fs');
var jstoxml = require('jstoxml');
var express = require('express');
    var app = express();

var mongoose = require('mongoose');
  var Schema = mongoose.Schema;
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.locals.pretty = true;
// app.use(express.favicon(__dirname + '/public/img/favicon.ico'));
app.use(express.bodyParser({ keepExtensions: true, uploadDir:__dirname + '/uploads' }));
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({ secret: 'keyboard cat' }));
app.use(express.static(__dirname + '/public'));
app.use(function(req, res, next) {
  res.locals.session = req.session;
  res.locals.menu = null;
  next();
});
app.use(app.router);


// -------------------
// *** Model Block ***
// -------------------


mongoose.connect('localhost', 'test');

var orderSchema = new Schema({
  user_id: String,
  course_id: String,
  course_date: String,
  date: {type: Date, default: Date.now},
});

var courseSchema = new Schema({
  title: String,
  description: String,
  price: Number,
  cathegory: String,
  schedule: [String],
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

var Order = mongoose.model('Order', orderSchema);
var User = mongoose.model('User', UserSchema);
var Course = mongoose.model('Item', courseSchema);


// ------------------------
// *** Middleware Block ***
// ------------------------


function getRespond (status) {
  var xml = jstoxml.toXML({
    result: {
      code: status
    }
  });
  return xml;
}

function checkAuth(req, res, next) {
  if (req.session.user_id)
    next();
  else
    res.redirect('/registr');
}

function checkAdmin (req, res, next) {
  if (req.session.status == 'Admin')
    next();
  else
    res.render('error');
}


// ------------------
// *** Main Block ***
// ------------------


app.get('/', function(req, res){
  if (req.session.user_id)
    res.redirect('/courses')
  else
    res.render('index');
});

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
      res.render('index');
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
  if (!req.session.user_id)
    res.render('registr');
  else
    res.redirect('/');
});

app.post('/registr', function (req, res) {
  var post = req.body;
  var user = new User();


  user.login = post.login;
  user.name = post.name;
  user.pass = post.password;
  user.email = post.email;
  user.skype = post.skype;

  user.save(function(err) {
    if(err) {throw err;}
    console.log('New User created');
    User.findOne({ 'login': post.login, 'pass': post.password }, function (err, person) {
      req.session.user_id = person._id; 
      req.session.status = person.status;
      req.session.name = person.name;      
      res.redirect('/');
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


// --------------------
// *** Course Block ***
// --------------------


app.get('/courses', function (req, res) {
  res.locals({menu:'courses'});

  res.render('courses');
});

app.get('/courses/:course', function (req, res) {
  var courseExp = /fon|methods|lessons|translate|country/

  if (courseExp.test(req.params.course)) {
    res.locals({menu:'courses'});

    Course.find({'cathegory': req.params.course}, function(err, course) {
      res.render('course', {course: course});
    });
  }
  else
    res.render('error');
});

app.get('/courses/:course/:id', function (req, res) {
  res.locals({menu:'courses'});

  var id = req.params.id;
  Course.findById(id, function(err, item) {
    // if (err) return IdError(err);
    // if (!item) return IdError(err);
    if (!item) return res.render('error');
    res.render('item', {item: item});
  });
});

app.post('/courses/:course/:id', checkAuth, function (req, res) {
  var post = req.body;
  var name = req.session.name;
  var order = new Order();

  order.course_id = req.params.id;
  order.user_id = req.session.user_id;
  order.course_date = post.date;
  order.save(function(err, order) {
    if(err) {throw err;}
    res.redirect('https://paymentgateway.ru/?project=5131&source=5131&amount=' + post.price + '&nickname=' + name + '&order_id=' + order._id);
  }); 
});


// -------------------
// *** Admin block ***
// -------------------


app.get('/auth', checkAdmin, function(req, res) {
  res.render('auth');
});

app.get('/auth/add', checkAdmin, function(req, res) {
  res.render('add');
});

app.post('/auth/add', function(req, res) {
  var post = req.body;
  var course = new Course();

  course.title = post.title;
  // course.description = post.description;
  course.cathegory = post.cathegory;
  course.price = post.price;
  // course.schedule.push(post.day + '.' + post.month + '.' + post.year);
  course.save(function() {
    console.log('New course created');
    res.redirect('/auth');
  });
});

app.get('/auth/schedule', checkAdmin, function(req, res) {
  Course.find({}, function(err, items) {
    res.render('schedule', {items: items});
  });
});

app.get('/auth/schedule/:id', checkAdmin, function(req, res) {
  var id = req.params.id;

  Course.findById(id, function(err, course) {
    res.render('edit_schedule', {course: course});
  });
});

app.post('/auth/schedule/:id', checkAuth, function(req, res) {
  var id = req.params.id;
  var post = req.body;

  Course.findById(id, function(err, course) {
    course.schedule.push(post.day + '.' + post.month + '.' + post.year);
    console.log(course);
    course.save(function() {
      console.log('New schedule add');
      res.redirect('/auth');
    });
  });
});

// !!!!!!!!!!!!!!!
app.get('/auth/view', checkAuth, function(req, res) {
  var id = req.session.user_id;
  var users = [];

  Order.find({}, function(err, orders) {
    orders.forEach(function(order) {
      User.findById(order.user_id, function(user) {
        users.push(user);
      });
    });
  });
  res.render('view', {users: users});
});


// --------------------
// *** Buy block ***
// --------------------


app.get('/buy', checkAuth, function (req, res) {
  var userID = req.session.user_id;

  User.findById(userID, function(err, person) {
    res.render('buy', {name: person.name});
  });
});

app.post('/buy', function (req, res) {
  var orderId = req.body.orderid;
  var xmlRes = jstoxml.toXML({
    result: {
      code: 'YES'
    }
  });
  Order.findById(orderId, function(err, order) {
    if (!order) return res.send(getRespond('NO'));
    Course.find({"schedule": order.course_date}, function(err, dates) {
      dates.forEach(function(date) {
        for (var i in date.schedule) {
          if (date.schedule[i] == order.course_date) {
            date.schedule.splice(i,1);
            date.save();
          }
        }
      });
    });

    User.findById(order.user_id, function (err, person) {
      Course.findById(order.course_id, function(err, item) {

        person.items.push({
          title: item.title,
          schedule: order.course_date
        });
        person.save(function() {
          res.send(getRespond('YES'));
        });
      });
    });
  });
});


// --------------------
// *** Statik block ***
// --------------------


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

app.get('*', function(req, res){
  res.render('error');
});


app.listen(3000);
console.log('http://127.0.0.1:3000')