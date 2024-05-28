const multer = require('multer');
const path = require('path');
const util = require('util')
const { S3Client } = require('@aws-sdk/client-s3')

const multerS3 = require('multer-s3');
const { log } = require('console');

const s3 = new S3Client({
  credentials: {
    secretAccessKey:'f6/nS6glE8s9aeW3c0QVzxjcRY1Co/ATdNdAVhXw',
    accessKeyId:'AKIA4MTWKENW4EBCBQNF'
  },
  region:'ap-south-1'
})
// // cloud:
//   aws:
//   credentials:
//     access-key: AKIA4MTWKENW4EBCBQNF
//     secret-key: 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
//   region:
//     static: ap-south-1
//   stack:
//     auto: false

const storage = multerS3({
  s3: s3,
  acl: "public-read",
  bucket: 'androidbucket3577',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req, file, cb) {
    cb(null, Date.now().toString())
  }
})

function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif|webp|pdf/; // Removed mp4 and mov

  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (extname) {
    // Set the MIME type based on the file extension
    let mimetype = '';
    if (extname === '.jpeg' || extname === '.jpg') {
      mimetype = 'image/jpeg';
    } else if (extname === '.png') {
      mimetype = 'image/png';
    } else if (extname === '.gif') {
      mimetype = 'image/gif';
    } else if (extname === '.webp') {
      mimetype = 'image/webp';
    }else if (extname === '.pdf') {
      mimetype = 'application/pdf';
    }
    // Pass the file object with updated MIME type
    cb(null, true, mimetype);
  } else {
    cb('Error: Images only (jpeg, jpg, png, gif, webp)!');
  }
}

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

  
  const uploadMiddleWare = upload

  module.exports = uploadMiddleWare