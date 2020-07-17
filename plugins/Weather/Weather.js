const Discord = require("../../CommandHandler2.js");
const weather = require('weather-js');

class weatherCl extends Discord.Command {
	constructor() {
        super("weather", [], "weather **location**", "get weather\n**location** is required.", true);
    }
	message(content, member, channel, guild, message, handler) {
		weather.find({search: content, degreeType: 'C'}, (err,res) => {
			if (res && res[0]) {
				channel.send(new Discord.RichEmbed().setTitle(`Weather: ${res[0].location.name}`).setDescription(`${Math.abs(parseFloat(res[0].location.lat))}°${parseFloat(res[0].location.lat) > 0 ? "N" : "S"}, ${Math.abs(parseFloat(res[0].location.long))}°${parseFloat(res[0].location.lat) > 0 ? "W" : "E"}\n\n${res[0].current.skytext}`).addField("Temperature",`${Math.round(parseFloat(res[0].current.temperature)*1.8+32)}°F (${Math.round(res[0].current.temperature)}°C)\nFeels Like: ${Math.round(parseFloat(res[0].current.feelslike)*1.8+32)}°F (${Math.round(res[0].current.feelslike)}°C)\nHumidity:${Math.round(res[0].current.humidity)}%`, true).addField("Wind",res[0].current.winddisplay,true).setThumbnail(res[0].current.imageUrl))
                    .then(mes => {
                        handler.database.getGuildPluginData(guild.id, this.plugin, {deleteMessages:true}).then((response) => {
                            if (response.deleteMessages) {
                                mes.delete({ timeout: 20 * 1000 });
                                message.delete({ timeout: 20 * 1000 });
                            }
                        });
                    });
			} else {
                channel.send(new Discord.RichEmbed().setTitle("Weather: Failed").setDescription("Location did not parse."))
                    .then(mes => {
                        handler.database.getGuildPluginData(guild.id, this.plugin, {deleteMessages:true}).then((response) => {
                            if (response.deleteMessages) {
                                mes.delete({ timeout: 20 * 1000 });
                                message.delete({ timeout: 20 * 1000 });
                            }
                        });
                    });
            }
		});
	}
}

class weatherDelete extends Discord.Command {
    constructor() {
        super("weatherautodelete", [], "weatherautodelete", "toggles delete of weather messages after 20 seconds.", false);
    }
    message(content, member, channel, guild, message, handler) {
        handler.database.getGuildPluginData(guild.id, this.plugin, {deleteMessages:true}).then((response) => {
            response.deleteMessages = !response.deleteMessages;
            handler.database.setGuildPluginData(guild.id, this.plugin, response);
            channel.send(new Discord.RichEmbed("Weather Auto Delete").addField("Toggled", response.deleteMessages ? "On." : "Off."));
        });
    }
}

class WeatherPL extends Discord.Plugin {
    constructor() {
        super("Weather", "Weather Queries");
        this.addCommand(new weatherCl());
        this.addCommand(new weatherDelete());
    }
}

module.exports.load = function(client) {
    client.addPlugin(new WeatherPL());
}
