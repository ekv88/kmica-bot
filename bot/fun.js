const https = require("https");
const { randomColor } = require('./utils.js');
const { db } = require('../db.js');

// Send 1 or more cats as single messages using message object
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


// Send 1 or more doggoz as single messages using message object
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

// Send multiple dogs
const getDoggos = (command, prefix, param1, param2, message) => {
	if(command === prefix + "doggos") {
        if(!param1) return message.channel.send('Tell us traveler, how many doggos? exp: `' + prefix + 'doggos 3`');
        sendDoggo(param1, param2, message);
    }
};

// Alias comands for !dog and !doggo
const getDog = (command, prefix, param1, param2, message) => {
    if(command === prefix + "dog" || command === prefix + "doggo") sendDoggo(param1, param2, message);
};

// Get multiple cats
const getCats = (command, prefix, param1, param2, message) => {
    if(command === prefix + "cats") {
        if(!param1) return message.channel.send('Tell us traveler, how many doggos? exp: `' + prefix + 'cats 3`');
        sendCat(param1, param2, message);
    }
};

// Alias comands for !cat
const getCat = (command, prefix, param1, param2, message) => {
    if(command === prefix + "cat") sendCat(param1, param2, message);
};


const getTopMemeLords = (command, prefix, param1, param2, message) => {
    if(command === prefix + "memeLords") {
        db.ref(`/${serverId}/roles`)
            .once("value", (snap) => {
                snap.val()
            });
    }
}


// Export methods
module.exports = {
	getDoggos: getDoggos,
	getDog: getDog,
	getCats: getCats,
	getCat: getCat,
    getTopMemeLords: getTopMemeLords
};