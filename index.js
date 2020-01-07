// Extract the required classes from the discord.js module
const { Client, Attachment } = require('discord.js');
const settings = require('./config.json')
const https = require("https");
const ytdl = require('ytdl-core');
const fs = require('fs');

console.log(settings)

// Ranks will be a map of set(userId, { mapScheme });
/*** Scheme:
  mapScheme = {
    warningType: enum['SPAM', 'MISSUSE', 'PROFANITY'],

  }
**/
let ranks = new Map();
let warnings = new Map();

// Create an instance of a Discord client
const client = new Client();

// Global chanells - todo
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
}

const generateOutputFile = (channel, member) =>
  fs.createWriteStream(`./recordings/${channel.id}-${member.id}-${Date.now()}.pcm`)

client.on('ready', () => {
  client.user.setActivity('god with gods');
  client.user.setStatus("Aaaaa");

  //console.log(client.user.debug())

  client.guilds.forEach((guild) => {
      console.log(" - " + guild.name)

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
  if (!message.content.startsWith(settings.prefix)) return;

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
          description: channels.map((channel) => { return channel.name.name + "\n" }).splice(",").toString(),
          color: randomColor(),
          "author": {
            "name": "Init msg log"
          }
        }
      });
    }


    let command = message.content.split(" ")[0] ? message.content.split(" ")[0] : null;
    let param1 = message.content.split(" ")[1] ? message.content.split(" ")[1] : null;
    let param2 = message.content.split(" ")[2] ? message.content.split(" ")[2] : null;

    if(command === settings.prefix + "doggos") {
      if(!param1) {
        message.channel.send("Tell us traveler, how many doggos? exp: !doggos 3");
        return false;
      }
      sendDoggo(param1, param2, message);
    }

    /** Alias comands for !dog and !doggo **/
    if(command === settings.prefix + "dog" || command === settings.prefix + "doggo")
      sendDoggo(param1, param2, message)

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
                  console.log(` -- ${channel.name} (${channel.type}) - ${channel.id}`)
              }
          });
      });
    }

    // Mr polisman kmica
    if(command === settings.musicPrefix + "p" || command === settings.musicPrefix + "play" || command === settings.musicPrefix + "p" || command === settings.musicPrefix + "play") {
      // 635956236730236928 - music chanell id
      //console.log(message.channel.id)
      if(message.channel.id !== "635956236730236928") {
        message.channel.send({
          "embed": {
            "title": ":police_officer: Sta radis to tebrane?",
            color: randomColor(),
            "description": "Tebrane, ajde koristi muci chanel, pa nije tu dzabadava."
          }
        });
      }
    }

    // Reload command for ez dev
    if(command === settings.prefix + "reload") {
      console.clear();
      client.destroy()
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

    // Djido mova - Voice todo
    if (command === settings.prefix + "odi") {
        var VC = message.member.voiceChannel;
        if (!VC) return message.reply("Brah, not in voice brah")
        VC.join().then(connection => {
            const dispatcher = connection.playFile('C:/Users/Stefan/Documents/kmica-bot/boris-test.mp3');

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
        .catch(console.error);
    };
});

// Login on start
client.login(settings.token);
