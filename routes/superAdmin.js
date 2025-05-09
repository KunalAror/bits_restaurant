const { Router } = require("express");
const superAdminRouter = Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { superAdmin, restaurant, ownerAdmin, restaurantOwnedBy } = require("../db");
const mongoose = require("mongoose");
const { superAdminMiddleware } = require("../middleware/superAdmin");
mongoose.connect(process.env.MONGO_CONNECTION);

superAdminRouter.post("/signin", async (req, res) => {
    let { email, password } = req.body;

    let user = await superAdmin.findOne({ email: email });

    const hashedPassword = user.password;
    let userFound = await bcrypt.compare(password, hashedPassword);

    if (userFound) {
        const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_SUPER_ADMIN, { expiresIn: "10m" });
        const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_SUPER_ADMIN, { expiresIn: "7d" });
        try {
            user = await superAdmin.findOneAndUpdate({ email: email }, { $set: { refreshToken: refreshToken } }, { new: true });
            res.status(200).json({
                message: "login succesful",
                accessToken: accessToken,
                refreshToken: refreshToken,
                superAdminDetails: user,
            });
        } catch (e) {
            res.json({
                message: "failed login",
                error: e,
            });
        }
    }
});

superAdminRouter.post("/addRestaurant", superAdminMiddleware, async (req, res) => {
    const { title, logoUrl, email, password, firstName, lastName } = req.body;
    // need to change for 1 owner multiple restaurants and
    try {
        const restaurantMade = await restaurant.create({
            title: title,
            logoUrl: logoUrl,
            open: false,
        });
        const hashedPassword = await bcrypt.hash(password, 5);
        const owner = await ownerAdmin.create({
            email: email,
            password: hashedPassword,
            firstName: firstName,
            lastName: lastName,
            refreshToken: "not Set Until Login",
        });
        const ownedBy = await restaurantOwnedBy.create({
            restaurantId: restaurantMade._id,
            ownerAdminId: owner._id,
        });
        res.json({
            message: "made owner and res",
        });
    } catch (e) {
        res.json({
            message: "try again",
            error: e,
        });
    }
});
// need to add route of add owner to 1 rest so that there can be multiple owners
module.exports = {
    superAdminRouter: superAdminRouter,
};
