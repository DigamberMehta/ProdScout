import express from "express";
import passport from "passport";
import User from "../models/user.js"; // Import User model
// import wrapAsync from "../utils/wrapAsync"; // Un-comment if needed

const router = express.Router();

// Signup Route
router.get("/signup", (req, res) => {
  res.render("users/signup.ejs");
});

router.post("/signup", async (req, res) => {
  try {
    let { email, username, password } = req.body;
    let newUser = new User({ email, username });
    const registeredUser = await User.register(newUser, password);
    console.log(registeredUser);
    req.login(registeredUser, (err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  } catch (e) {
    res.redirect("/signup");
  }
});

// Login Route
router.get("/login", (req, res) => {
  res.render("users/login.ejs");
});

router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: false,
  }),
  (req, res) => {
    res.redirect("/");
  }
);

// Logout Route
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/");
  });
});

// Export the router as default
export default router;
