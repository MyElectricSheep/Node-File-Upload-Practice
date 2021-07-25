const express = require("express");
const db = require("./database/client");
const { uploadS3 } = require("./utils/imageUploader");

const app = express();
const port = process.env.PORT || 3000;

const multerValidation = (req, res, next) => {
  const { file, files } = req;
  const data = file || files;

  if (!data)
    return res.status(400).send("Error. At least one file is required.");

  req.data = data;

  next();
};

const uploadToDatabase = async (req, res, next) => {
  const uploadPic = async (file) => {
    const {
      rows: [insertedPic],
    } = await db.query(
      `INSERT INTO images (name, path) VALUES ($1, $2) RETURNING *`,
      [file.key, file.location]
    );
    return insertedPic;
  };

  const { data } = req;

  if (Array.isArray(data)) {
    const insertedPics = data.map((file) => uploadPic(file));
    req.insertedPics = await Promise.all(insertedPics);
    next();
  } else {
    const insertedPic = await uploadPic(data);
    req.insertedPic = insertedPic;
    next();
  }
};

app.post(
  "/upload-single",
  uploadS3.single("single_pic"),
  multerValidation,
  uploadToDatabase,
  (req, res) => {
    const { path } = req.insertedPic;

    res.json({
      message: "File uploaded successfully",
      code: 200,
      location: path,
    });
  }
);

app.post(
  "/upload-multiple",
  uploadS3.array("multiple_pics"),
  multerValidation,
  uploadToDatabase,
  (req, res) => {
    const { insertedPics } = req;

    res.json({
      message: "Files uploaded successfully",
      code: 200,
      location: insertedPics,
    });
  }
);

app.get("/get-pics/:id?", async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) {
      const { rows: allPics } = await db.query(
        "SELECT * FROM images ORDER BY pic_id DESC"
      );
      if (!allPics.length)
        return res.json({
          message: "No pictures have been uploaded so far",
          code: 400,
        });

      return res.json({
        message: "All uploaded pictures",
        code: 200,
        pictures: allPics,
      });
    } else {
      const {
        rows: [onePic],
      } = await db.query("SELECT * FROM images WHERE pic_id=$1", [id]);
      if (!onePic)
        return res.json({
          message: "No picture with this id",
          code: 400,
        });

      return res.json({
        message: "Uploaded picture",
        code: 200,
        picture: onePic,
      });
    }
  } catch (e) {
    console.log(e.message);
    res.status(500).send("Could not get the requested pictures :", e.message);
  }
});

app.get("/reset", async (req, res) => {
  try {
    await db.query(`DROP TABLE IF EXISTS images`);
    await db.query(`
    CREATE TABLE images (
      pic_id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      path VARCHAR(255) NOT NULL
   ); 
    `);
    console.log("DB + Uploads folder reset successfully");
    res.redirect("/");
  } catch (e) {
    res.status(500).send("Internal Server Error. Reset failed: ", e.message);
  }
});

app.get("/", (req, res) => {
  res.send("S3 File Uploader");
});

app.listen(port, () => console.log(`Listening on port ${port}...`));
