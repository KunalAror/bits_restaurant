require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const { superAdminRouter } = require("./routes/superAdmin");
const { ownerAdminRouter } = require("./routes/ownerAdmin");

const app = express();
app.use(express.json());

app.use("/api/v0/superAdmin", superAdminRouter);
app.use("/api/v0/ownerAdmin", ownerAdminRouter);

async function main() {
    await mongoose.connect(process.env.MONGO_CONNECTION);
    app.listen(3000);
    console.log("connection made");
}

main();
