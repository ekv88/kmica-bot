const settings = require('./config.json');
const https = require("https");
const fetch = require("node-fetch");

// Get from ENV or read from settings (Heroku and dev. env implementation)
const RIOT_KEY = process.env.RIOT_KEY || settings.ritoKey;
const FALLBACK_VERSION = process.env.FALLBACK_VERSION || "10.3.1";

// Global data
let championList;
let gameVersion = FALLBACK_VERSION;

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
}

// Get full info about game stats by gameId
const getGameData = async (gameId) => {
	const url = "https://eun1.api.riotgames.com/lol/match/v4/matches/" + gameId + "?api_key=" + RIOT_KEY;
	return await fetch(url)
		.then(res => res.json())
			.then(json => json)
				.catch(error => console.error("getGameData", error));
}

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
}

// Prettify data for simplear use later on Discord part
const parseSummonerAndGameData = async (gameData) => {
	// If this isn't new game dont pass all game data
	const { newGame } = gameData;
	if(newGame === false) return { ...gameData, newGame: newGame }
	
	// Spred all variables
	const { championId, profileIconId, summonerName, matchHistoryUri, timestamp, region, stats: { win, kills, deaths, assists, pentaKills }, timeline: { role, lane } } = gameData;
	
	// Await for champion list so we can normalize names
	championList = await getChampionList();
	
	let historyUrl = matchHistoryUri.split('/');
	const championName = await championList.find(x => x.key == championId)["name"]
	
	// @TODO: Build match history url later https://matchhistory.eune.leagueoflegends.com/en/#match-details/EUN1/2377040059/33254194
	// Return parsed data
	return {
		summonerName: summonerName,
		summonerIcon: "http://ddragon.leagueoflegends.com/cdn/" + gameVersion + "/img/profileicon/" + profileIconId + ".png",
		championName: championName,
		championId: championId,
		championIcon: "http://ddragon.leagueoflegends.com/cdn/" + gameVersion + "/img/champion/" + championName.replace(/[^0-9a-z]/gi, '') + ".png",
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
}

// Fuse summoner data with game data and assets
const calucalteTheGame = async(summonerName, lastCheck) => {
	if(!gameVersion) {
		getLastGameVersion()
			.then(async version => gameVersion = version);
	}
	return await getLastGameStats(summonerName, lastCheck)
		.then(gameData => parseSummonerAndGameData(gameData))
		.catch(error => console.error(error));
}

// Node process watcher
process.on('uncaughtException', function (err) {
    console.log(err);
});

// Export functions for discord part
module.exports = {
	// Might need to export more, but not looking forward to that
	// getLastGameStats: getLastGameStats,
	// parseSummonerAndGameData: parseSummonerAndGameData,
    calucalteTheGame: calucalteTheGame
}