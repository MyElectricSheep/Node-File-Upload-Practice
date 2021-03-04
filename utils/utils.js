const multer = require('multer');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, './public/uploads');
  },
  filename(req, file, cb) {
    cb(null, file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  if (!/image/.test(file.mimetype)) {
    req.fileValidationError = "You're not trying to send an image!";
    return cb(null, false);
  }

  cb(null, true);
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
