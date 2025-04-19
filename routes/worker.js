require("dotenv").config();
const { Router } = require("express");
const { worker } = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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
            const workerLoggedIn = await worker.updateOne({ email: email }, { $set: { refreshToken: refreshToken } });
            res.status(200).json({
                message: "login succesful",
                accessToken: accessToken,
                refreshToken: refreshToken,
                workerDetails: user,
            });
        } catch (e) {
            res.json({
                message: "failed login",
                error: e,
            });
        }
    }
});

// workerRouter.put("/openRestaurant");

module.exports = {
    workerRouter: workerRouter,
};
