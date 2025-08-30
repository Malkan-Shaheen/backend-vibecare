const mongoose = require('mongoose');

const UserPreferencesSchema = mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Userinfo', required: true },
    gender: { type: Number, required: true }, // 1 for male, 2 for female
    ageGroup: { type: Number, required: true }, // 1 for 18-25, 2 for 25-40, 3 for 40+
    livingSituation: { type: Number, required: true }, // 1 for alone, 2 for with family, 3 for with friends
    relationshipStatus: { type: Number, required: true }, // 1 for single, 2 for married, 3 for divorced
}, {
    collection: "UserPreferences"
});

mongoose.model('UserPreferences', UserPreferencesSchema);
