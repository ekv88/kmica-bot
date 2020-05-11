const settings = require('../config.json');
const https = require("https");
const fetch = require("node-fetch");
const { importRiotUserList } = require('../data/ritoUserList.js');
const { randomFlameMsg, randomFlameTitle, randomColor, randomNumber } = require('./utils.js');

// Get from ENV or read from settings (Heroku and dev. env implementation)
const RIOT_KEY = process.env.RIOT_KEY || settings.ritoKey;
const RIOT_TFT_KEY = process.env.RIOT_TFT_KEY || settings.ritoTftKey;
const FALLBACK_VERSION = process.env.FALLBACK_VERSION || "10.9.1";

// Global variables
let championList;
let gameVersion;
let riotUserList = importRiotUserList;
let riotIntervalFunction;
let riotIntervalValue = 1000 * 60 * 10;
let riotTftIntervalFunction;
let riotTftIntervalValue = riotIntervalValue;

// Extract game versions
const getLastGameVersion = async () =>
	await fetch("https://ddragon.leagueoflegends.com/api/versions.json")
		.then(res => res.json())
			.then(json => json[0])
				.catch(error => {
					console.log(error);
					gameVersion = FALLBACK_VERSION;
				});

const getChampionList = async () =>
	await fetch("http://ddragon.leagueoflegends.com/cdn/" + gameVersion + "/data/en_US/champion.json")
		.then(res => res.json())
			.then(json => Object.keys(json.data).map((k) => json.data[k]));

// Extract data like accountId, avatar, lvl from summoner name
const getSummonerDataBySummonerName = async (summonerName) => {
    const url = "https://eun1.api.riotgames.com/lol/summoner/v4/summoners/by-name/" + encodeURI(summonerName) + "?api_key=" + RIOT_KEY;
	return await fetch(url)
		.then(res => res.json())
			.then(json => json)
				.catch(error => console.error("getSummonerDataBySummonerName", error));
};

