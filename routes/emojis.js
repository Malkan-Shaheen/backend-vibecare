const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Emoji = mongoose.model('Emoji', new mongoose.Schema({}, { strict: false }), 'emojis');

// GET all emoji categories and subcategories
router.get('/api/emojis', async (req, res) => {
  try {
    const data = await Emoji.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch emoji data' });
  }
});

module.exports = router;
