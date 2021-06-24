const multer = require("multer");
const path = require("path");

// const uploadFolder = path.join(process.cwd(), "public", "uploads");

// console.log({ cwd: process.cwd() }); // { cwd: '/Users/.../file-upload' }
// cwd is a method of the global object process, returns a string value which is the current working directory of the Node.js process.

// console.log({ dirname: __dirname }); // { dirname: '/Users/.../file-upload/utils' }
// The directory name of the current script as a string value. __dirname is not actually a global but rather local to each module.

const uploadFolder = path.resolve("public", "uploads");

// Difference between path.join and path.resolve
// https://elfi-y.medium.com/all-about-path-in-node-c7ea1cc64f93

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}` // will give something like: profile_pic-1624546714574.png
      // or something simpler like: `${Date.now()}-${file.originalname}` // will give something like: 1624546714574-myOriginalImage_name.jpg
    );
  },
});

// Option 1: check only the file extension (works, but not bulletproof)
// const fileFilter = (req, file, cb) => {
//   // Accept image file types only
//   if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
//     req.fileValidationError = "Only image files are allowed!";
//     return cb(new Error("Only image files are allowed!"), false);
//   }
//   cb(null, true);
// };

// Option 2: check the mimetype and the file extension (better)
const isPicture = ({ originalname, mimetype }) => {
  const allowedMimeTypes = [
    "image/png",
    "image/jpg",
    "image/jpeg",
    "image/gif",
  ];
  return (
    originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/) &&
    allowedMimeTypes.includes(mimetype)
  );
};

const fileFilter = (req, file, cb) => {
  if (!isPicture(file)) {
    req.fileValidationError = "Only image files are allowed!";
    return cb(new Error("Only image files are allowed!"), false);
  }
  cb(null, true);
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
