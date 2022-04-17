var express = require("express");
//Import the mongoose module
var mongoose = require("mongoose");
const crypto = require ("crypto");
var UserDatamodel = require("./models/classes");
var bodyParser = require("body-parser");
const router = require("express").Router();
var {newUserModel, Appointment} = require('./models/usermodel');
const bcrypt = require('bcryptjs')
const session = require('express-session');
const { MongoDBStore } = require("connect-mongodb-session");
const mongoDBSession = require('connect-mongodb-session')(session);
require("dotenv").config();

var app = express();
app.use(bodyParser.json()); // Used to parse JSON bodies
// or
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));

// //Set up default mongoose connection

const mongoUri = 
'mongodb+srv://nodeassignmentdatabase:LBwwV5OmbR7vyCdU@cluster0.mqo4s.mongodb.net/test'

  // "mongodb+srv://nodeassignmentdatabase:LBwwV5OmbR7vyCdU@cluster0.rvyuk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
  // "mongodb+srv://Academicdons:Gichengo254@cluster0.rvyuk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
mongoose
  .connect(mongoUri, {
    useNewUrlParser:true,
    useUnifiedTopology:true,
  })
  // .then((result) => app.listen(27))
  .catch((err) => console.log(Error));

//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on("error", console.error.bind(console, "MongoDB connection error:"));

const store = new mongoDBSession({
  uri: mongoUri,
  collection: "mySession",
});

//create sesssion for page authorisation
app.use(
  session({
    secret: "process.env.",
    resave:false,
    saveUninitialized:false,
    // store:store,
  })
);

// set the view engine to ejs
app.set("view engine", "ejs");
app.use(express.static("public"));
// use res.render to load up an ejs view file

// is driver middleware
const isDriver = (req, res, next) =>{

  const sess = req.session;
  if(req.session.isAuth){
    console.log("in the isDriver fuc");
    console.log(sess.role);
    if (sess.role == "Driver"){
      res.redirect('/notpermitted');
    }else{
      next();
    }
  }else{
    console.log("User aint logged in");
    res.redirect("/login");
  }
}

// Is admin middleware
const isAdmin = (req, res, next) =>{
  const sess = req.session;
  if(req.session.isAuth){
    console.log("in the isAdmin fuc");
    console.log(sess.role);
    if (sess.role == "Admin"){
      res.redirect('/notpermitted');
    }else{
      next();
    }
  }else{
    console.log("User aint logged in");
    res.redirect("/login");
  }

}

// Is admin middleware
const isExaminer = (req, res, next) =>{

  const sess = req.session;
  if(req.session.isAuth){
    console.log("in the isExaminer fuc");
    console.log(sess.role);
    if (sess.role == "Examiner"){
      res.redirect('/notpermitted');
    }else{
      next();
    }
  }else{
    console.log("User aint logged in");
    res.redirect("/login");
  }

}

//check authentification of users
const isAuth = (req, res, next) =>{
const sess = req.session;
if(req.session.isAuth){
  console.log("in the Auth fuc");
  console.log(sess.role);
  if(sess.role == "Driver"){
    next();
  }else if (sess.role == "Examiner"){
    res.redirect('/notpermitted');
  }
  else if (sess.role == "Admin"){
    res.redirect('/notpermitted');
  }
}else{
  console.log("USer aint logged in");
  res.redirect("/login");
}

}

// index page
app.get("/notpermitted", function (req, res) {
  
  res.render("pages/notpermitted");
});


// index page
app.get("/", function (req, res) {
  const sess = req.session;
  if(sess.username) {
      return res.render("pages/loggedIndex");
  }
  console.log(req.session);
  res.render("pages/index");
});

// Goes to the login page
router.get("/login", function (req, res) {
  const sess = req.session;
    if(sess.username) {
        return res.redirect('/G2_page');
    }

  res.render("pages/login");
});



router.post("/loginUser", async (req, res) => {
  const { username, password } = req.body;
  console.log( username, password );

  const user = await newUserModel.findOne({username});
  if (!user){
    return res.redirect('/signup');
  };
  const isMatch = await bcrypt.compare(password, user.password);
  var userRole = user.role;
  
  console.log("user Role: ", userRole);
  if(!isMatch){
    res.json({
      message: 'Incorrect Password!'
    });
    return res.redirect("/login");
  }
  var sess = req.session;
  sess.username = username;
  sess.role = userRole;
  sess.isAuth = true;
  if(sess.role == "Admin"){
    console.log("User is Admin");
    res.redirect("/appointment");
  }else{
    res.redirect("/G2_page");
  }  
});


router.get('/logout',(req,res) => {
  req.session.destroy((err) => {
      if(err) {
          return console.log(err);
      }
      res.redirect('/');
  });

});


