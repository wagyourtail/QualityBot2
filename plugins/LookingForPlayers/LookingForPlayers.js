const Discord = require("../../CommandHandler2.js");

class LFPCategory extends Discord.Command {
    constructor() {
        super("lfpcategory", [], "lfpcategory `channel`", "set category to use for LookingForPlayers.\n`channel` is optional and must be in the category you want for LookingForPlayers to use, if not provided message must be sent in the text channel you want.", false);
    }
    message(content, member, channel, guild, message, handler) {
        const id = content.match(/[^\d]*(\d+).*/);
        const reply = new Discord.RichEmbed()
            .setTitle("LookingForPlayers: Category");
        let parent = channel.parent;
        if (id) parent = guild.channels.resolve(id[1])?.parent;
        if (guild.channels.resolve(parent)) {
            handler.database.setGuildPluginData(guild.id, this.plugin, {id:parent.id});
            reply.addField("Success", `category set to ${parent}`);
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

	client.on('voiceStateUpdate', (oldState, newState) => {
        client.database.getGuild(newState.guild.id, client.prefix).then(response => {
            if (response.enabled.includes("LookingForPlayers")) {
                client.database.getGuildPluginData(newState.guild.id, "LookingForPlayers", {id:null}).then(response => {
                    if (response.id && newState) {
                        if (newState.channel?.parent?.id == response.id) {
                            if (newState.channel.members.size == 1 && (newState.channelID != oldState?.channelID)) {
                                for (const activity of newState.member.presence.activities) {
                                    if (activity.type == "PLAYING") newState.channel.setName(activity.name);
                                }
                                newState.guild.channels.create(newState.channel.parent.name, { type: 'voice', parent: response.id });
                            }
                        }
                    }
                    if (response.id && oldState.channel?.parent?.id == response.id) {
                        const empty = Array.from(oldState.channel.parent.children.filter(child => child.type == 'voice' && !child.members.size).values());

                        empty.pop().setName(oldState.channel.parent.name);
                        empty.forEach(channel => {
                            channel.delete("empty LookingForPlayers channel");
                        });
                    }
                });
            }
        });
	});
}
