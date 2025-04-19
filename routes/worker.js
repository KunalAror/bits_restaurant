require("dotenv").config();
const { Router } = require("express");
const { worker, restaurant } = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { workerMiddleware } = require("../middleware/woker");

const workerRouter = Router();

workerRouter.post("/signin", async (req, res) => {
    let { email, password } = req.body;

    const user = await worker.findOne({ email: email });

    const hashedPassword = user.password;
    let userFound = await bcrypt.compare(password, hashedPassword);

    if (userFound) {
        const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_WORKER, { expiresIn: "10m" });
        const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_WORKER, { expiresIn: "7d" });
        try {
            const workerLoggedIn = await worker.findOneAndUpdate({ email: email }, { $set: { refreshToken: refreshToken } }).populate("restaurantId");
            res.status(200).json({
                message: "login succesful",
                accessToken: accessToken,
                refreshToken: refreshToken,
                workerDetails: user,
                restaurant: workerLoggedIn.restaurantId,
            });
        } catch (e) {
            res.json({
                message: "failed login",
                error: e,
            });
        }
    }
});

workerRouter.put("/toggleRestaurantStatus", workerMiddleware, async (req, res) => {
    const userId = req.userId;

    const { restaurantId } = req.body;

    const userExist = authenticateWorker(userId, restaurantId);

    if (userExist) {
        try {
            const restaurantUpdated = await restaurant.findOneAndUpdate({ _id: restaurantId }, [{ $set: { open: { $not: "$open" } } }], { new: true });

            res.json({
                message: "updated status",
                restaurantStatus: restaurantUpdated.open,
            });
        } catch (e) {
            res.json({
                message: "try again",
                error: e,
            });
        }
    } else {
        res.status(401).json({
            message: "Unauthorized",
        });
    }
});

async function authenticateWorker(workerId, restaurantId) {
    const userExist = await worker.exists({ _id: workerId, restaurantId: restaurantId });
    return userExist;
}
module.exports = {
    workerRouter: workerRouter,
};
