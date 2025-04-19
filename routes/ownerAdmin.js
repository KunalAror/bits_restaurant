require("dotenv").config();
const { Router } = require("express");
const { ownerAdmin, restaurantOwnedBy, worker } = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { ownerAdminMiddleware } = require("../middleware/ownerAdmin");

const ownerAdminRouter = Router();

ownerAdminRouter.post("/signin", async (req, res) => {
    let { email, password } = req.body;

    const user = await ownerAdmin.findOne({ email: email });

    const hashedPassword = user.password;
    let userFound = await bcrypt.compare(password, hashedPassword);

    if (userFound) {
        const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_OWNER_ADMIN, { expiresIn: "10m" });
        const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_OWNER_ADMIN, { expiresIn: "7d" });
        try {
            await ownerAdmin.updateOne({ email: email }, { $set: { refreshToken: refreshToken } });
        } catch (e) {
            res.json({
                message: "failed login",
                error: e,
            });
            return;
        }

        res.json({
            message: "login succesful",
            accessToken: accessToken,
            refreshToken: refreshToken,
        });
    }
});

ownerAdminRouter.get("/restaurants", ownerAdminMiddleware, async (req, res) => {
    let userId = req.userId;

    const restaurants = await restaurantOwnedBy.find({ ownerAdminId: userId }).populate("restaurantId");

    const restaurantsInfo = restaurants.map((rest) => rest.restaurantId);

    res.json({
        restaurantOwned: restaurantsInfo,
    });
});

ownerAdminRouter.post("/addWorker", ownerAdminMiddleware, async (req, res) => {
    const userId = req.userId;

    const { restaurantId, email, password, firstName, lastName } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 5);

        const workerMade = await worker.create({
            email: email,
            password: hashedPassword,
            firstName: firstName,
            lastName: lastName,
            restaurantId: restaurantId,
            refreshToken: "will be set once worker logs in",
        });

        res.json({
            message: `created worker ${workerMade.firstName}`,
        });
    } catch (e) {
        res.json({
            message: "failed, try again",
            error: e,
        });
    }
});

module.exports = {
    ownerAdminRouter: ownerAdminRouter,
};
