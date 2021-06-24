const express = require("express");
const app = express();
const path = require("path");
const multer = require("multer");

const port = process.env.PORT || 3000;

const upload = multer({ dest: "./public/uploads" });
// https://www.npmjs.com/package/multer#multeropts

app.use(express.static(path.join(__dirname, "public")));
// https://expressjs.com/en/starter/static-files.html

app.post("/upload-profile-pic", upload.single("profile_pic"), (req, res) => {
  // console.log(req.file)
  // res.send('testing')
  const template = `<img src="/uploads/${req.file.filename}" alt="some pic" width="500" />`;
  // https://stackoverflow.com/questions/5110384/can-i-use-images-without-extension-in-img
  res.send(template);
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
