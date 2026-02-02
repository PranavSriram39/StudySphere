const mongoose = require("mongoose");

const connectDatabase = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser : true,
            useUnifiedTopology : true
        });
        console.log("Connection established "+conn.connection.host);
    } catch (error) {
        console.log("Connection error: "+error);
        process.exit();
    }
}

module.exports = connectDatabase;