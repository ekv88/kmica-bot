const admin = require("firebase-admin");
let settings = require('./config.json');

// Auth
const serviceAccount = process.env.FIREBASE_CONFIG || settings.firebase;

// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
    // credential: admin.credential.cert(serviceAccount),
    credential: admin.credential.cert({
        "private_key": process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : settings.firebase.private_key,
        "client_email": process.env.FIREBASE_CLIENT_EMAIL || settings.firebase.client_email,
        "project_id": process.env.FIREBASE_PROJECT_ID || settings.firebase.project_id,
    }),
    databaseURL: "https://kmica-bot.firebaseio.com/"
});

// As an admin, the app has access to read and write all data, regardless of Security Rules
const db = admin.database();

const serverInitCheck = async (serverId, serverName) => {
    const config = db.ref(`/${serverId}/config`);
    return config.once("value", (snap) => {
        let value = snap.val()
        //console.log(value);
        if(!value) return serverInstallation(serverId, serverName)
        if(value) return value;
    });
}

/* Get admin roles */
const getRoles = (serverId) => {
    const roles = db.ref(`/${serverId}/roles`);
    return roles.once("value", (snap) => snap.val());
}

const serverInstallation = (serverId, serverName) => {
    const riot = db.ref(`/${serverId}/warnings-users`);
    const warnings = db.ref(`/${serverId}/warnings-users`);
    const music = db.ref(`/${serverId}/music`);
    const memes = db.ref(`/${serverId}/memes`);
    const roles = db.ref(`/${serverId}/roles`);
    const config = db.ref(`/${serverId}/config`);
    const emotes = db.ref(`/${serverId}/emotes`);

    // riot.push("");
    // warnings.push("");
    // music.push("");
    // memes.push("");
    // roles.push("");
    // config.push("");
    // emotes.push("");

    const confObj = {
        "serverName": serverName,
        "prefix": [],
        "musicWatcher": false,
        "musicWatcherPrefix": ["-p", "-play", "!play", "!p", "!search", "-search"],
        "musicChannel": null,
        "musicStrikes": 3,
        "adminRoles": [],
    }

    config.set(confObj);

    return confObj;
}

const blaBla = () => {
    const music = db.ref(`/server-id/music`);
    music.once("value", (snapshot) => {
        //console.log("Snap", snapshot.val())
    });
}

module.exports = {
    serverInitCheck: serverInitCheck,
    getRoles: getRoles,
    db: db,
};