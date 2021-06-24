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

const uploadToDatabase = async (req, res, next) => {
  const uploadPic = async (file) => {
    const {
      rows: [insertedPic],
    } = await db.query(
      `INSERT INTO images (name, path) VALUES ($1, $2) RETURNING *`,
      [file.filename, "/uploads"]
    );
    return insertedPic;
  };

  const { url, file, files } = req;

  if (url === "/upload-profile-pic") {
    const insertedPic = await uploadPic(file);
    req.insertedPic = insertedPic;
    next();
  }
  if (url === "/upload-cat-pics") {
    const insertedPics = files.map((file) => uploadPic(file));
    req.insertedPics = await Promise.all(insertedPics);
    next();
  }
};

app.post(
  "/upload-profile-pic",
  upload.single("profile_pic"),
  multerValidation,
  uploadToDatabase,
  (req, res) => {
    const { path, name } = req.insertedPic;

    res.send(
      `<div>You have uploaded this image: <br/> <img src="${path}/${name}" width="500" /></div>`
    );
  }
);

app.post(
  "/upload-cat-pics",
  upload.array("cat_pics"),
  multerValidation,
  uploadToDatabase,
  (req, res) => {
    const { insertedPics } = req;
    let html = "";

    insertedPics.forEach(
      ({ path, name }) => (html += `<img src="${path}/${name}" width="500" />`)
    );

    res.send(`<div>You have uploaded these images: <br/> ${html} </div>`);
  }
);

app.get("/get-pics/:id?", async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) {
      let html = "";
      const { rows: allPics } = await db.query("SELECT * FROM images");
      allPics.forEach((pic) => {
        html += `<li><a href="http://localhost:${port}/get-pics/${pic.pic_id}">${pic.name}</a></li>`;
      });
      if (!html)
        return res.send("<h2>There is no uploaded pictures so far</h2>");
      res.send(
        `<div><h2>Here are all the uploaded pictures so far:</h2> <br/> <ul>${html}</ul> </div>`
      );
    } else {
      const {
        rows: [onePic],
      } = await db.query("SELECT * FROM images WHERE pic_id=$1", [id]);
      console.log(onePic);
      res.send(
        `<div>Here is the picture you requested: <br/> <img src="http://localhost:${port}${onePic.path}/${onePic.name}" alt="" width="500"/></div>`
      );
    }
  } catch (e) {
    console.log(e.message);
    res.status(500).send("Could not get the requested pictures :", e.message);
  }
});

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
    console.log("DB + Uploads folder reset successfully");
    res.redirect("/");
  } catch (e) {
    res.status(500).send("Internal Server Error. Reset failed: ", e.message);
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => console.log(`Listening on port ${port}...`));
