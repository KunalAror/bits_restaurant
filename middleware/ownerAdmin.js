require("dotenv").config();

const jwt = require("jsonwebtoken");

function ownerAdminMiddleware(req, res, next) {
    const authHeader = req.headers["authorization"];
    if (authHeader) {
        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET_OWNER_ADMIN);
        if (decoded) {
            req.userId = decoded.userId;
            next();
        } else {
            res.json({
                message: "incorrect credentials",
            });
        }
    } else {
        res.json({
            message: "couldn't get auth try again",
        });
    }
}

module.exports = {
    ownerAdminMiddleware: ownerAdminMiddleware,
};
