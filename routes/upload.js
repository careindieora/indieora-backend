// routes/upload.js
import express from 'express';
import multer from 'multer';
import streamifier from 'streamifier';
import cloudinary from '../config/cloudinary.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();
const upload = multer(); // memory storage

function streamUpload(reqFile) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: 'indieora' }, (error, result) => {
      if (result) resolve(result);
      else reject(error);
    });
    streamifier.createReadStream(reqFile.buffer).pipe(stream);
  });
}

// Accept multiple files with field name "images"
router.post('/', verifyToken, upload.array('images'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'No files' });
    const uploaded = [];
    for (const f of req.files) {
      const r = await streamUpload(f);
      uploaded.push({ url: r.secure_url, raw: r });
    }
    res.json({ uploaded });
  } catch (err) {
    console.error('upload', err);
    res.status(500).json({ message: 'Upload error' });
  }
});

export default router;