// Get match history by accountId
const getMatchesBySummonerAccountId = async (accountId) => {
	const url = "https://eun1.api.riotgames.com/lol/match/v4/matchlists/by-account/" + accountId + "?api_key=" + RIOT_KEY;
	return await fetch(url)
		.then(res => res.json())
			.then(json => json)
				.catch(error => console.error("getMatchesBySummonerAccountId", error));
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
const getKDA = (kills, deaths, assists) =>
	((parseInt(kills) + parseInt(assists)) / parseInt(deaths == 0 ? 1 : deaths)).toFixed(2);

// Combine all methods to return spcific user gamme stats data
const getLastGameStats = async (summonerName, lastCheck) => {
	// Get summoner data by summoner name
	const summoner = await getSummonerDataBySummonerName(summonerName);
	// Extract needed variables from summoner data
	const { accountId, summonerLevel } = summoner;
	// Extract all match history using accountId
	const matches = await getMatchesBySummonerAccountId(accountId);
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
		kda: getKDA(kills, deaths, assists),
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
// TFT methods
//-------------------------------------------------------

// Extract data like accountId, avatar, lvl from summoner name
const getSummonerTftDataBySummonerName = async (summonerName) => {
	const url = "https://eun1.api.riotgames.com/tft/summoner/v1/summoners/by-name/" + encodeURI(summonerName) + "?api_key=" + RIOT_TFT_KEY;
	return await fetch(url)
		.then(res => res.json())
		.then(json => json)
		.catch(error => console.error("getSummonerDataBySummonerName", error));
};

// Get match history by accountId
const getTftMatchesBySummonerAccountId = async (puuid) => {
	const url = "https://europe.api.riotgames.com/tft/match/v1/matches/by-puuid/" + puuid + "/ids?count=5&api_key=" + RIOT_TFT_KEY;
	return await fetch(url)
		.then(res => res.json())
		.then(json => json)
		.catch(error => console.error("getTftMatchesBySummonerAccountId", error));
};

// Get full info about game stats by gameId
const getTftGameData = async (gameId) => {
	const url = "https://europe.api.riotgames.com/tft/match/v1/matches/" + gameId + "?api_key=" + RIOT_TFT_KEY;
	return await fetch(url)
		.then(res => res.json())
		.then(json => json)
		.catch(error => console.error("getTftGameData", error));
};

const getLastTftGameStats = async (summonerName, lastCheckTft) => {
	// Get summoner data by summoner name
	const summoner = await getSummonerTftDataBySummonerName(summonerName);
	// Extract needed variables from summoner data
	const { accountId, puuid } = summoner;
	// Extract all match history using accountId
	const matches = await getTftMatchesBySummonerAccountId(puuid);
	// If there's no any matches return without new game
	if(await matches.length === 0 || await matches.status) return {...summoner, summonerName: summonerName, newGame: false };
	// Select last game
	const lastMatchId = await matches[0];
	// Get last game data
	const { info: lastGameData } = await getTftGameData(lastMatchId)
	// Extract participant using Riot's ppuid
	const participantData = await lastGameData.participants.filter(x => x.puuid == puuid)[0];
	// Check if this game was already used
	if(lastCheckTft >= lastGameData.game_datetime) return {...participantData, ...summoner, summonerName: summonerName, newGame: false };
	// Return parsed data for next function
	return {...participantData, ...summoner, summonerName: summonerName, newGame: true}
};

const parseTftGameData = async (gameData) => {
	const { summonerName, profileIconId, gold_left, last_round, level, placement, players_eliminated, total_damage_to_players, traits } = gameData;

	console.log(summonerName + " - TFT check")

	const traitName = (name) => name.replace(/Set3_/g,"").toLowerCase();

	const sortTraits = traits ? traits.filter(trait => tft3Names[traitName(trait.name)] !== undefined).sort((a, b) => (a.num_units > b.num_units) ? -1 : 1) : null

	return {
		...gameData,
		summonerName: summonerName,
		summonerIcon: "http://ddragon.leagueoflegends.com/cdn/" + gameVersion + "/img/profileicon/" + profileIconId + ".png",
		gold_left: gold_left,
		lasted: last_round,
		level: level,
		placement: placement,
		eliminated: players_eliminated,
		totalDmg: total_damage_to_players,
		mainTrait: sortTraits ? traitName(sortTraits[0].name) : null,
		traits: sortTraits ?
			sortTraits.filter(trait => tft3Names[traitName(trait.name)] !== undefined)
				.sort((a, b) => (a.num_units > b.num_units) ? -1 : 1)
					.map(({name, num_units}) => ({
						name: tft3Names[traitName(name)].icon + " (" + num_units + ")",
						value: tft3Names[traitName(name)].name,
						inline: true,
					})) : null
	}
}

// Fuse summoner data with game data and assets
const calculateTheTftGame = async(summonerName, lastCheck) => {
	if(!gameVersion) {
		getLastGameVersion()
			.then(async version => gameVersion = version)
				.catch(error => console.log(error));
	}
	return await getLastTftGameStats(summonerName, lastCheck)
		.then(async gameData => parseTftGameData(gameData))
			.catch(error => console.error(error));
};

const tft3Names = {
	"blaster": { name: "Blaster", icon: "<:blaster:709237931025498184>" },
	"chrono": { name: "Chrono", icon: "<:chrono:709237949627367526>" },
	"cybernetic": { name: "Cybernetic", icon: "<:cybernetic:709237972427472906>" },
	"rebel": { name: "Rabel", icon: "<:rebel:709237972372815872>" },
	"blademaster": { name: "Blademaster", icon: "<:blademaster:709240564125794315>" },
	"brawler": { name: "Brawler", icon: "<:brawler:709240564024999958>" },
	"void": { name: "Void", icon: "<:void:709241634860171324>" },
	"spacepirate": { name: "Space Pirate", icon: "<:spacepirate:709237972423409684>" },
	"darkstar": { name: "Dark Star", icon: "<:darkstar:709237972368621579>" },
	"protector": { name: "Protector", icon: "<:protector:709237972372815933>" },
	"celestial": { name: "Celestial", icon: "<:celestial:709237941922299905>" },
	"sniper": { name: "Sniper", icon: "<:sniper:709237972318552085>" },
	"starguardian": { name: "Star Guardian", icon: "<:starguardian:709237972381466755>" },
	"vanguard": { name: "Vanguard", icon: "<:vanguard:709237972117225544>" },
	"infiltrator": { name: "Infiltrator", icon: "<:infiltrator:709237972364427364>" },
	"manareaver": { name: "Mana Reaver", icon: "<:manareaver:709237972137934910>" },
	"mercenary": { name: "Mercenary", icon: "<:mercenary:709237972368883794>" },
	"valkyrie": { name: "Valkyrie", icon: "<:valkyrie:709237973119402094>" },
	"starship": { name: "Star ship", icon: "<:starship:709237972372815963>" },
	"mechpilot": { name: "Mech Pilot", icon: "<:mechpilot:709237972389724181>" },
};

const tftPlacementTitles = (place) => {
	let placement = [
		['Vrati Srxu cit', 'Ajdeeee beeee booo', 'Svaka dala momce'],
		['I tvoja devojka uvek druga zavrsi', 'I roditeljima si bio drugo omiljeno dete, moze i u TFT-u', 'Nisi update cit, izasao danas novi patch'],
		['Ne jednom, ne dvaput, tri puta te, Beograd, Beograd', 'Pa da budemo realni, ovo je jedina trojka koju ces videti', ''],
		['Klasicno provlacenje', 'Za malo nazad u bronzu a?'],
		['5. mesto i 5 IQ-a, slucajnost?', 'Jedan korak napred, 5 nazad?'],
		['Kakav na fakultetu, takav i na TeFTu OJSAAA!', 'Steta sto TFT nema tutorijal jer ti je preko potreban'],
		['Da umes da igras ovo se ne bi desilo', 'Ovo je apeks tvojih mogucnosti', 'E to trazis pesmu od EKV-a 7. dana?'],
		['"TFT" je kod tebe skrace od "Total Fuck Tard"', 'I nisam imao veca ocekivanja za tebe', 'Opet brukas sebe i svoje i sve nas ovde?', 'Pa dobro i ribi si bio 8. pa se volite'],
	];

	return placement[place - 1][randomNumber(placement[place - 1].length)]
}

const tftTraitMessages = (trait) => {
	let messages = {
		"blaster": ['Msg1', 'Msg2'],
		"chrono": ['Mnogo spida tuces tebrice, smanji malo.', 'Brzina ti sprzila mozak dabogda.', 'Garage sale Kejtlin, lol.'],
		"cybernetic": ['Carry Ekko? Na mom si se peko.', 'Lucigan blasts your ass?', 'Imas crnca u kompu, lol'],
		"rebel": ['Msg1', 'Msg2'],
		"blademaster": ['Msg1', 'Msg2'],
		"brawler": ['Msg1', 'Msg2'],
		"void": ['You hentai weirdo.', 'Msg2'],
		"spacepirate": ['Msg1', 'Msg2'],
		"darkstar": ['Msg1', 'Msg2'],
		"protector": ['Msg1', 'Msg2'],
		"celestial": ['Msg1', 'Msg2'],
		"sniper": ['Msg1', 'Msg2'],
		"starguardian": ['Msg1', 'Msg2'],
		"vanguard": ['Leona nema muda.', 'He protec but he dont attac','Msg2'],
		"infiltrator": ['Infiliteretardore igras m?', 'Msg2'],
		"manareaver": ['Msg1', 'Msg2'],
		"mercenary": ['Msg1', 'Msg2'],
		"valkyrie": ['Msg1', 'Msg2'],
		"starship": ['Msg1', 'Msg2'],
		"mechpilot": ['Msg1', 'Msg2'],
	}

	return messages[trait] ? messages[trait][randomNumber(messages[trait].length)] : trait;
}

//-------------------------------------------------------
// Discord methods - TFT
//-------------------------------------------------------

// We have to separate this method for reusing
const checkAllTftGamesAndSendMessage = (message) => {
	riotUserList.map(({summonerName, discordName, lastCheck}, key) => {
		// if(key > 0) return false;
		setTimeout(() => {
			calculateTheTftGame(summonerName, lastCheck).then(game => {
				// console.log("\nCheck.", game);
				// Spred values
				const { summonerName: sumName, timestamp, newGame, summonerIcon, traits, placement, mainTrait } = game;
				// Update timestamp
				riotUserList[key]["lastCheck"] = timestamp;

				// Return if is not a new game
				if(newGame === false) return false;

				if(placement < 4 && !traits) return false;

				message.channel.send({
					"embed": {
						"title": tftPlacementTitles(placement),
						"color": randomColor(),
						"description": "Zavrsio na **" + placement + ".** mestu, " + discordName + "\n```" + tftTraitMessages(mainTrait) + "```" + mainTrait,
						"footer": {
							"icon_url": "https://cdn.discordapp.com/app-icons/639964879738109994/9a39a3721ecf89e70d44834a1f4c8b00.png",
							"text": "This was provided by Kmica Bot"
						},
						"thumbnail": {
							"url": summonerIcon
						},
						"author": {
							"name": sumName,
							"icon_url": summonerIcon
						},
						"fields": traits
					}
				});
			});
		}, 2000 * key);
	});
};

// Set interval of TFT watcher
const setTftWatcherInterval = (command, prefix, param1, param2, message) => {
	if(command === prefix + 'lol-interval') {
		// If there's no param
		if(!param1) return message.channel.send("To use this command send: `!" + prefix + "lol-interval [MS-INTERVAL]`");
		// Send confirmation message
		message.channel.send("TFT watcher is enabled :eyes:");
		// Change interval
		riotTftIntervalValue = param1;
	}
};

// Remove interval and disable TFT watcher
const stopTftWatcher = (command, prefix, param1, param2, message) => {
	if(command === prefix + 'tft-stop') {
		clearInterval(riotTftIntervalFunction);
		message.channel.send("TFT watcher is disabled :x:");
	}
};

// Start watching in defined intervals
const startTftWatcher = (command, prefix, param1, param2, message) => {
	if(command === prefix + 'tft-start') {
		riotTftIntervalFunction = setInterval(() => {
			checkAllTftGamesAndSendMessage(message);
		}, param1 || riotTftIntervalValue);
	}
};

// Start watching in defined intervals
const instantTftWatcher = (command, prefix, param1, param2, message) => {
	if(command === prefix + 'tft-refresh') checkAllTftGamesAndSendMessage(message);
};

//-------------------------------------------------------
// Discord methods - LOL
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
					  "text": "This was provided by Kmica Bot"
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

// Remove user for the list
const deleteUserFromLolWatchList = (command, prefix, param1, param2, message) => {
	if(command === prefix + 'lol-user-delete') {
		riotUserList = riotUserList.filter(user => user.summonerName != param1);
		return message.channel.send("Summoner removed form list");
	}
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

// Start watching in defined intervals
const startLolWatcher = (command, prefix, param1, param2, message) => {
	if(command === prefix + 'lol-start') {
		riotIntervalFunction = setInterval(() => {
			checkAllLolGamesAndSendMessage(message);
		}, param1 || riotIntervalValue);	
    }
};

// Start watching in defined intervals
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
	instantLolWatcher: instantLolWatcher,
	setTftWatcherInterval: setTftWatcherInterval,
	startTftWatcher: startTftWatcher,
	stopTftWatcher: stopTftWatcher,
	instantTftWatcher: instantTftWatcher,
};