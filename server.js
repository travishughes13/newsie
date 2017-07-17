// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");
var request = require("request");
var cheerio = require("cheerio");
mongoose.Promise = Promise;

var app = express();

app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(express.static("public"));

mongoose.connect("mongodb://localhost/week18day3mongoose");
var db = mongoose.connection;

db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

db.once("open", function() {
  console.log("Mongoose connection successful.");
});

// Routes
// ======
app.get("/scrape", function(req, res) {
  request("http://www.echojs.com/", function(error, response, html) {
    var $ = cheerio.load(html);
    $("article h2").each(function(i, element) {

      var result = {};

      result.title = $(this).children("a").text();
      result.link = $(this).children("a").attr("href");

      var entry = new Article(result);

      entry.save(function(err, doc) {
        if (err) {
          console.log(err);
        }
        else {
          console.log(doc);
        }
      });

    });
  });
  res.send("Scrape Complete");
});

app.get("/articles", function(req, res) {
  Article.find({}, function(err, doc) {
    if (err) {
      res.send(err);
    }
    else {
      res.send(doc);
    }
  });
});

app.get("/articles/:id", function(req, res) {
  Article.findOne({_id: req.params.id}
  ).populate("note").exec(
    function(err, doc) {
      if (err) {
        res.send(err);
      }
      else {
        res.send(doc);
      }
  });
});

app.post("/articles/:id", function(req, res) {
  var newNote = new Note(req.body);

  newNote.save(function(err, doc) {
    if (err) {
      res.send(err);
    }
    else {
      Article.findOneAndUpdate({"_id": req.params.id}, { $push: { "notes": doc._id } }, {new: true}, function(err, newdoc) {
        if (err) {
          res.send(err);
        }
        else {
          res.send(newdoc);
        }
      });
    }
  });
});

app.listen(3000, function() {
  console.log("App running on port 3000!");
});
