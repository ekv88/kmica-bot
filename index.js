// Extract the required classes from the discord.js module
const Discord = require('discord.js');
const { Client, Attachment } = Discord;
const settings = require('./config.json');
const fs = require('fs');
const dialogflow = require('dialogflow');
const ytdl = require('ytdl-core');
const cahData = require('./data/cah-data.js');

// Bot methods and ulits
const { randomNumber, randomColor, musicCommandWatcher, joinVoiceChannel, verifyUser } = require('./bot/utils.js');
// League of Legends bot flamer for bad games :"D
const { addUserToLolWatchList, deleteUserFromLolWatchList, setLolWatcherInterval, getLolWatchUserList, stopLolWatcher, startLolWatcher, instantLolWatcher } = require('./bot/rito.js');
// Admin parts of bot
const { botDebugStats, sayToAllChannels, rebootBot, shutdownBot } = require('./bot/admin.js');
// Doggos and cats man <3
const { getDoggos, getDog, getCats, getCat } = require('./bot/fun.js');

// Init Google dialogflow session
const sessionClient = new dialogflow.SessionsClient();
const sessionPath = sessionClient.sessionPath(settings.GoogleCloudProjectId, 'kmicaBot');

// Ranks will be a map of set(userId, { mapScheme });
/*** Scheme:
	mapScheme = { warningType: enum['SPAM', 'MISSUSE', 'PROFANITY'],}
**/
let ranks = new Map();
let warnings = new Map();

let CAH_GAME_ROOMS = [];

// Create an instance of a Discord client
const client = new Client();

client.on('ready', () => {
    client.user.setActivity('god with gods');

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
	message.author.send('Djes mala?\n\Slusaj, moras se verifikovati da vidis resto server.\n\Idi u kanal i verifikuj se da ne bi zavrsio u kanalu, jasno?!');
});

client.on('guildMemberRemove', message => {
    message.guild.channels.get('657649922123890710').send('**' + message.user.username + '**, picketina nas napustila, ko od ne mora ni da se vraca!');
});

client.on('message', message => {
    // Prevent bot form taking commands from himself
    if (message.author.bot) return;

    // Extract command and params
	let { prefix } = settings;
    let command = message.content.split(" ")[0] ? message.content.split(" ")[0] : null;
    let param1 = message.content.split(" ")[1] ? message.content.split(" ")[1] : null;
    let param2 = message.content.split(" ")[2] ? message.content.split(" ")[2] : null;

    // TODO log
    console.log("Message (" + message.channel.type + "):", command, message.content);
	
	// Don't proceed deeper into the code if command is direct message
    if (message.channel.type === 'dm') return;
	
    // Mr Police man
    musicCommandWatcher(command, prefix, param1, param2, message);

    // Ignore rest of messages
    if (!message.content.startsWith(settings.prefix)) return;
 
    // Change prefix
    if(command === settings.prefix + "newPrefix") {
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
    if(message.member.roles.some(role => ["589872090606338062", "589872418353315850"].includes(role.id))) {
        // Return bot debug - @TODO: Next milestone
        botDebugStats(command, prefix, param1, param2, message);

        // Send text message to every possible channel
        sayToAllChannels(command, prefix, param1, param2, message, client);

        // Restart bot
        rebootBot(command, prefix, param1, param2, message, client);

        // Shutdown bot
        shutdownBot(command, prefix, param1, param2, message, client);
    }


    // ---------------------------
    // games.js - PART OF BOT
});

// Login on start
client.login(process.env.CLIENT_TOKEN || settings.token);
