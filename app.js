const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.set('view engine', 'ejs');
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/todoListDB", {useNewUrlParser: true});

const itemSchema = {
	name: String
};

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
	name: "Welcome to your ToDo List!"
});

const item2 = new Item({
	name: "Click on + to add a new Item."
});

const item3 = new Item({
	name: "<-- Click here to mark an item!"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
	name: String,
	items: [itemSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", (req, res) => {
	Item.find({ }).then((items) => {
		if(items.length === 0) {
			Item.insertMany(defaultItems).then(() => {
				"Inserted Default Items!";
			}).catch((err) => {
				console.log(err);
			});
			res.redirect("/");
		}
		res.render("list", {listTitle: "Today", newListItems: items});
	}).catch((err) => {
		console.log(err);
	});
})

app.get("/about", (req, res) => {
	res.render("about");
})

app.get("/:customListName", (req, res) => {
	const customListName = _.capitalize(req.params.customListName);

	List.findOne({name: customListName}).then((foundList) => {
		if(!foundList) {
			const list = new List({
				name: customListName,
				items: defaultItems
			});
			list.save();
			res.redirect("/"+customListName);
		}else {
			res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
		}
	});
})

app.post("/", (req, res) => {
	let itemName = req.body.newItem;
	let listName = req.body.list;

	const item = new Item({
		name: itemName
	});

	if(listName == "Today"){
		if(itemName !== "")
			item.save();
		res.redirect("/");
	}else {
		List.findOne({name: listName}).then((foundList) => {
			foundList.items.push(item);
			foundList.save();
			res.redirect("/"+listName);
		})
	}
	
})

app.post("/delete", (req, res) => {
	const deleteId = req.body.deleteId;
	const listName = req.body.listName;

	if(listName == "Today") {
		Item.deleteOne({_id: deleteId}).catch((err) => {
			console.log(err);
		});
		res.redirect("/");
	}else {
		List.findOneAndUpdate({name: listName}).then((item) => {
			item.items.pull({_id: deleteId});
			item.save();
			res.redirect("/" + listName);
		}).catch((err) => {
			if(err) {
				console.log(err);
			}
		})
	}
})

app.listen(3000, () => {
	console.log("Listening on port 3000!");
})