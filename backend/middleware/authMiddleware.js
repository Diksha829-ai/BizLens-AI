const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    // ============================================================
    // GET AUTHORIZATION HEADER
    // ============================================================

    const authHeader = req.headers.authorization;

    // Check whether Authorization header exists
    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required",
      });
    }

    // ============================================================
    // EXTRACT TOKEN
    // ============================================================

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is required",
      });
    }

    // ============================================================
    // VERIFY JWT
    // ============================================================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // ============================================================
    // DEBUG
    // ============================================================

    console.log("JWT DECODED:", decoded);

    // ============================================================
    // SET AUTHENTICATED USER
    // ============================================================

    req.user = {
      ...decoded,

      // Support different JWT payload formats
      id:
        decoded.id ||
        decoded._id ||
        decoded.userId,
    };

    // ============================================================
    // CHECK USER ID
    // ============================================================

    if (!req.user.id) {
      console.error(
        "JWT does not contain a valid user ID:",
        decoded
      );

      return res.status(401).json({
        success: false,
        message: "Invalid token: user ID is missing",
      });
    }

    console.log(
      "Authenticated User ID:",
      req.user.id
    );

    // ============================================================
    // CONTINUE
    // ============================================================

    next();

  } catch (error) {
    console.error(
      "Authentication error:",
      error.message
    );

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;