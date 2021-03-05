const express = require('express');
const { findAll, insertOne } = require('../db/queries');
const upload = require('../utils/utils');

const router = express.Router();

const PORT = process.env.PORT || 3000;

router.get('/', (_, res) => {
  res.sendFile(process.cwd() + '/index.html');
});

router.get('/get-pics', (req, res) => {
  findAll('name, path', 'pictures', (err, data) => {
    if (err) {
      res.status(400).send('There was a problem fetching data form db.');
    } else {
      res.send(
        'This are all the images you uploaded: <br /> <br /> <br />' +
          data.rows.map(
            row =>
              `<img src="${row.path.replace(/public/, '')}" width="400" />` +
              '<br /> <hr />'
          )
      );
    }
  });
});

router.post('/upload-profile-pic', upload.single('profile_pic'), (req, res) => {
  if (req.fileValidationError) return res.send(req.fileValidationError);

  if (!req.file) return res.send("You didn't send any file.");

  insertOne(
    'pictures',
    'name, path',
    { id: '$1, $2', data: [req.file.fieldname, req.file.path] },
    (err, data) => {
      if (err) {
        res.status(400).send('Sorry there was an error uploading to db');
      } else {
        res.send(`You have uploaded: <br /> <br /> <br />
          <img src="/uploads/${req.file.filename}" width="500" /> <br /> <br />
          <a href="http://localhost:${PORT}/get-pics">Click here to see the list of all the uploaded files</a>`);
      }
    }
  );
});

router.post('/upload-cat-pics', upload.array('cat_pics'), async (req, res) => {
  if (req.fileValidationError) return res.send(req.fileValidationError);

  if (!req.files || !req.files.length)
    return res.send("You didn't send any file");

  await req.files.forEach(file => {
    insertOne('pictures', 'name, path', {
      id: '$1, $2',
      data: [file.fieldname, file.path]
    });
  });

  res.send(
    'You have uploaded: <br /> <br /> <br />' +
      req.files.map(
        file =>
          `<img src="/uploads/${file.filename}" width="400" /> <br /> <hr />`
      ) +
      `<br /> <br /> <a href="http://localhost:${PORT}/get-pics">Click here to see the list of all the uploaded files</a>`
  );
});

module.exports = router;
