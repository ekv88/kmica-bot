const settings = require('../config.json');
const { randomColor, randomNumber } = require('./utils.js');

// Implement a user role reader here as beeter solution
const botDebugStats = (command, prefix, param1, param2, message, client, config) => {
    if (command === prefix + 'debug') {
        // console.log(message.author);
        // if(message.author.username !== 'ekv' && message.author.discriminator !== 6479)

        // Implement logging
        message.channel.send({
            "embed": {
                "description": "Debug server settings:\n" + JSON.stringify(config),
                "color": randomColor(),
                "thumbnail": {
                    "url": message.author.avatarURL
                },
                "author": {
                    "name": "Usage info"
                },
                "fields": [
                    {
                        "name": "!doggo",
                        "value": "Korisceno do sad: x"
                    },
                    {
                        "name": "!cats",
                        "value": "Korisceno do sad: x"
                    },
                ]
            }
        });
    }
};
	
const sayToAllChannels = (command, prefix, param1, param2, message, client) => {
	if(command === prefix + "say") {
        if(!param1) return message.channel.send("Da li ti je mama rekla gola komanda bez parama poziva ne exit? Reci!");
		
        message.client.guilds.cache.map((guild) => {
            guild.channels.cache.map(channel => {
				if(channel.type === 'text') client.channels.cache.get(channel.id).send(message.content.substring(prefix.length + 3))
			});
        });
    }
};
    
const rebootBot = (command, prefix, param1, param2, message, client) => {
    if(command === prefix + "reboot") {
        message.channel.send("Reloaded, gg ez");
        console.clear();
        client.destroy();
        client.login(process.env.CLIENT_TOKEN || settings.token);
        return false;
    }
};

const shutdownBot = (command, prefix, param1, param2, message, client) => {
    if(command === prefix + "shutdown") {
        message.channel.send("Battery is low and it's getting dark :(");
        console.clear();
        client.destroy();
        client.login('goToSleepBrah');
        return false;
    }
};

const sendToGulag = async (command, prefix, param1, param2, message, client) => {
    if(command === prefix + "gulag") {
        if(!param1) return message.channel.send("Comrad, please tell me what users you want me to move in gulag?");
        // console.log(message.channel.members.)
        let targetUser = message.channel.members.find(member => member.id == message.mentions.users.first().id);
        let channelName = 'Gulag-' + randomNumber(1000);

        const gulagChannel = await message.guild.channels.create(channelName, { type: 'voice', reason: 'Dont grab 🧼' })
            .catch((error => console.log(error)));

        console.log(targetUser.guild, targetUser.guild.members, targetUser.guild.channels, targetUser.guild.presences)
        // .setVoiceChannel(gulagChannel)

        // userList.map(async user => {
        //     // user.
        //     console.log(user, "aaaaaaaaaaaaaaaaa", channel);
        //     //await user.client.voice.setChannel(message.guild.channels.find(r => r.name === 'Gulag comrad'));
        // });

        // message.channel.send("Welcome to Gulag comrad. You are here to stay.");
    }
};

// Export functions for discord part
module.exports = {
	botDebugStats: botDebugStats,
	sayToAllChannels: sayToAllChannels,
	rebootBot: rebootBot,
	shutdownBot: shutdownBot,
    sendToGulag: sendToGulag,
};
