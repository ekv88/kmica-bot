// Extract the required classes from the discord.js module
const Discord = require('discord.js')
const { Client, Attachment } = Discord;
const settings = require('./config.json');
const https = require("https");
const ytdl = require('ytdl-core');
const fs = require('fs');
const dialogflow = require('dialogflow');
const cahData = require('./cah-data.js');

const sessionClient = new dialogflow.SessionsClient();
const sessionPath = sessionClient.sessionPath(settings.GoogleCloudProjectId, 'kmicaBot');

console.log(settings);

// Ranks will be a map of set(userId, { mapScheme });
/*** Scheme:
  mapScheme = {
    warningType: enum['SPAM', 'MISSUSE', 'PROFANITY'],

  }
**/
let ranks = new Map();
let warnings = new Map();

let CAH_GAME_ROOMS = [

];

// Create an instance of a Discord client
const client = new Client();

// Global channels - todo
let channels = [];

/** Pick one of pre coded colors for esthetic purposes **/
const randomColor = () => {
  const colors = [8307777, 4310197, 2520036, 6685439, 15794943, 16712355, 15745347, 15784001, 16772866, 14626586];
  return colors[Math.floor(Math.random() * colors.length)]
};

/** Generate random number - todo extend this to have: from - top option, not just from 0 to N */
const randomNumber = (num) => Math.floor(Math.random() * num);

/** Send 1 or more cats as single messages using message object */
const sendCat = (quantity = 1, sendTo, message) =>
[...Array(Number(quantity || 1))].map(doggo => {
    message.channel.send({
      "embed": {
        "title": sendTo ? ":cat: | This cat is for " + sendTo : ":cat: | Here is a cat",
        color: randomColor(),
        "image": {
          "url": "https://cdn.tatsumaki.xyz/cats/" + Math.floor(Math.random() * 473) + ".jpg"
        }
      }
    });
  });


/** Send 1 or more doggoz as single messages using message object */
const sendDoggo = (quantity = 1, sendTo, message) => {
  const url = "https://dog.ceo/api/breeds/image/random/" + quantity;
  https.get(url, res => {
    res.setEncoding("utf8");
    let body = "";
    res.on("data", data => {
      body += data;
    });
    res.on("end", () => {
      const { message:doggos } = JSON.parse(body);
      if(doggos) {
        doggos.map(doggo => {
          message.channel.send({
            "embed": {
              "title": ":dog: | Here you go, a doggo",
              color: randomColor(),
              "image": {
                "url": doggo
              }
            }
          });
        })
      }
    });
  });
};

const generateOutputFile = (channel, member) =>
  fs.createWriteStream(`./recordings/${channel.id}-${member.id}-${Date.now()}.pcm`);

