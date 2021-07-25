const multer = require("multer");
const path = require("path");
const aws = require("aws-sdk");
const multerS3 = require("multer-s3");

const { S3_BUCKET_NAME } = process.env;

aws.config.region = "eu-west-1";
const s3 = new aws.S3();

const s3Storage = multerS3({
  s3: s3,
  bucket: S3_BUCKET_NAME,
  acl: "public-read",
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (req, file, cb) => {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

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
    return cb(new Error("Only image files are allowed!"), false);
  }
  cb(null, true);
};

const uploadS3 = multer({ storage: s3Storage, fileFilter });

module.exports = { uploadS3 };
