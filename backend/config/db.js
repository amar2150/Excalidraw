const mongoose = require('mongoose');

module.exports = async function(){
    if (!process.env.DB_URL) {
        throw new Error("DB_URL is missing. Check backend/.env");
    }

    return await mongoose.connect(process.env.DB_URL);
}
