// routes/upload.js
import express from 'express';
import multer from 'multer';
import streamifier from 'streamifier';
import cloudinary from '../config/cloudinary.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();
const upload = multer(); // memory

router.post('/', verifyToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file' });
    const bufferStream = streamifier.createReadStream(req.file.buffer);
    const streamUpload = (stream) => new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream({ folder: 'indieora' }, (error, result) => {
        if (result) resolve(result);
        else reject(error);
      });
      stream.pipe(uploadStream);
    });
    const result = await streamUpload(bufferStream);
    res.json({ url: result.secure_url, raw: result });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Upload failed' }); }
});

export default router;
