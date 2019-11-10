const Discord = require("../../CommandHandler2.js");

class AIListRoles extends Discord.Command {
    constructor() {
        super("ailistroles", [], "ailistroles", "list all server roles by id", false);
    }
    message(content, member, channel, guild, message, handler) {
        let roles = [];
        let size = guild.roles.size;
        guild.roles.forEach(role => {
            roles.push(`**${role.position}.** ${role}: ${role.id}`);
		});
        roles.sort((a, b) => a.match(/(\d+)/)[1] - b.match(/(\d+)/)[1]);
        while (roles.join("\n").length >= 2048) {
            for (let i = roles.length; roles.slice(0,i).join("\n").length >= 2048; i--) {}
            channel.send(new Discord.RichEmbed().setDescription(roles.slice(0,i).join("\n")));
            roles.slice(i);
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
