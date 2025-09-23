const express = require('express');
const router = express.Router();
const Image = require('../models/Image'); // Adjust the path if needed

// GET /random-images - Fetch 5 random images
router.get('/random-images', async (req, res) => {
  try {
    const images = await Image.aggregate([{ $sample: { size: 5 } }]);
    res.json(images);
  } catch (error) {
    console.error('Error fetching random images:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
