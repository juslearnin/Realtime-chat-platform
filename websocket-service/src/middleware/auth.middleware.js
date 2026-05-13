const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {
        // 1. Get token from header (Format: "Bearer <token>")
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Access denied. No token provided." });
        }

        const token = authHeader.split(" ")[1];

        // 2. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. Add user info to the request object
        req.user = decoded;

        // 4. Move to the next function (the route handler)
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

module.exports = authMiddleware;