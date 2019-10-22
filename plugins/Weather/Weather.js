const Discord = require("../../CommandHandler2.js");
const weather = require('weather-js');

class weatherCl extends Discord.Command {
	constructor() {
        super("weather", [], "weather **location**", "get weather\n**location** is required.", true);
    }
	message(content, member, channel, guild, message, handler) {
		weather.find({search: content, degreeType: 'C'}, (err,res) => {
			if (res && res[0]) {
				channel.send(new Discord.RichEmbed().setTitle(`Weather: ${res[0].location.name}`).setDescription(`${Math.abs(parseFloat(res[0].location.lat))}°${parseFloat(res[0].location.lat) > 0 ? "N" : "S"}, ${Math.abs(parseFloat(res[0].location.long))}°${parseFloat(res[0].location.lat) > 0 ? "W" : "E"}`).addField("Temperature",`${Math.round(parseFloat(res[0].current.temperature)*1.8+32)}°F (${res[0].current.temperature}°C)\nFeels Like: ${parseFloat(res[0].current.feelslike)*1.8+32}°F (${res[0].current.feelslike}°C)\nHumidity:${res[0].current.humidity}%`, true).addField("Wind",res[0].current.winddisplay,true).setThumbnail(res[0].current.imageUrl))
			} else {
                channel.send(new Discord.RichEmbed().setTitle("Weather: Failed").setDescription("Location did not parse."));
            }
		});
	}
}

class WeatherPL extends Discord.Plugin {
    constructor() {
        super("Weather", "Weather Queries");
        this.addCommand(new weatherCl());
    }
}

module.exports.load = function(client) {
    client.addPlugin(new WeatherPL());
}
