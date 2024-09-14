// Middleware to check if the user is authenticated
export default function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next(); // User is authenticated, proceed to the next middleware/route handler
    }
    // If the user is not authenticated, redirect them to the login page
    res.redirect('/login');
}
