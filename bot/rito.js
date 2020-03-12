const settings = require('../config.json');
const https = require("https");
const fetch = require("node-fetch");
const { importRiotUserList } = require('../data/ritoUserList.js');
const { randomFlameMsg, randomFlameTitle } = require('./utils.js');

// Get from ENV or read from settings (Heroku and dev. env implementation)
const RIOT_KEY = process.env.RIOT_KEY || settings.ritoKey;
const FALLBACK_VERSION = process.env.FALLBACK_VERSION || "10.3.1";

// Global data
let championList;
let gameVersion = FALLBACK_VERSION;
let riotUserList = importRiotUserList;
let riotIntervalFunction;
let riotIntervalValue = 1000 * 60 * 10;

// Extract game versions
const getLastGameVersion = async () =>
	await fetch("https://ddragon.leagueoflegends.com/api/versions.json")
		.then(res => res.json())
			.then(json => json[0]);

const getChampionList = async () =>
	await fetch("http://ddragon.leagueoflegends.com/cdn/" + gameVersion + "/data/en_US/champion.json")
		.then(res => res.json())
			.then(json => Object.keys(json.data).map((k) => json.data[k]));

// Extract data like accountId, avatar, lvl from summoner name
const getSummonerDataBySummonerName = async (summonerName) => {
    const url = "https://eun1.api.riotgames.com/lol/summoner/v4/summoners/by-name/" + summonerName + "?api_key=" + RIOT_KEY;
	return await fetch(url)
		.then(res => res.json())
			.then(json => json)
				.catch(error => console.error("getSummonerDataBySummonerName", error));
};

// Get match history by accountId
const getMatchesBySumonerAccountId = async (accountId) => {
	const url = "https://eun1.api.riotgames.com/lol/match/v4/matchlists/by-account/" + accountId + "?api_key=" + RIOT_KEY;
	return await fetch(url)
		.then(res => res.json())
			.then(json => json)
				.catch(error => console.error("getMatchesBySumonerAccountId", error));
};

// Get full info about game stats by gameId
const getGameData = async (gameId) => {
	const url = "https://eun1.api.riotgames.com/lol/match/v4/matches/" + gameId + "?api_key=" + RIOT_KEY;
	return await fetch(url)
		.then(res => res.json())
			.then(json => json)
				.catch(error => console.error("getGameData", error));
};

// Calculate KDA (Kills, Deaths, Assists) = K + A / D
const getKDA = (kills = 0, deaths = 0, assists = 0) => 
	((parseInt(kills) + parseInt(assists)) / deaths).toFixed(2);

// Combine all methods to return spcific user gamme stats data
const getLastGameStats = async (summonerName, lastCheck) => {
	// Get summoner data by summoner name
	const summoner = await getSummonerDataBySummonerName(summonerName);
	// Extract needed variables from summoner data
	const { accountId, summonerLevel } = summoner;
	// Extract all match history using accountId
	const matches = await getMatchesBySumonerAccountId(accountId);
	// Extract timestamp
	const timestamp = await matches.matches[0].timestamp;
	// Check if this game was already checked
	if(lastCheck >= timestamp) return {...matches.matches[0], summonerName: summonerName, newGame: false };
	// Select last game from match history and look for data.
	const lastGameData = await getGameData(matches.matches[0].gameId);
	// Extract participantId (temp ID in game) and matchHistoryUri form "participantIdentities" so we can look for data only with that ID
	const { participantId, player: { matchHistoryUri, currentPlatformId: region, summonerName: sumName } } = await lastGameData.participantIdentities.filter(x => x.player.accountId == accountId)[0];
	// Extract stat only for player we are interested in
	return {...lastGameData.participants.filter(x => x.participantId == participantId)[0], ...summoner, timestamp: timestamp, summonerName: sumName, matchHistoryUri: matchHistoryUri, region, newGame: true}
};

// Prettify data for simplear use later on Discord part
const parseSummonerAndGameData = async (gameData) => {
	// If this isn't new game dont pass all game data
	const { newGame } = gameData;
	if(newGame === false) return { ...gameData, newGame: newGame };
	
	// Spred all variables
	const { championId, profileIconId, summonerName, matchHistoryUri, timestamp, region, stats: { win, kills, deaths, assists, pentaKills }, timeline: { role, lane } } = gameData;
	
	// Await for champion list so we can normalize names
	championList = await getChampionList();
	
	let historyUrl = matchHistoryUri.split('/');
	const championName = await championList.find(x => x.key == championId)["name"];
	const championImage = await championList.find(x => x.key == championId)["image"]["full"];
	
	// @TODO: Build match history url later https://matchhistory.eune.leagueoflegends.com/en/#match-details/EUN1/2377040059/33254194
	// Return parsed data
	return {
		summonerName: summonerName,
		summonerIcon: "http://ddragon.leagueoflegends.com/cdn/" + gameVersion + "/img/profileicon/" + profileIconId + ".png",
		championName: championName,
		championId: championId,
		championIcon: "http://ddragon.leagueoflegends.com/cdn/" + gameVersion + "/img/champion/" + championImage,
		historyUrl: "https://matchhistory.eune.leagueoflegends.com/en/#match-details/" + region + "/" + historyUrl[historyUrl.length - 1],
		win: win,
		kda: parseInt(getKDA(kills, deaths, assists)),
		kills: kills,
		deaths: deaths,
		assists: assists,
		pentaKills: pentaKills,
		role: role,
		lane: lane,
		timestamp: timestamp,
		newGame: newGame,
	};
};

