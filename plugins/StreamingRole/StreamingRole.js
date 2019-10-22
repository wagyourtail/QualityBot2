const Discord = require("../../CommandHandler2.js");

class StreamRole extends Discord.Command {
    constructor() {
        super("streamrole", [], "streamrole **role**", "sets a role to change anyone to if they are streaming.\n**role** is required and must be a role resolvable.", false);
    }
    message(content, author, channel, guild, message, handler) {
        const role = content.match(/[^\d]*(\d+).*/);
        const reply = new Discord.RichEmbed()
            .setTitle("StreamingRole: ");
        if (role && guild.roles.has(role[1])) {
            handler.database.setGuildPluginData(guild.id, this.plugin, {id:role[1]});
            reply.addField("Success", `Successfully set ${guild.roles.get(role[1])} as the streaing role.`);
        } else {
            reply.addField("Fail", "Could not parse **role**.");
        }
        channel.send(reply);
    }
}

class StreamingRolePL extends Discord.Plugin {
    constructor() {
        super("StreamingRole", "Give users a role whenever they are streaming.");
        this.addCommand(new StreamRole);
    }
}

module.exports.load = function(client) {
    client.addPlugin(new StreamingRolePL());

    client.on('presenceUpdate', (oldMember, newMember) => {
        client.database.getGuild(newMember.guild.id, clent.prefix).then(response => {
            if (newMember.presence.game && newMember.presence.game.streaming) {
                client.database.getGuildPluginData(newMember.guild.id, "StreamingRole", {id:null}).then(response => {
                    if (response.id) newMember.addRole(response.id, "Streaming");
                });
            } else if (oldMember.presence.game && oldMember.presence.game.streaming) {
                client.database.getGuildPluginData(newMember.guild.id, "StreamingRole", {id:null}).then(response => {
                    if (response.id) newMember.removeRole(response.id, "No Longer Streaming");
                });
            }
        });
    });
}
