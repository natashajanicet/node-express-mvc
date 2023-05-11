const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

let _db;

const mongoConnect = (callback) => {
    new MongoClient('mongodb://0.0.0.0:27017/shop?retryWrites=true&w=majority')
        .connect()
        .then(client => {
            console.log('connected')
            _db = client.db();
            callback(client)
        })
        .catch(err => {
            console.log(err);
            throw err;
        });
}

const getDb = () => {
    if (_db) {
       return _db; 
    }

    throw 'No database found!';
}

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;
