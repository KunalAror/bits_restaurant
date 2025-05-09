require("dotenv").config();
const { Router } = require("express");
const { ownerAdmin, restaurantOwnedBy, worker, dish } = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { ownerAdminMiddleware } = require("../middleware/ownerAdmin");

const ownerAdminRouter = Router();

ownerAdminRouter.post("/signin", async (req, res) => {
    let { email, password } = req.body;

    let user = await ownerAdmin.findOne({ email: email });

    const hashedPassword = user.password;
    let userFound = await bcrypt.compare(password, hashedPassword);

    if (userFound) {
        const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_OWNER_ADMIN, { expiresIn: "10m" });
        const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_OWNER_ADMIN, { expiresIn: "7d" });
        try {
            user = await ownerAdmin.findOneAndUpdate({ email: email }, { $set: { refreshToken: refreshToken } }, { new: true });
            res.status(200).json({
                message: "login succesful",
                accessToken: accessToken,
                refreshToken: refreshToken,
                ownerAdminDetails: user,
            });
        } catch (e) {
            res.json({
                message: "failed login",
                error: e,
            });
        }
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
    const ownerId = req.userId;

    const { restaurantId, email, password, firstName, lastName } = req.body;
    const userExist = authenticateAdmin(ownerId, restaurantId);
    if (userExist) {
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
                message: "created worker",
                workerInfo: workerMade,
            });
        } catch (e) {
            res.json({
                message: "failed, try again",
                error: e,
            });
        }
    } else {
        res.status(401).json({
            message: "You are not authorized",
        });
    }
});

ownerAdminRouter.post("/addDish", ownerAdminMiddleware, async (req, res) => {
    const userId = req.userId;

    const { restaurantId, title, price, description } = req.body;
    const userExist = authenticateAdmin(userId, restaurantId);
    if (userExist) {
        try {
            const dishMade = await dish.create({
                title: title,
                price: price,
                description: description,
                available: false,
                restaurantId: restaurantId,
            });
            res.json({
                message: "created dish",
                dishInfo: dishMade,
            });
        } catch (e) {
            res.json({
                message: "try again",
                error: e,
            });
        }
    } else {
        res.status(401).json({
            message: "You are not authorized",
        });
    }
});

ownerAdminRouter.get("/workers", ownerAdminMiddleware, async (req, res) => {
    const userId = req.userId;
    const { restaurantId } = req.body;
    const userExist = authenticateAdmin(userId, restaurantId);
    if (userExist) {
        try {
            const workers = await worker.find({ restaurantId: restaurantId });
            res.json({
                message: "here are your workers",
                workers: workers,
            });
        } catch (e) {
            res.json({
                message: "try again",
                error: e,
            });
        }
    } else {
        res.status(401).json({
            message: "You are not authorized",
        });
    }
});

ownerAdminRouter.get("/dishes", ownerAdminMiddleware, async (req, res) => {
    const userId = req.userId;
    const { restaurantId } = req.body;
    const userExist = authenticateAdmin(userId, restaurantId);
    if (userExist) {
        try {
            const dishes = await dish.find({ restaurantId: restaurantId });
            res.json({
                message: "here are your dishes",
                dishes: dishes,
            });
        } catch (e) {
            res.json({
                message: "try again",
                error: e,
            });
        }
    } else {
        res.status(401).json({
            message: "You are not authorized",
        });
    }
});
async function authenticateAdmin(ownerId, restaurantId) {
    const userExist = await restaurantOwnedBy.exists({ ownerAdminId: ownerId, restaurantId: restaurantId });
    return userExist;
}
module.exports = {
    ownerAdminRouter: ownerAdminRouter,
};
