
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
    // CHECK JWT SECRET
    // ============================================================

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");

      return res.status(500).json({
        success: false,
        message: "Server authentication is not configured",
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
    // SET AUTHENTICATED USER
    // Supports different JWT payload formats
    // ============================================================

    const userId =
      decoded.userId ||
      decoded.id ||
      decoded._id;

    // ============================================================
    // CHECK USER ID
    // ============================================================

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token: user ID is missing",
      });
    }

    // ============================================================
    // ATTACH AUTHENTICATED USER TO REQUEST
    // Supports both req.user.id and req.user.userId
    // ============================================================

    req.user = {
      ...decoded,
      id: userId,
      userId: userId,
    };

    // ============================================================
    // CONTINUE TO PROTECTED ROUTE
    // ============================================================

    return next();

  } catch (error) {
    // ============================================================
    // HANDLE AUTHENTICATION ERRORS
    // ============================================================

    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    console.error(
      "Authentication error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Authentication failed due to a server error",
    });
  }
};

module.exports = authMiddleware;
                                            