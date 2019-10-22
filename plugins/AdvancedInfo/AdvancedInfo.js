const Discord = require("../../CommandHandler2.js");

class AIListRoles extends Discord.Command {
    constructor() {
        super("ailistroles", [], "ailistroles", "list all server roles by id", false);
    }
    message(content, member, channel, guild, message, handler) {
        let roles = [];
        guild.roles.forEach(role => {
            if (roles.join("\n").length >= 2048) {
                channel.send(new Discord.RichEmbed().setDescription(roles.slice(0,roles.length-1).join("\n")));
                roles = [roles[roles.length-1]];
            }
            roles.push(`${role}: ${role.id}`);
		});
        if (roles.join("\n").length >= 2048) {
            channel.send(new Discord.RichEmbed().setDescription(roles.slice(0,roles.length-1).join("\n")));
            roles = [roles[roles.length-1]];
        }
        channel.send(new Discord.RichEmbed().setDescription(roles.join("\n")));
    }
}

class AdvancedInfo extends Discord.Plugin {
    constructor() {
        super("AdvancedInfo", "Guild information and id info more easily visible.");
        this.addCommand(new AIListRoles());
    }
}

module.exports.load = function(client) {
    client.addPlugin(new AdvancedInfo());
}
