// Extract the required classes from the discord.js module
const Discord = require('discord.js');
const { Client, Attachment, MessageAttachment  } = Discord;
const { serverInitCheck, db, getRoles } = require('./db');
const settings = require('./config.json');

// Bot methods and ulits
const { randomNumber, randomColor, musicCommandWatcher, joinVoiceChannel, verifyUser } = require('./bot/utils.js');
// League of Legends bot flamer for bad games :"D
const { addUserToLolWatchList, deleteUserFromLolWatchList, setLolWatcherInterval, getLolWatchUserList, stopLolWatcher, startLolWatcher, instantLolWatcher, setTftWatcherInterval, startTftWatcher, stopTftWatcher, instantTftWatcher } = require('./bot/rito.js');
// Admin parts of bot
const { botDebugStats, sayToAllChannels, rebootBot, shutdownBot, sendToGulag } = require('./bot/admin.js');
// Doggos and cats man <3
const { getDoggos, getDog, getCats, getCat, getTopMemeLords } = require('./bot/fun.js');

// Init Google dialogflow session
// const sessionClient = new dialogflow.SessionsClient();
// const sessionPath = sessionClient.sessionPath(settings.GoogleCloudProjectId, 'kmicaBot');

// Ranks will be a map of set(userId, { mapScheme });
/*** Scheme:
	mapScheme = { warningType: enum['SPAM', 'MISSUSE', 'PROFANITY'],}
**/
let ranks = new Map();
let warnings = new Map();

let CAH_GAME_ROOMS = [];

// Create an instance of a Discord client
const client = new Client();

// New multi server config
let SERVER_CONFIG = {};
let SERVER_ROLES = {};

client.on('ready', () => {
    // client.user.setActivity('god with gods');
    // client.user.setActivity("gods dying", { type: "WATCHING" })
    client.user.setActivity("gods dying", { type: "WATCHING" });
    client.user.setUsername("Mr. Kmica 👑");

    console.log('Init message');
});

// Reconnecting event for future
client.once('reconnecting', () => {
    console.log('Reconnecting!');
});

// Disconnecting event for future use
client.once('disconnect', () => {
    console.log('Disconnect!');
});

client.on('guildMemberAdd', message => {
    //message.guild.channels.get('channelID').send('**' + message.user.username + '**, has joined the server!'); 
	message.author.send('Djes mala?\n\Slusaj, moras se verifikovati da vidis resto servera.\n\Idi u kanal i verifikuj se da ne bi zavrsio u kanalu, jasno?!');
});

client.on('guildMemberRemove', message => {
    message.guild.channels.get('657649922123890710').send('**' + message.user.username + '**, picketina nas napustila, ko od ne mora ni da se vraca!');
});

