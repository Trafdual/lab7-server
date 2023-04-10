
var express = require("express");
const expressHbs = require("express-handlebars");
const bodyParser = require("body-parser");
var mongoose = require("mongoose");
var passport = require("passport");
var config = require("./config/database");
const session = require("express-session");
var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

var apiRouter = require("./routes/api");

var app = express();

app.use(
  session({
    resave: true,
    saveUninitialized: true,
    secret: "somesecret",
    cookie: { maxAge: 600000 },
  })
);
app.engine(
  "hbs",
  expressHbs.engine({
    extname: "hbs",
  })
);
app.set("view engine", "hbs");
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/", indexRouter);
app.use("/users", usersRouter);

app.use("/api", apiRouter);

mongoose.connect(config.database, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});


app.use(passport.initialize());


app.use(function (req, res, next) {
  console.log("Not found");
  next();
});

module.exports = app;

const port = 8080;

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
