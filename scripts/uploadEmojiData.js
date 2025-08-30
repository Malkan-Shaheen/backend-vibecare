const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Generic schema for emoji since it's nested and varied
const emojiSchema = new mongoose.Schema({}, { strict: false });
const Emoji = mongoose.model('Emoji', emojiSchema, 'emojis');

// Connect to MongoDB
mongoose.connect('mongodb+srv://VibeCare:VibeCare67@cluster0.1rleb9o.mongodb.net/new_db?retryWrites=true&w=majority') // Change to your DB
  .then(async () => {
    console.log('✅ Connected to MongoDB');

    const filePath = path.join(__dirname, 'emojiData.json'); // Ensure file is in same folder
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(rawData);

    // Optional: Clear existing
    await Emoji.deleteMany({});

    // Insert emoji categories
    await Emoji.insertMany(parsed.categories);
    console.log('✅ Emoji data inserted!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error inserting emoji data:', err);
    process.exit(1);
  });