// Fuse summoner data with game data and assets
const calculateTheGame = async(summonerName, lastCheck) => {
	if(!gameVersion) {
		getLastGameVersion()
			.then(async version => gameVersion = version);
	}
	return await getLastGameStats(summonerName, lastCheck)
		.then(gameData => parseSummonerAndGameData(gameData))
		.catch(error => console.error(error));
};

//-------------------------------------------------------
// Discord methods
//-------------------------------------------------------


// We have to separate this method for reusing
const checkAllLolGamesAndSendMessage = (message) => {
	riotUserList.map(({summonerName, discordName, lastCheck}, key) => {
		setTimeout(() => {
			calculateTheGame(summonerName, lastCheck).then(game => {
				console.log("\nCheck.", game);
				// Spred values
				const { summonerName: sumName, timestamp, newGame } = game;
				// Update timestamp
				riotUserList[key]["lastCheck"] = timestamp;
				
				// Return if is not a new game
				if(newGame === false) return false;
				
				let { summonerIcon, championName, championIcon, win, kda, kills, deaths, assists, pentaKills, role, lane, historyUrl } = game;
				
				// Dont flame if kda is bigger than 1.3
				if(kda > 1.30) return false;
				message.channel.send({
				  "embed": {
					"title": randomFlameTitle(championName),
					"color": win ? 3986977 : 14033185,
					"description": "\n" + discordName + "```\n" + randomFlameMsg() + "```",
					"footer": {
					  "icon_url": "https://cdn.discordapp.com/app-icons/639964879738109994/9a39a3721ecf89e70d44834a1f4c8b00.png",
					  "text": "This was provided by KmicaBot"
					},
					"thumbnail": {
					  "url": championIcon
					},
					"author": {
					  "name": sumName,
					  "url": historyUrl,
					  "icon_url": summonerIcon
					},
					"fields": [{
						"name": "Kills",
						"value": kills,
						"inline": true
					  },{
						"name": "Deaths",
						"value": deaths,
						"inline": true
					  },{
						"name": "Assists",
						"value": assists,
						"inline": true
					  }]
				  }
				});
			});
		}, 2000 * key);
	});
};

// Add new user to LOL watcher list	
const addUserToLolWatchList = (command, prefix, param1, param2, message) => {
	if(command === prefix + 'lol-user-add') {
		// If there's no param
		if(!param1) return message.channel.send("To use this command send: `" + prefix + "lol-user-add` [@DISCORD-TAG] [SUMMONER-NAME]");
		
		// @TODO: Check if user is already in the list
		
		// Get summoner and discord name
		let summonerName = message.content.substring(15 + param1.length);
		let discordName = message.content.substring(5);
		
		// Prepare user object
		let newUser = {
			summonerName: summonerName,
			discordName: param1,
			lastCheck: 0,
		};
		
		// Push user object
		riotUserList.push(newUser);
		
		// Sed confirmation message that new user is added
		message.channel.send("New user added:\n\nSummoner name: " + summonerName + "\nDiscord user: " + discordName);
	}
};

// @TODO: Remove user for the list
const deleteUserFromLolWatchList = (command, prefix, param1, param2, message) => {
	if(command === prefix + 'lol-user-delete') return message.channel.send("This option is under development at the moment.");
};

// Set interval of LOL watcher
const setLolWatcherInterval = (command, prefix, param1, param2, message) => {
	if(command === prefix + 'lol-interval') {
		// If there's no param
		if(!param1) return message.channel.send("To use this command send: `!" + prefix + "lol-interval [MS-INTERVAL]`");
		// Send confirmation message
		message.channel.send("LOL watcher is enabled :eyes:");
		// Change interval
		riotIntervalValue = param1;
	}
};

// Print list of users that are currently watching
const getLolWatchUserList = (command, prefix, param1, param2, message) => {
	if(command === prefix + 'lol-user-list') {
		// Send user list to channel
		message.channel.send("User list:\n\n" + riotUserList.map((user) => { return user.summonerName + " - " + user.discordName + "\n" }).toString().replace(/,/g,''));
		// Console log them
		console.log(riotUserList)
	}
};

// Remove interval and disable LOL watcher
const stopLolWatcher = (command, prefix, param1, param2, message) => {
	if(command === prefix + 'lol-stop') {
		clearInterval(riotIntervalFunction);
		message.channel.send("LOL watcher is disabled :x:");
		console.log("\n-----STOPIRANO-----\n");
	}
};

// Start waching in defined intervals
const startLolWatcher = (command, prefix, param1, param2, message) => {
	if(command === prefix + 'lol-start') {
		riotIntervalFunction = setInterval(() => {
			checkAllLolGamesAndSendMessage(message);
		}, param1 || riotIntervalValue);	
    }
};

// Start waching in defined intervals
const instantLolWatcher = (command, prefix, param1, param2, message) => {
	if(command === prefix + 'lol-refresh') checkAllLolGamesAndSendMessage(message);
};

// Export functions for discord part
module.exports = {
	addUserToLolWatchList: addUserToLolWatchList,
	deleteUserFromLolWatchList: deleteUserFromLolWatchList,
	setLolWatcherInterval: setLolWatcherInterval,
	getLolWatchUserList: getLolWatchUserList,
	stopLolWatcher: stopLolWatcher,
	startLolWatcher: startLolWatcher,
	instantLolWatcher: instantLolWatcher
};