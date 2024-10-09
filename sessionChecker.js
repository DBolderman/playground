const sessionChecker = (req, res, next) => {
  if (req.session.cookie.expires && new Date() > new Date(req.session.cookie.expires)) {
    // Session is expired
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
      res.redirect('/login');
    });
  } else {
    // Session is valid
    next();
  }
};

export default sessionChecker;
