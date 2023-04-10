var passport = require("passport");
var config = require("../config/database");
require("../config/passport")(passport);
var express = require("express");
var jwt = require("jsonwebtoken");
var router = express.Router();
var User = require("../models/user");
var Book = require("../models/book");

const bodyParser = require("body-parser");

const request = require('request');

router.use(bodyParser.json());

const parser = bodyParser.urlencoded({ extended: true });

router.use(parser);

const signUpObj = {
  pageTitle: "Sign up",
  task: "Sign up",
  actionTask: "/api/signup",
};
router.get("/signup", async (req, res) => {
  res.render("sign_up", signUpObj);
});
router.post("/signup", async function (req, res) {
  if (!req.body.username || !req.body.password) {
  
    signUpObj.notify = "Please pass username and password.";
    return res.render("sign_up", signUpObj);
  } else {
   
    let check = await User.findOne({ username: req.body.username })
      .lean()
      .exec();
    console.log("check username available ", check);
    if (check) {
      signUpObj.notify = "username not available. Try another username";
      return res.render("sign_up", signUpObj);
    }

    var newUser = new User({
      username: req.body.username,
      password: req.body.password,
    });
   
    await newUser.save();

    return res.redirect("/api/signin");
  }
});


const signInObj = {
  pageTitle: "Sign in",
  task: "Sign in",
  actionTask: "/api/signin",
  optionsRegister: true,
};
const homeObj = {
  pageTitle: "Trang chu",
};
router.get("/signin", async (req, res) => {
  res.render("sign_in", signInObj);
});
router.post("/signin", async function (req, res) {
  let user = await User.findOne({ username: req.body.username });
  console.log(req.body);
  if (!user) {
    signInObj.notify = "Authentication failed. User not found.";
    return res.render("sign_in", signInObj);
  } else {
   
    user.comparePassword(req.body.password, function (err, isMatch) {
      if (isMatch && !err) {
        // if user is found and password is right create a token
        var token = jwt.sign(user.toJSON(), config.secret, { expiresIn: "1800s" });
       
        homeObj.user = user.toObject();
        req.session.user = user.toObject();
        req.session.token = "JWT " + token;

        request.get('http://localhost:3000/api/book', {
          headers: { 'Authorization': 'JWT ' + token}
        }, function (error, response, body) {
          res.send(body);
        });
      } else {
        
        signInObj.notify = "Authentication failed. Wrong password.";
        return res.render("sign_in", signInObj);
      }
    });
  }
});

// #BOOK
router.post("/book",function (req, res) {
  passport.authenticate("jwt", { session: false });
  var token = req.session.token;
  if (token) {
    console.log(req.body);
    var newBook = new Book({
      isbn: req.body.isbn,
      title: req.body.title,
      author: req.body.author,
      publisher: req.body.publisher,
    });

    newBook
      .save()
      .then(() => {
        res.redirect("/");
      })

      .catch((e) => {
        res.json({ success: false, msg: "Save book failed." });
      });
  } else {
    return res.status(403).send({ success: false, msg: "Unauthorized." });
  }
});

router.get("/book", async function (req, res) {

  var token = getToken(req.headers);

  console.log(token);

  if (token) {
    let books = await Book.find({}).lean().exec();

    return res.render("home", {
      pageTitle: "List book",
      books,
    });
  } else {
    return res.redirect("/api/signin");
  }
});

router.get("/book/create", (req, res, next) => {
  var token = req.session.token;
  if (token) {
    res.render("create", {
      pageTitle: "Add book",
    });
  } else {
    return res.redirect("/api/signin");
  }
});

getToken = (headers) => {
  if (headers && headers.authorization) {
    var parted = headers.authorization.split(" ");
    if (parted.length === 2) {
      return parted[1];
    } else {
      return null;
    }
  } else {
    return null;
  }
};

module.exports = router;
