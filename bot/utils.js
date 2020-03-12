const Discord = require('discord.js');
const settings = require('../config.json');

// Generate random number
const randomNumber = (num) => Math.floor(Math.random() * num);

// Pick one of pre coded colors for esthetic purposes
const randomColor = () => {
    const colors = [8307777, 4310197, 2520036, 6685439, 15794943, 16712355, 15745347, 15784001, 16772866, 14626586];
    return colors[randomNumber(colors.length)]
};

// Random flame message - For LOL
const randomFlameMsg = () => {
    const messages = [
		'Oduvek me je zanimalo da li si pao s\' neba andjele moj mali i u tom padu zadobio povrede glave koje su ostavile mentalne posledice pa sad nisi sposoban da imas pozitivan skor? ',
		'Necu da kazem nista. Dacu minut cutanja mozdanim celijama tvojih saigraca, a mozda i njima jer si im provereno dao rak.',
		'AI treniran na Intelu 4004 bi bolje odigrao od tebe.',
		'Probaj u opcijama da pogledas "Accessibility settings" posto si ocito retardiran.',
		'Hajde `rm -rf leagueoflegeneds/` nije ovo za tebe.',
		'Boban ti je reko da si los.',
		'A da se batalis ti ove igre i da probas nesto na tvom mentalnom nivou, recimo slagalica od 4 dela.',
		'Nafido si vise cak i od Azre',
		'Tebe tebra ne treba ni komentarisati...',
		'Not even Noah can carry you animal...',
		'If the human body is 75% water, how can you be 100% idiot?',
		'If I wanted to kill myself I would jump from your ego to your ELO',
		'Ti si nesto poput Forest Gumpa, ali bez fazona trcanja. To ti dodje samo retardiran.',
		'Hajde, ubij se! U tome nađi spas! Hajde, ubij se! Razveseli nas!',
	];
    return messages[randomNumber(messages.length)]
};

// Random flame title - For LOL
const randomFlameTitle = (champion) => {
    const titles = [
		'Hendikepirani ' + champion + ' ponovo napada',
		'Tuzni ' + champion,
		'Garage sale ' + champion,
		'-10 IQ ' + champion,
		'Retardirani ' + champion,
		'Best eastern Kosovo ' + champion,
		champion + ' BOT',
	];
    return titles[randomNumber(titles.length)]
};

// Generate output file - For recording
const generateOutputFile = (channel, member) =>
    fs.createWriteStream(`./recordings/${channel.id}-${member.id}-${Date.now()}.pcm`);


const musicCommandWatcher = (command, prefix, param1, param2, message) => {
	// Mr polisman kmica
    if(settings.musicPrefix.includes(command)) {
        if(String(message.channel.id) !== "635956236730236928") {
            message.channel.send({
                "embed": {
                    "title": ":police_officer: Wrong channel!",
                    color: randomColor(),
                    "description": "Please use <#635956236730236928> channel or i will start bullying you."
                }
            });
			let VC = message.member.voiceChannel;
			// Check if is connected to voice channel
			if (!VC) return;
			const streamOptions = { seek: 0, volume: 1 };
			VC.join().then(connection => {
				// console.log("joined channel");
				let urlz = [
					'https://www.youtube.com/watch?v=XY55rmPzd4M', 
					'https://www.youtube.com/watch?v=ODcPX_gwhdY', 
					'https://www.youtube.com/watch?v=Y1uqniT07RU', 
					'https://www.youtube.com/watch?v=PUcf5Yw75gA'
				];
				const stream = ytdl(urlz[randomNumber(urlz.length)], { filter : 'audioonly' });
				const dispatcher = connection.playStream(stream, streamOptions);
				dispatcher.on("end", end => {
					// console.log("left channel");
					VC.leave();
				});
			}).catch(err => console.log(err));
        }
    }
};

// Very message
const sendVerificationMessage = (command, prefix, param1, param2, message) => {
    if(command === prefix + 'vMsg')
        message.channel.send({
            "embed": {
                "title": "Kako da se verifikujem?",
                "description": "Sve sto je potrebno jeste da ukucas `" + prefix + "verifikuj` i odgovoris tacno na pitanje.",
                "color": randomColor()
            }
        });
};
	
// Google dialogflow
const talkToBot = (command, prefix, param1, param2, message) => {
    if (command === prefix + "t") {
        if(!param1) return false;

        const dialogflowRequest = {
            session: sessionPath,
            queryInput: {
                text: {
                    text: message.content.substring(3),
                    languageCode: 'en-US'
                }
            }
        };
		
        sessionClient.detectIntent(dialogflowRequest).then(responses => {
            message.channel.send(responses[0].queryResult.fulfillmentText);
        }).catch(error => {
            console.log(error);
        });
    }
};

