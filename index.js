const express = require("express");
const fs = require("fs");
const db = require("./database/client");
const upload = require("./utils/imageUploader");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(__dirname + "/public"));

// app.post('/upload-profile-pic', upload.single('profile_pic'), (req, res) => {
//     const {file, fileValidationError} = req
//     if (!file) {
//       return res.status(400).send('Please upload a file'); // 400 Bad Request
//     }
//     if (fileValidationError) {
//       return res.status(400).send(fileValidationError);
//     }
//     console.log(file)
//     res.send(`<div>You have uploaded this image: <br/> <img src="/uploads/${req.file.filename}" width="500" /></div>`);
//   })

// app.post('/upload-cat-pics', upload.array('cat_pics'), (req, res) => {
//   const { files, fileValidationError } = req
//   if (!files || !files.length) {
//     return res.status(400).send('Please upload some files');
//   }
//   if (fileValidationError) {
//     return res.status(400).send(fileValidationError);
//   }
//   console.log(files)
//   res.send(`<div>You have uploaded these images: <br/> ${files.map(file => `<img src="/uploads/${file.filename}" width="500" />`)}</div>`);
// })

// Alternative with custom middleware
const multerValidation = (req, res, next) => {
  const { url, file, files, fileValidationError } = req;
  if (url === "/upload-profile-pic") {
    if (!file) return res.status(400).send("Please upload a file");
  }
  if (url === "/upload-cat-pics") {
    if (!files) return res.status(400).send("Please upload some files");
  }
  if (fileValidationError) return res.status(400).send(fileValidationError);
  console.log({ data: req.file || req.files });
  next();
};

app.post(
  "/upload-profile-pic",
  upload.single("profile_pic"),
  multerValidation,
  (req, res) => {
    const { file } = req;
    res.send(
      `<div>You have uploaded this image: <br/> <img src="/uploads/${file.filename}" width="500" /></div>`
    );
  }
);

app.post(
  "/upload-cat-pics",
  upload.array("cat_pics"),
  multerValidation,
  (req, res) => {
    const { files } = req;
    let html = "";

    files.forEach(
      (file) => (html += `<img src="/uploads/${file.filename}" width="500" />`)
    );

    res.send(`<div>You have uploaded these images: <br/> ${html} </div>`);
  }
);

app.get("/reset", async (req, res) => {
  const uploadsPath = path.resolve(__dirname, "public", "uploads");
  try {
    const uploadsDir = await fs.promises.readdir(uploadsPath);
    const deletedFiles = uploadsDir.map((file) => {
      return fs.promises.unlink(path.resolve(uploadsPath, file));
    });
    await Promise.all(deletedFiles);
    await db.query(`DROP TABLE IF EXISTS images`);
    await db.query(`
    CREATE TABLE images (
      pic_id SERIAL PRIMARY KEY,
      name varchar(255) NOT NULL,
      path varchar(255) NOT NULL
   ); 
    `);
    res.send("DB + Uploads folder reset successfully");
  } catch (e) {
    res.status(500).send("Internal Server Error. Reset failed: ", e.message);
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => console.log(`Listening on port ${port}...`));
