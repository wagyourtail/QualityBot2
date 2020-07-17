const Discord = require("../../CommandHandler2.js");

class StreamRole extends Discord.Command {
    constructor() {
        super("streamrole", [], "streamrole **role**", "sets a role to change anyone to if they are streaming.\n**role** is required and must be a role resolvable.", false);
    }
    message(content, member, channel, guild, message, handler) {
        const role = content.match(/[^\d]*(\d+).*/);
        const reply = new Discord.RichEmbed()
            .setTitle("StreamingRole: ");
        const roleR = guild.roles.resolve(role[1]);
        if (roleR) {
            handler.database.setGuildPluginData(guild.id, this.plugin, {id:role[1]});
            reply.addField("Success", `Successfully set ${roleR} as the streaing role.`);
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

    client.on('presenceUpdate', (oldp, newp) => {
        client.database.getGuild(newMember.guild.id, client.prefix).then(response => {
            if (response.enabled.includes("StreamingRole")) {
                if (newp.game?.streaming) {
                    client.database.getGuildPluginData(newp.member.guild.id, "StreamingRole", {id:null}).then(response => {
                        if (response.id) newp.member.roles.add(response.id, "Streaming");
                    });
                } else if (oldp.game?.streaming) {
                    client.database.getGuildPluginData(newp.member.guild.id, "StreamingRole", {id:null}).then(response => {
                        if (response.id) newp.member.roles.remove(response.id, "No Longer Streaming");
                    });
                }
            }
        });
    });
}
