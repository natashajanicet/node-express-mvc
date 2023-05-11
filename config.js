const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    mongoConnStr: process.env.MONGO_CONN_STR,
    mongoPort: process.env.mongoPort,
    stripeKey: process.env.STRIPE_KEY,
    mongoSessionStore: process.env.MONGO_SESSION_STORE_URI
}