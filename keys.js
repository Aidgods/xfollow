const fs = require('fs');

function saveDb() {
    fs.writeFileSync('db.json', JSON.stringify(db, null, 4));
}

let db = {};

try {
    db = JSON.parse(fs.readFileSync('db.json'));
} catch (err) {
    console.error('Failed to load DB:', err);
}

function generateKey(userId, duration) {
    const key = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now();
    const durationMilliseconds = duration === '1year' ? 31536000000 : duration === '6months' ? 15552000000 : duration === '3months' ? 7776000000 : 2592000000;
    const expirationTime = timestamp + durationMilliseconds;
    db[key] = { userId, duration, timestamp, expirationTime };
    saveDb();
    return key;
}

function checkExpiration() {
    const now = Date.now();
    for (const key in db) {
        const { duration, timestamp } = db[key];
        const elapsedTime = now - timestamp;
        const durationMilliseconds = duration === '1year' ? 31536000000 : duration === '6months' ? 15552000000 : duration === '3months' ? 7776000000 : 2592000000;
        if (elapsedTime > durationMilliseconds) {
            delete db[key];
            saveDb();
        }
    }
}
setInterval(checkExpiration, 60000);
module.exports = {
    generateKey,
    db,
    saveDb
};