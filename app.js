const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const _ = require("lodash");
const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

mongoose.connect(process.env.DB_CONNECTION);

const todolistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});
const listSchema = {
  name: String,
  items: [todolistSchema],
};

const Item = mongoose.model("Item", todolistSchema);
const List = mongoose.model("List", listSchema);

const buyMilk = new Item({ name: "Buy Milk" });
const buySalt = new Item({ name: "Buy Salt" });
const defaultItems = [buyMilk, buySalt];

async function getItems() {
  const items = Item.find({});
  return items;
}

async function deleteItems(id) {
  const item = Item.findByIdAndRemove({ _id: id });
  return item;
}

async function find(customListName) {
  const item = List.findOne({ name: customListName });
  return item;
}

async function findOneAndUpdate(checkedItemId, deleteList) {
  const item = List.findOneAndUpdate(
    { name: deleteList },
    { $pull: { items: { _id: checkedItemId } } }
  );
  return item;
}
app.get("/", (req, res) => {
  getItems().then((foundItems) => {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems);
      res.redirect("/");
    } else {
      res.render("index", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

app.post("/", (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const newItem = new Item({ name: itemName });
  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    find(listName).then((foundList) => {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const deleteList = req.body.delete;
  if (deleteList === "Today") {
    deleteItems(checkedItemId);
    res.redirect("/");
  } else {
    findOneAndUpdate(checkedItemId, deleteList)
      .then(() => {
        res.redirect("/" + deleteList);
      })
      .catch(() => {
        console.log("custom list delete error occured");
      });
  }
});

app.get("/:id", (req, res) => {
  const customListName = _.capitalize(req.params.id);

  find(customListName).then((found) => {
    if (!found) {
      const list = new List({
        name: customListName,
        items: defaultItems,
      });
      list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("index", { listTitle: found.name, newListItems: found.items });
    }
  });
});
app.get("*", (req, res) => {
  res.render("error");
});

app.listen(port, () => {
  console.log(`i am listening at port ${port}`);
});