client.on('message', async message => {
    // Prevent bot form taking commands from himself
    if (message.author.bot) return;

    var serverId = message.channel.guild.id;
    let config = await serverInitCheck(serverId, message.channel.guild.name);
    SERVER_CONFIG[serverId] = config.val();

    if(!SERVER_ROLES[serverId]) {
        let roles = await getRoles(serverId);
        SERVER_ROLES[serverId] = await Object.values(roles.val());
        console.log("SERVER_ROLES[" + serverId + "]", SERVER_ROLES[serverId])
    }

    // Extract params
	let { prefix, musicWatcher, memeChannel, memeMirrorChannel } = SERVER_CONFIG[serverId];

    let command = message.content.split(" ")[0] ? message.content.split(" ")[0] : null;
    let param1 = message.content.split(" ")[1] ? message.content.split(" ")[1] : null;
    let param2 = message.content.split(" ")[2] ? message.content.split(" ")[2] : null;

    // TODO log
    console.log("Message (" + message.channel.type + "):", command, message.content);
	
	// Don't proceed deeper into the code if command is direct message
    if (message.channel.type === 'dm') return;
	
    // Mr Police man
    if(musicWatcher === true) {
        musicCommandWatcher(command, prefix, param1, param2, message);
    }

    // if(message.channel.id === memeChannel) {
    //     let attachArray = message.attachments.array();
    //     if(attachArray.length > 0) {
    //         let { id: attachId, attachment, name, size, url, height, width } = attachArray[0];
    //         let memeDb = db.ref(`/${serverId}/memes/${attachId}`);
    //         let preparedObj = {
    //             id: attachId,
    //             attachment: attachment,
    //             name: name,
    //             size: size,
    //             url: url,
    //             height: height,
    //             width: width,
    //             content: message.content,
    //             channelId: message.channel.id,
    //             authorId: message.author.id,
    //             authorUsername: message.author.username,
    //         }
    //         memeDb.set(preparedObj).then(_ => {
    //             let memeLord = db.ref(`/${serverId}/meme-lords/${message.author.id}`);
    //             let prepareLord = {
    //                 id: message.author.id,
    //                 username: message.author.username,
    //                 discriminator: message.author.discriminator,
    //                 avatar: message.author.avatar,
    //             }
    //             memeLord.set(prepareLord);
    //         });
    //
    //         if(memeMirrorChannel) {
    //             const memeAttach = new MessageAttachment(attachment);
    //             // Send the attachment in the message channel with a content
    //             client.channels.cache.get(memeMirrorChannel).send(`Mirror memara od ${message.author} iz ${message.channel.guild}:`, memeAttach);
    //         }
    //
    //         console.log("ID: ", attachArray[0].id, ", Nova MIMARA!")
    //     }
    // }
    // Meme methods att - name, id, size, url, attachment



    // Ignore rest of messages
    if (!message.content.startsWith(prefix)) return;
 
    // Change prefix
    if(command === prefix + "newPrefix") {
        if(!param1) {
            message.channel.send({
                "embed": {
                    "title": "Missing param",
                    color: randomColor(),
                    "description": "Missing param, use as: " + settings.prefix + "newPrefix # to set # as new prefix."
                }
            });
            return false;
        }
        // @TODO: Update prefix
        settings['prefix'] = param1;
        message.channel.send({
            "embed": {
                "title": "Missing param",
                color: randomColor(),
                "description": "Prefix is now: " + settings.prefix
            }
        });
    }

	// ---------------------------
	// fun.js - PART OF BOT
	
	// Get one dog image
	getDog(command, prefix, param1, param2, message);
	
	// Get bunch of doggo images
	getDoggos(command, prefix, param1, param2, message);
	
	// Get one cat image
	getCat(command, prefix, param1, param2, message);
	
	// Get bunch of kittens images
	getCats(command, prefix, param1, param2, message);


    // ---------------------------
    // utils.js - PART OF BOT

    // Get bot to voice channel
    joinVoiceChannel(command, prefix, param1, param2, message);

    // Verify new user
    verifyUser(command, prefix, param1, param2, message);

	// ---------------------------
	// rito.js - PART OF BOT

    // Add new user to league of legends watch list
    addUserToLolWatchList(command, prefix, param1, param2, message);

    // Delete user from league of legends watch list
    deleteUserFromLolWatchList(command, prefix, param1, param2, message);

    // Set league of legends watcher refresh interval in MS
    setLolWatcherInterval(command, prefix, param1, param2, message);

    // Print list of all user registered in watcher list
    getLolWatchUserList(command, prefix, param1, param2, message);

    // Sto league of legend watcher
    stopLolWatcher(command, prefix, param1, param2, message);

    // Start league of legends watcher
    startLolWatcher(command, prefix, param1, param2, message);

    // Refresh league of legend watcher right now - Use this for tests
    instantLolWatcher(command, prefix, param1, param2, message);

    // ---------------------------
    // admin.js - PART OF BOT

    // If member has one of admin/mod id roles
    if(message.member.roles.cache.some(role => SERVER_ROLES[serverId] ? SERVER_ROLES[serverId].includes(role.id) : false)) {

        // Return bot debug - @TODO: Next milestone
        botDebugStats(command, prefix, param1, param2, message, client, config);

        // Send text message to every possible channel
        sayToAllChannels(command, prefix, param1, param2, message, client);

        // Restart bot
        rebootBot(command, prefix, param1, param2, message, client);

        // Shutdown bot
        shutdownBot(command, prefix, param1, param2, message, client);

        // Shutdown bot
        sendToGulag(command, prefix, param1, param2, message, client);

        /*** As it's still under development allow for admins and mods for now **/

        // Set TFT watcher refresh interval in MS
        setTftWatcherInterval(command, prefix, param1, param2, message);

        // Sto TFT watcher
        startTftWatcher(command, prefix, param1, param2, message);

        // Start TFT watcher
        stopTftWatcher(command, prefix, param1, param2, message);

        // Refresh TFT watcher right now - Use this for tests
        instantTftWatcher(command, prefix, param1, param2, message);

        getTopMemeLords(command, prefix, param1, param2, message, serverId);
    }

    // Change prefix
    if(command === prefix + "lfg") {
        message.channel.send({
            "embed": {
                "title": "Shall we play a game?",
                color: randomColor(),
                "description": "React to game you want to play and I will bother other players for you. Because I can."
            }
        }).then(msg => {
            let games = client.emojis.cache.map(emoji => {
                if(['lol', 'valorant', 'csgo', 'minecraft', 'gta5', 'apex', 'paladins', 'wow'].includes(emoji.name)) {
                    msg.react(emoji.id)
                }
            });
        });
    }

    // ---------------------------
    // games.js - PART OF BOT
});

// Login on start
client.login(process.env.CLIENT_TOKEN || settings.token).catch(error => {
    // Avoid crash the app with message
    console.warn('Token is missing!', error);
    process.exit(0);
});