// Method for user verification
const verifyUser = (command, prefix, param1, param2, message) => {
	if(command === prefix + "verifikuj" || command === prefix + "verify") {
        let verfRoles = ['651159546693156865', '589946410871554049', '589873068491669536', '589872418353315850', '589872090606338062', '589869419380080700'];
		
        if(message.member.roles.some(role => verfRoles.includes(role.id)) ) {
            message.channel.send({
                "embed": {
                    "title": "Ne smaraj me",
                    color: 16197916,
                    "description": "Noobe botovski vec imas rolu, ne smaraj me"
                }
            }).then(msg => msg.delete(30000));
        } else {
            let acceptedToServer = false;
            message.channel.send({
                "embed": {
                    "title": "Odgovori na pitanje:",
                    color: randomColor(),
                    "description": "Dimenzija mog penisa je?\nOdgovori brojem, misli se na centimetre, imas 30 sekundi."
                }
            }).then(msg => msg.delete(30000));
			
            const collector = new Discord.MessageCollector(channel, m => m.author.id === author.id, { time: 32000, max: 6 });
            collector.on('collect', msg => {
                const answer = parseInt(msg.content);
                if (answer <= 5) {
                    msg.react('😡');
                    msg.reply("Evo tebi jedan ban za nepostovanje.").then(msg => msg.delete(15000));
                    if (msg.guild.member(msg.author).bannable) {
						// Ban user method
						guild.ban(msg.author, { days: 1, reason: 'Prozivaj kod kuce tako' })
							.then(user => console.log('Banned ' + msg.author.username || msg.author.id || user + 'from ' + guild))
								.catch(err => console.log(error));
                    }
                }
                if (answer < 15 && answer > 5) {
                    msg.react('😡');
                    msg.reply("Oces batine mozda?").then(msg => msg.delete(15000));
                    // msg.react('😄');
                }
                if (answer < 25 && answer > 15) {
                    msg.react('😡');
                    msg.reply("A da ja tebe banujem umesto da verifikujem?").then(msg => msg.delete(15000));
                }
                if (answer < 35 && answer > 25) {
                    msg.react('😡');
                    msg.reply("Pa zar mislis da je samo natprosecno velik?").then(msg => msg.delete(15000));
                }
                if (answer > 35) {
                    acceptedToServer = true;
                    msg.react('😄');
                    if(answer > 60) msg.react('🍆');
                    // 651159546693156865
                    let verRole = msg.guild.roles.find(role => role.id === "651159546693156865");
                    msg.member.addRole(verRole);
                    msg.reply("Malo veci, al' prihvaticu odgovor.\nVelkam tu d dzangl.").then(msg => msg.delete(15000));
                }
            });
            collector.on('end', (msg, response) => {
                if(response === 'limit' && !acceptedToServer) {
                    message.channel.send({
                        "embed": {
                            color: 16197916,
                            "description": "Previse pokusaja mlado momce.\nGoni se sa servera."
                        }
                    }).then(msg => msg.delete(10000));
                }
                if(response === 'time' && !acceptedToServer) {
                    message.channel.send({
                        "embed": {
                            color: 16197916,
                            "description": "Sine nemam ja ceo dan tebe da cekam.\nGoni se sa servera."
                        }
                    }).then(msg => msg.delete(10000));
                }
                console.log(msg, response, message.member.roles)
            });
        }
    }
};

const joinVoiceChannel = (command, prefix, param1, param2, message) => {
    // Djido mova - Voice todo
    if (command === prefix + "join") {
        let VC = message.member.voiceChannel;
        // Check if is connected to voice channel
        if (!VC) return message.channel.send("You need to be connected to channel");

        VC.join().then(connection => {
            const dispatcher = connection.playFile('./boris-test.mp3');

            connection.on('speaking', (user, speaking) => {
                if (speaking) {
                    const receiver = connection.createReceiver();
                    message.channel.send(`Sta opet kenjas ${user}?`);
                    // this creates a 16-bit signed PCM, stereo 48KHz PCM stream.
                    const audioStream = receiver.createPCMStream(user);
                    // create an output stream so we can dump our data in a file
                    const outputStream = generateOutputFile(VC, user);
                    // pipe our audio data into the file stream
                    audioStream.pipe(outputStream);
                    outputStream.on("data", console.log);
                    // when the stream ends (the user stopped talking) tell the user
                    audioStream.on('end', () => {
                        message.channel.send(`Smaras ${user}, odoh.`);
                    });
                }
            });
            dispatcher.on("end", end => VC.leave());
        })
    }
};

// Export methods
module.exports = {
	randomNumber: randomNumber,
	randomColor: randomColor,
	randomFlameMsg: randomFlameMsg,
    randomFlameTitle: randomFlameTitle,
	generateOutputFile: generateOutputFile,
	musicCommandWatcher: musicCommandWatcher,
	joinVoiceChannel: joinVoiceChannel,
	verifyUser: verifyUser
};