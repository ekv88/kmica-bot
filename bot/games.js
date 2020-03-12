const gameCahHelp = (command, prefix, param1, param2, { message: { channel: { send } } }) => {
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
}
const gameMemeHelp = (command, prefix, param1, param2, { message: { channel: { send } } }) => {
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
}