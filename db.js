const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const ObjectId = mongoose.Types.ObjectId;

const SuperAdmin = new Schema({
    email: { type: String, unique: true },
    password: String,
    firstName: String,
    lastName: String,
    refreshToken: String,
});

const Restaurant = new Schema({
    title: String,
    logoUrl: String,
    open: Boolean,
});

const OwnerAdmin = new Schema({
    email: { type: String, unique: true },
    password: String,
    firstName: String,
    lastName: String,
    refreshToken: String,
});

const RestaurantOwnedBy = new Schema({
    // this allows 1 restaurants to have many owners and 1 owner to own many restaurants
    restaurantId: { type: ObjectId, ref: "restaurant" },
    ownerAdminId: { type: ObjectId, ref: "ownerAdmin" },
});

const Worker = new Schema({
    email: { type: String, unique: true },
    password: String,
    firstName: String,
    lastName: String,
    restaurantId: { type: ObjectId, ref: "restaurant" },
    refreshToken: String,
});

const Dish = new Schema({
    title: String,
    price: Number,
    description: String,
    available: Boolean,
    restaurantId: { type: ObjectId, ref: "restaurant" },
});

Dish.index({ title: 1, restaurantId: 1 }, { unique: true });

const User = new Schema({
    email: { type: String, unique: true },
    password: String,
    firstName: String,
    lastName: String,
    refreshToken: String,
});

const CartItem = new Schema({
    dish: { type: ObjectId, ref: "dish" },
    quantity: Number,
    userId: { type: ObjectId, ref: "user" },
});

const Order = new Schema({
    userId: { type: ObjectId, ref: "user" },
    restaurantId: { type: ObjectId, ref: "restaurant" },
    orderedTime: Date,
    ready: Boolean,
});

const OrderedItem = new Schema({
    dish: { type: ObjectId, ref: "dish" },
    quantity: Number,
    orderId: { type: ObjectId, ref: "order" },
});

const superAdmin = mongoose.model("superAdmin", SuperAdmin);
const restaurant = mongoose.model("restaurant", Restaurant);
const ownerAdmin = mongoose.model("ownerAdmin", OwnerAdmin);
const restaurantOwnedBy = mongoose.model("restaurantOwnedBy", RestaurantOwnedBy);
const worker = mongoose.model("worker", Worker);
const dish = mongoose.model("dish", Dish);
const user = mongoose.model("user", User);
const cartItem = mongoose.model("cartItem", CartItem);
const order = mongoose.model("order", Order);
const orderedItem = mongoose.model("OrderedItem", OrderedItem);

module.exports = {
    superAdmin: superAdmin,
    restaurant: restaurant,
    ownerAdmin: ownerAdmin,
    restaurantOwnedBy: restaurantOwnedBy,
    worker: worker,
    dish: dish,
    user: user,
    cartItem: cartItem,
    order: order,
    orderedItem: orderedItem,
};
