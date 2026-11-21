const verifyRole = (role) => (req, res, next) => {
    if (!req.user || req.user.role !== role) {
        return res.status(403).json({ message: 'Access forbidden: insufficient privileges.' });
    }
    next();
};
module.exports = verifyRole;
