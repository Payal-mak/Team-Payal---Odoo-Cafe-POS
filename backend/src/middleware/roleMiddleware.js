/**
 * Middleware to check if user has required role(s)
 * Must be used after authenticateToken middleware
 */
export const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                status: 'error',
                message: 'Authentication required.'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'error',
                message: 'Access forbidden. Insufficient permissions.',
                requiredRoles: allowedRoles,
                userRole: req.user.role
            });
        }

        next();
    };
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = requireRole('admin');

/**
 * Middleware to check if user is POS user or admin
 */
export const requirePOSUser = requireRole('pos_user', 'admin');

/**
 * Middleware to check if user is kitchen user or admin
 */
export const requireKitchenUser = requireRole('kitchen_user', 'admin');
