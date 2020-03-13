const settings = require('../config.json');
const { randomColor } = require('./utils.js');

// Implement a user role reader here as beeter solution
const botDebugStats = (command, prefix, param1, param2, message) => {
    if (command === settings.prefix + 'debug') {
        // console.log(message.author);
        // if(message.author.username !== 'ekv' && message.author.discriminator !== 6479)

        // Implement logging
        message.channel.send({
            "embed": {
                "description": "Izvolite gospodine sve informacije do sad:",
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
		
        message.client.guilds.forEach((guild) => {
            guild.channels.map(channel => {
				if(channel.type === 'text') client.channels.get(channel.id).send(content.substring(6))
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

// Export functions for discord part
module.exports = {
	botDebugStats: botDebugStats,
	sayToAllChannels: sayToAllChannels,
	rebootBot: rebootBot,
	shutdownBot: shutdownBot,
};