// Goes to the signup page
router.get("/signup", function (req, res) {
  const sess = req.session;
    if(sess.username) {
        return res.redirect('/G2_page');
    }

  res.render("pages/signup");
});


router.post("/usersignup", async (req, res, next) =>{
  const { username, role, password } = req.body;

  console.log(username, role, password);

  let user = await newUserModel.findOne({username});

  if (user) {
    console.log("User exist");
    return res.redirect('/signup'); 
  };

  const hashedPsw = await bcrypt.hash(password, 12); //encrypt the password

  user = new newUserModel({
    username,
    password: hashedPsw,
    role,
  });
  await user.save();
  //next
  res.redirect("/login");
});

router.post("/userdatarefinery",  isAuth, async (req, res, next) => {
  const { DOB, licence, bookingDate, bookingTime } = req.body;
  const algorithm = "aes-256-cbc"; 
// generate 16 bytes of random data
  const initVector = crypto.randomBytes(16);
  const message = DOB;
  const licenceNo = licence;
  const Securitykey = crypto.randomBytes(32);
  // the cipher function
  const cipher = crypto.createCipheriv(algorithm, Securitykey, initVector);
  const cipherTWo = crypto.createCipheriv(algorithm, Securitykey, initVector);

// encrypt the message
// input encoding
// output encoding
  let encryptedDOBData = cipher.update(message, "utf-8", "hex");
  let encryptedLicenceData = cipherTWo.update(licenceNo, "utf-8", "hex");

  encryptedLicenceData  += cipherTWo.final("hex");
  encryptedDOBData += cipher.final("hex");

  console.log("Encrypted message: " + encryptedDOBData + "Enctypted Licence" + encryptedLicenceData);

  let appt = await Appointment.findOneAndUpdate({date: bookingDate, time: bookingTime, isTimeSlotAvailable: false});

  var UserDataItems = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    userId: req.body.userId,
    DOB: encryptedDOBData,
    address: req.body.address,
    carDetails: req.body.carDetails,
    LicenceNumber:encryptedLicenceData,
    appointment: appt._id,
  };
  var data = new UserDatamodel(UserDataItems);
  data.save();
  sess =  req.session;
  sess.encryptedDOBData = encryptedDOBData;
  sess.encryptedLicenceData = encryptedLicenceData;
  res.redirect("/G_page");
});


// Goes to the applications appointment
router.post("/appointment", isDriver, async (req, res)=> {
  const sess = req.session;
  let booking_date = new Date(req.body.bookingDate);
  let booking_time = req.body.bookingTime;
  
  // EndtimeStamp.setTime(starttimestamp.getTime() + (30 * 60 * 1000));

  let BookingItems = {
    date: booking_date,
    time: booking_time,
    isTimeSlotAvailable: true
  };
  let data = new Appointment(BookingItems);
  await data.save();
  console.log("Item saved successfully");
  res.render("pages/appointment");
});

router.get("/appointmentSlots/", isDriver, async (req, res) => {
  let reqDate = new Date(req.query.date);
  let appointments = await Appointment.find({date: reqDate});
  res.status(200).json(appointments);
});

router.get("/slots", isAdmin, async (req, res) => {
  let reqDate = new Date(req.query.date);
  let appointments = await Appointment.find({date: reqDate, isTimeSlotAvailable: true});
  res.status(200).json(appointments)
});

// Goes to the appointments
router.get("/appointment", isDriver, (req, res)=> {
  res.render("pages/appointment");
});
// Goes to the G2_page
router.get("/G2_page", isAuth, (req, res)=> {
  res.render("pages/G2_page");
});

router.get("/G_page", isAuth, (req, res) =>{
  res.render("pages/G_page");
});

// Goes to the G_page
router.post("/G_pagequery", isAuth, async (req, res) => {
  // query the database engine
  // respond with template data
  var userId = req.body.user_id;
  console.log(userId);
  try {
    const data =  await UserDatamodel.findOne({ userId: userId })
    if (data) {
      console.log(data);
      
      res.render("pages/vehicleData", { data });
        
    } else {
      console.log("User does not exist");
      res.redirect("/G2_page");
    }
  }
  catch(err) {
    console.log(err);
    res.redirect("/G2_page");
  };
  // console.log(req.query);
  // console.log(result);
});


router.post("/userdataupdate", isAuth, (req, res, next) =>{
  const userId = { userId: req.body.userId };
  const neData = { address: req.body.address, carDetails: req.body.carDetails };
  let doc = UserDatamodel.findOneAndUpdate(userId, neData);
  res.render("pages/G_page");
  console.log(doc);
});

app.use('/', router);

app.listen(8080, () => {
  console.log("Server is live on http:/localhost:8080");
});
//add the router
