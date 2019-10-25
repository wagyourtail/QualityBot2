const Discord = require("../../CommandHandler2.js");

class LFPCategory extends Discord.Command {
    constructor() {
        super("lfpcategory", [], "lfpcategory `channel`", "set category to use for LookingForPlayers.\n`channel` is optional and must be in the category you want for LookingForPlayers to use, if not provided message must be sent in the text channel you want.", false);
    }
    message(content, member, channel, guild, message, handler) {
        const id = content.match(/[^\d]*(\d+).*/);
        const reply = new Discord.RichEmbed()
            .setTitle("LookingForPlayers: Category");
        let parent = channel.parentID;
        if (id && guild.channels.get(id[1]).parentID) parent = guild.channels.get(id[1]).parentID;
        if (guild.channels.get(parent) && guild.channels.get(parent).type == 'category') {
            handler.database.setGuildPluginData(guild.id, this.plugin, {id:parent});
            reply.addField("Success", `category set to ${guild.channels.get(parent)}`);
        } else {
            reply.addField("Fail", "channel is not in a category.");
        }
        channel.send(reply);
    }
}

class LFPSetGame extends Discord.Command {
    constructor() {
        super("lfpsetgame", [], "lfpsetgame **game**", "set name of voice channels in the category defined by lfpcategory", true);
    }
    message(content, member, channel, guild, message, handler) {
        handler.database.getGuildPluginData(guild.id, "LookingForPlayers", {id:null}).then(response => {
            if (response.id && member.voiceChannel && member.voiceChannel.parentID == response.id) {
                member.voiceChannel.setName(content);
            }
        });
    }
}

class LookingForPlayersPL extends Discord.Plugin {
    constructor() {
        super("LookingForPlayers", "Auto voice channel creation inside a category. to setup create a category, give it a text channel and a voice channel, then do the `lfpcategory` command in the text channel in the category");
        this.addCommand(new LFPCategory());
        this.addCommand(new LFPSetGame());
    }
}

module.exports.load = function (client) {
	client.addPlugin(new LookingForPlayersPL());

	client.on('voiceStateUpdate', (oldMember, newMember) => {
        client.database.getGuild(newMember.guild.id, client.prefix).then(response => {
            if (response.enabled.includes("LookingForPlayers")) {
                client.database.getGuildPluginData(newMember.guild.id, "LookingForPlayers", {id:null}).then(response => {
                    if (response.id && newMember) {
                        if (newMember.voiceChannel && newMember.voiceChannel.parentID == response.id) {
                            if (newMember.voiceChannel.members.size == 1 && (!oldMember.voiceChannel || oldMember.voiceChannel.id != newMember.voiceChannel.id)) {
                                if (newMember.presence.game) newMember.voiceChannel.setName(newMember.presence.game.name);
                                newMember.guild.createChannel("Looking For Players", { type: 'voice', parent: response.id });
                            }
                        }
                        if (oldMember.voiceChannel && oldMember.voiceChannel.parentID == response.id) {
                            oldMember.voiceChannel.setName("Looking For Players");
                            const empty = Array.from(oldMember.voiceChannel.parent.children.filter(child => child.type == 'voice' && !child.members.size).values());
                            empty.pop();
                            empty.forEach(channel => {
                                channel.delete("empty LookingForPlayers channel");
                            });
                        }
                    }
                });
            }
        });
	});
}
