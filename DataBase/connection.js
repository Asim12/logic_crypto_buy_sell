
var MongoClient = require('mongodb').MongoClient;
function connectionDatabase() {
    return new Promise((resolve, reject) => {
        var url = 'mongodb+srv://umee:vGuETO19Znynoqt4@cluster0.kg68l.mongodb.net/logic_crypto?retryWrites=true&w=majority';
        MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, async(err, client) => {
            if (err) {
                db.close();
                reject(err);
            } else {
                console.log('Mongo is conected!!');
                const db = client.db('logic_crypto');
                resolve(db);
            }
        });
    });
}
module.exports = connectionDatabase();