require("dotenv").config();

const jwt = require("jsonwebtoken");

function workerMiddleware(req, res, next) {
    const authHeader = req.headers["authorization"];
    if (authHeader) {
        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET_WORKER);
        if (decoded) {
            req.userId = decoded.userId;
            req.restaurantId = decoded.restaurantId;
            next();
        } else {
            res.status(401).json({
                message: "You are not authorized",
            });
        }
    } else {
        res.json({
            message: "couldn't get auth try again",
        });
    }
}

module.exports = {
    workerMiddleware: workerMiddleware,
};