client.on('ready', () => {
  client.user.setActivity('god with gods');
  client.user.setStatus("Aaaaa");

  //console.log(client.user.debug())

  client.guilds.forEach((guild) => {
      console.log(" - " + guild.name);

      // List all channels
      guild.channels.map((channel) => {
          if(channel.type === 'text') {
              //client.channels.get(channel.id).send('Elloo maj nibbaz');
          }
          console.log(` -- ${channel.name} (${channel.type}) - ${channel.id}`)
      });

      // @TODO
      channels = guild.channels.map((name, type, id) => ({name: name, value: "test"}));
  });
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

client.on('message', message => {
	// Prevent bot form taking commands from himself
	if (message.author.bot) return;
	
	// Extract command and params
	let command = message.content.split(" ")[0] ? message.content.split(" ")[0] : null;
	let param1 = message.content.split(" ")[1] ? message.content.split(" ")[1] : null;
	let param2 = message.content.split(" ")[2] ? message.content.split(" ")[2] : null;
	
	// TODO log
	console.log(settings.musicPrefix.includes(command), "Komanda", command, settings.musicPrefix, message.member.roles);
	
	// Mr polisman kmica
	if(settings.musicPrefix.includes(command)) {
		if(String(message.channel.id) !== "635956236730236928") {
			message.channel.send({
				"embed": {
				"title": ":police_officer: Sta radis to tebrane?",
				color: randomColor(),
				"description": "Tebrane, ajde koristi muci chanel, pa nije tu dzabadava."
				}
			});
		}
	}
	
	// Ignore rest of messages
	if (!message.content.startsWith(settings.prefix)) return;
	
	// Very message
	if(message.content === settings.prefix + 'vMsg') {
		message.channel.send({
			"embed": {
				"title": "Kako da se verifikujem?",
				"description": "Sve sto je potrebno jeste da ukucas `" + settings.prefix + "verifikuj` i odgovoris tacno na pitanje.",
				"color": randomColor()
			}
		  });
	}
	
    // Implement a user role reader here as beeter solution
    if (message.content === settings.prefix + 'info') {
        //console.log(message.author);
        if(message.author.username !== 'ekv' && message.author.discriminator !== 6479) {
          message.channel.send({
            "embed": {
              "description": "Ova opcija je dostupna samo jednom jednom bogu. Gospodinu ekv-u! Ti si neka smradina " + message.author,
              "color": randomColor(),
              "thumbnail": {
                "url": message.author.avatarURL
              },
              "author": {
                "name": "Debug info"
              },
              "fields": [
                {
                  "name": "???",
                  "value": "Momce sta to pokusavas?! 🤔"
                }
              ]
            }
          });
          return false;
        }

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

    // Ping - pong
    if (message.content === settings.prefix + 'x') {
      message.channel.send({
        "embed": {
          description: channels.map((channel) => { return channel.name.name + " - " + channel.name.id + "\n" }).toString(),
          color: randomColor(),
          "author": {
            "name": "Init msg log"
          }
        }
      });
    }

    if(command === settings.prefix + "doggos") {
      if(!param1) {
        message.channel.send("Tell us traveler, how many doggos? exp: !doggos 3");
        return false;
      }
      sendDoggo(param1, param2, message);
    }

    /** Alias comands for !dog and !doggo **/
    if(command === settings.prefix + "dog" || command === settings.prefix + "doggo")
      sendDoggo(param1, param2, message);

    if(command === settings.prefix + "cats") {
      if(!param1) {
        message.channel.send("Tell us traveler, how many cats? exp: !cats 3");
        return false;
      }
      sendCat(param1, param2, message);
    }

    /** Alias comands for !cat **/
    if(command === settings.prefix + "cat") {
      sendCat(param1, param2, message);
      console.log("Cat man")
    }

    if(command === settings.prefix + "reci") {
      if(!param1) {
        message.channel.send("Da li ti je mama rekla gola komanda bez parama poziva ne exit? Reci!");
        return false;
      }
      console.log("Kreno sam da kazem");

      client.guilds.forEach((guild) => {
          guild.channels.map((channel) => {
              if(channel.type === 'text') {
                  client.channels.get(channel.id).send(message.content.substring(6));
                  //console.log(` -- ${channel.name} (${channel.type}) - ${channel.id}`)
              }
          });
      });
    }

	if(command === settings.prefix + "verifikuj") {
		let verfRoles = ['651159546693156865', '589946410871554049', '589873068491669536', '589872418353315850', '589872090606338062', '589869419380080700'];
		if(message.member.roles.some(role => verfRoles.includes(role.id)) ) {
		  message.channel.send({
			"embed": {
			  "title": "Ne smaraj me",
			  color: 16197916,
			  "description": "Noobe botovski vec imas rolu, ne smaraj me"
			}
		  });
		} else {
			let acceptedToServer = false
			message.channel.send({
				"embed": {
					"title": "Odgovori na pitanje:",
					color: randomColor(),
					"description": "Dimenzija mog penisa je?\nOdgovori brojem, misli se na centimetre, imas 30 sekundi."
				}
			}).then(msg => msg.delete(30000));
			const collector = new Discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: 32000, max: 6 });
			collector.on('collect', msg => {
				const answer = parseInt(msg.content)
				if (answer <= 5) {
					msg.react('😡');
					msg.reply("Evo tebi jedan ban za nepostovanje.").then(msg => msg.delete(15000));
					if (msg.guild.member(msg.author).bannable) {
						message.guild.ban(msg.author) // Bans the user
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

    // Reload command for ez dev
    if(command === settings.prefix + "reboot") {
      console.clear();
      client.destroy();
      client.login(settings.token);
      message.channel.send("Reloaded, gg ez");
      return;
    }

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

  // Game par of code *This will be sad*
  if(command === settings.prefix + 'cah') {
    let gameId = null;
    if(!param1) {
      message.reply("E nubarop jedna, kucaj `" + settings.prefix + "cah help` ako oces vise informacija");
      return false;
    }
    switch (param1) {
      case "help":
        message.channel.send({
          "embed": {
            "title": "Cards Against Humanity",
            color: 1,
            "description": "E ovako nubaro moja ovo su sve komande koje mozes koristiti:",
            "thumbnail": {
              "url": "https://www.menkind.co.uk/media/catalog/product/cache/18d539bb2b3719975e9326e6edaea759/c/a/cards_against_humanity_61032_2__1.jpg"
            },
            "fields": [
              {
                "name": settings.prefix + "cah help",
                "value": "Pomoc ova koju upravo citas"
              },{
                "name": settings.prefix + "cah rooms",
                "value": "Lista trenutnih soba"
              },{
                "name": settings.prefix + "cah create",
                "value": "Napravi novu sobu"
              },{
                "name": settings.prefix + "cah join [room-id]",
                "value": "Pridruzi se sobi koja trenutno ceka igrace"
              }
            ]
          }
        });
      break;
      case "create":
        message.reply("Igra je uspesno kreirana sa ID-om:" + 1);
      break;
      default:
        message.reply("E nubarop jedna, kucaj `" + settings.prefix + "cah help` ako oces vise informacija");
      break;
    }
  }

  // Game par of code *This will be sad*
  if(command === settings.prefix + 'meme') {
    let gameId = null;
    if(!param1) {
      message.reply("da naucis kako se koristi kucaj: `" + settings.prefix + "meme help`");
      return false;
    }
    switch (param1) {
      case "help":
        message.channel.send({
          "embed": {
            "title": "MEMEz",
            color: 6750147,
            "description": "U sustini verovatno nikada necu zavristi ovo do kraja, ali fora je da lako daje mimove",
            "thumbnail": {
              "url": "https://dailystormer.name/wp-content/uploads/2017/03/prophet-of-kek.jpg"
            },
            "fields": [
              {
                "name": settings.prefix + "meme top",
                "value": "Listu top 100 mimova"
              },{
                "name": settings.prefix + "meme search 'ime'",
                "value": "Daje ti template za taj meme"
              },{
                "name": settings.prefix + "meme create [id]",
                "value": "Generise link sa templejtom"
              },{
                "name": settings.prefix + "meme random",
                "value": "Baci random meme"
              }
            ]
          }
        });
        break;
      case "create":
        message.reply("Igra je uspesno kreirana sa ID-om:" + 1);
        break;
      default:
        message.reply("E nubarop jedna, kucaj `" + settings.prefix + "cah help` ako oces vise informacija");
        break;
    }
  }
	// Google dialogflow
	if (command === settings.prefix + "t") {
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
			console.log(error)
		});
	}

    // Djido mova - Voice todo
    if (command === settings.prefix + "odi") {
        var VC = message.member.voiceChannel;
        // Check if is connected to voice channel
        if (!VC) return message.reply("Brah, not in voice brah");

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
            dispatcher.on("end", end => {
              VC.leave()
            });
        })
    }
});

// Login on start
client.login(settings.token);
