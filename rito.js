const settings = require('./config.json');
const https = require("https");
const fetch = require("node-fetch");
const RIOT_KEY = settings.ritoKey;

// Global data
let { championList, gameVersion } = {};

// Methods
//-----------------------------------------------

// Extract game versions
const getLastGameVersion = async () =>
	await fetch("https://ddragon.leagueoflegends.com/api/versions.json")
		.then(res => res.json())
		.then(json => json[0]);

const getChampionList = async () =>
	await fetch("http://ddragon.leagueoflegends.com/cdn/" + gameVersion  + "/data/en_US/champion.json")
		.then(res => res.json())
		.then(json => Object.keys(json.data).map((k) => json.data[k]));

// Extract data like accountId, avatar, lvl from summoner name
const getSummonerDataBySummonerName = async (summonerName) => {
    const url = "https://eun1.api.riotgames.com/lol/summoner/v4/summoners/by-name/" + summonerName + "?api_key=" + RIOT_KEY;
	return await fetch(url)
		.then(res => res.json())
		.then(json => json);
};

// Get match history by accountId
const getMatchesBySumonerAccountId = async (accountId) => {
	const url = "https://eun1.api.riotgames.com/lol/match/v4/matchlists/by-account/" + accountId + "?api_key=" + RIOT_KEY;
	return await fetch(url)
		.then(res => res.json())
		.then(json => json);
}

// Get full info about game stats by gameId
const getGameData = async (gameId) => {
	const url = "https://eun1.api.riotgames.com/lol/match/v4/matches/" + gameId + "?api_key=" + RIOT_KEY;
	return await fetch(url)
		.then(res => res.json())
		.then(json => json);
}

// Calculate KDA (Kills, Deaths, Assists) = K + A / D
const getKDA = (kills = 0, deaths = 0, assists = 0) => 
	((parseInt(kills) + parseInt(assists)) / deaths).toFixed(2);

// Combine all methods to return spcific user gamme stats data
const getLastGameStats = async (summonerName) => {
	// Get summoner data by summoner name
	const summoner = await getSummonerDataBySummonerName(summonerName);
	// Extract needed variables from summoner data
	const { accountId, summonerLevel } = summoner;
	// Extract all match history using accountId
	const matches = await getMatchesBySumonerAccountId(accountId);
	// Select last game from match history and look for data.
	const lastGameData = await getGameData(matches.matches[0].gameId);
	// ------
	// @TODO: Check later if last game timestamp was already used and if it is exit process.
	// ------
	// Extract participantId (temp ID in game) form "participantIdentities" so we can look for data only with that ID
	const participantId = await lastGameData.participantIdentities.filter(x => x.player.accountId == accountId)[0].participantId;
	// Extract stat only for player we are interested in
	return lastGameData.participants.filter(x => x.participantId == participantId)[0];
}



// Execute
//-----------------------------------------------

const printStats = (gameData, summonerName) => {
	// console.log(gameData);
	const { championId, stats: { win, kills, deaths, assists }, timeline: { role, lane } } = gameData;

	console.log("\n\n\n\n-------------------------- LAST GAME STATS ----------------------------");
	console.log("Summoner name: " + summonerName);
	console.log("Champion: " + championList.find(x => x.key == championId)["name"]);
	console.log("Win: " + win);
	console.log("KDA: " + getKDA(kills, deaths, assists));
	console.log("Kills: " + kills);
	console.log("Deaths: " + deaths);
	console.log("Assists: " + assists);
	console.log("Role: " + role);
	console.log("Lane: " + lane);
	console.log("-----------------------------------------------------------------------\n\n\n\n");
}

const calucalteTheGame = async (summonerName) => {
	if(!gameVersion) {
		getLastGameVersion().then(async version => {
			gameVersion = version;
			console.log("Current game vaersion: " + version)
			championList = await getChampionList();
			getLastGameStats(summonerName)
				.then(gameData => printStats(gameData, summonerName));
		});
	} else {
		getLastGameStats(summonerName)
			.then(gameData => printStats(gameData, summonerName));
	}
}

calucalteTheGame('ProblematicSushi')

process.on('uncaughtException', function (err) {
    console.log(err);
}); 