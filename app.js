// jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Connection URL for localhost
//mongoose.connect("mongodb://localhost:27017/todolistDB", { useNewUrlParser: true, useUnifiedTopology: true });

// Connection URL for server
mongoose.connect("mongodb+srv://admin-anas:(URL of DB)", { useNewUrlParser: true, useUnifiedTopology: true });

//Create Schema
const itemsSchema = {
  name: String
};

const listSchema = {
  name: String,
  items: [itemsSchema]
};


//Create collection (Tabel)
const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

// Insert some documents
const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

//Get Home
app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){
    if (foundItems.length === 0){
      // //Insert items
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("successfully saved all the items to todolistDB");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });
});

//Get Dinamec Page
app.get("/:customListName", function(req, res){
  const customListName = _.capitalize( req.params.customListName);
  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      if (!foundList){
        //Create a new list
        //console.log("Doesnt exist!");
        const list = new List({
          name:customListName,
          items:defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //show an existing list
        //console.log("Exist!");
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});

//Post Home
app.post("/", function(req, res){
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });
  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

//Post delete item
app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Successfuly delete checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }
});

//Get Work
app.get("/work", function(req, res){
  res.render("list", {listTitle: "Work List", newListItems:workItems});
});


//Get About
app.get("/about", function(req, res){
  res.render("about");
});

//Create Port
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully");
});
