const express = require('express');
const upload = require('./utils/imageUploader')
const path = require('path')

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(__dirname + '/public'));

app.post('/upload-profile-pic', upload.single('profile_pic'), (req, res) => {
    const {file, fileValidationError} = req
    if (!file) {
      return res.status(400).send('Please upload a file');
    }
    if (fileValidationError) {
      return res.status(400).send(fileValidationError);
    }
    console.log(file)
    res.send(`<div>You have uploaded this image: <br/> <img src="http://localhost:${port}/uploads/${req.file.filename}" width="500" /></div>`);
  })

app.post('/upload-cat-pics', upload.array('cat_pics'), (req, res) => {
  const { files, fileValidationError } = req
  if (!files || !files.length) {
    return res.status(400).send('Please upload some files');
  }
  if (fileValidationError) {
    return res.status(400).send(fileValidationError);
  }
  console.log(files)
  res.send(`<div>You have uploaded these images: <br/> ${files.map(file => `<img src="http://localhost:${port}/uploads/${file.filename}" width="500" />`)}</div>`);
})

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'))
})



app.listen(port, () => console.log(`Listening on port ${port}...`));