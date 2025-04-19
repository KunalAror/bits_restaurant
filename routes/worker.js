require("dotenv").config();
const { Router } = require("express");
const { worker, restaurant, dish, order, orderedItem } = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { workerMiddleware } = require("../middleware/woker");

const workerRouter = Router();

workerRouter.post("/signin", async (req, res) => {
    let { email, password } = req.body;

    let user = await worker.findOne({ email: email });

    const hashedPassword = user.password;
    let userFound = await bcrypt.compare(password, hashedPassword);

    if (userFound) {
        const accessToken = jwt.sign(
            {
                userId: user._id,
                restaurantId: user.restaurantId,
            },
            process.env.JWT_SECRET_WORKER,
            { expiresIn: "10m" }
        );

        const refreshToken = jwt.sign(
            {
                userId: user._id,
                restaurantId: user.restaurantId,
            },
            process.env.JWT_SECRET_WORKER,
            { expiresIn: "7d" }
        );

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
    const restaurantId = req.restaurantId;

    try {
        const restaurantUpdated = await restaurant.findOneAndUpdate({ _id: restaurantId }, [{ $set: { open: { $not: "$open" } } }], { new: true });

        res.json({
            message: "updated status",
            restaurantStatus: restaurantUpdated.open,
        });
    } catch (e) {
        res.json({
            message: "Sorry Try again",
            error: e,
        });
    }
});

workerRouter.put("/toggleDishStatus", workerMiddleware, async (req, res) => {
    const userId = req.userId;
    const restaurantId = req.restaurantId;

    const { dishId } = req.body;

    try {
        const dishUpdated = await dish.findOneAndUpdate({ _id: dishId }, [{ $set: { available: { $not: "$available" } } }], {
            new: true,
        });
        if (dishUpdated) {
            res.json({
                message: "updated status",
                dishUpdatedStatus: dishUpdated.available,
            });
        } else {
            res.json({
                message: "dish doesn't exist",
            });
        }
    } catch (e) {
        res.json({
            message: "Sorry Try again",
            error: e,
        });
    }
});

workerRouter.get("/ordersPending", workerMiddleware, async (req, res) => {
    const userId = req.userId;
    const restaurantId = req.restaurantId;

    const ordersPending = await order.find({ restaurantId: restaurantId, ready: false });
    res.json({
        ordersPending: ordersPending,
    });
});

workerRouter.get("/order/:orderId", workerMiddleware, async (req, res) => {
    const userId = req.userId;
    const restaurantId = req.restaurantId;

    const orderId = req.params.orderId;

    const orderInfo = await orderedItem.find({ orderId: orderId });

    res.json({
        orderInfo: orderInfo,
    });
});

workerRouter.put("/orderReady", workerMiddleware, async (req, res) => {
    const userId = req.userId;
    const restaurantId = req.restaurantId;

    const orderId = req.orderId;

    const orderReadied = await order.findOneAndUpdate({ _id: orderId }, { $set: { ready: true } }, { new: true });

    res.json({
        orderReadied: orderReadied,
    });
    // need to add the logic for sockets so that user gets notification
});

module.exports = {
    workerRouter: workerRouter,
};
