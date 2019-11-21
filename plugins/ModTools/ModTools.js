const Discord = require("../../CommandHandler2.js");

class LogChannel extends Discord.Command {
    constructor() {
        super("logchannel", [], "logchannel **#channel**", "set channel for logging, \n**channel** is required (or dont type it to disable).", false);
    }
    message(content, member, channel, guild, message, handler) {
        handler.database.getGuildPluginData(guild.id, this.plugin, {logChannel:null, muteRole:null}).then((response) => {
            const match = content.match(/[^\d]*(\d+)/);
            if (!match) response.logChannel = null;
            else response.logChannel = match[1];
            channel.send(new Discord.RichEmbed().setTitle("Log Channel").setDescription(`Log Channel set to ${match ? guild.channels.get(match[1]) : "`none`"}.`));
            handler.database.setGuildPluginData(guild.id, this.plugin, response);
        });
    }
}

class MuteRole extends Discord.Command {
    constructor() {
        super("muterole", [], "muterole **role**", "set role for muting people, \n**role** is required and must be a role resolvable (@role or id).", false);
    }
    message(content, member, channel, guild, message, handler) {
        handler.database.getGuildPluginData(guild.id, this.plugin, {logChannel:null, muteRole:null}).then((response) => {
            const match = content.match(/[^\d]*(\d+)/);
            if (!match) response.muteRole = null;
            else response.muteRole = guild.roles.has(match[1]) ? match[1] : null;
            channel.send(new Discord.RichEmbed().setTitle("Mute Role").setDescription(`Mute Role set to ${response.muteRole ? guild.roles.get(match[1]) : "`none`"}.`));
            handler.database.setGuildPluginData(guild.id, this.plugin, response);
        });
    }
}

class Mute extends Discord.Command {
    constructor() {
        super("mute", [], "mute **@person** **time** `reason`", "mute people if muterole is set.\n**@person** is required and must be a mention (or user id).\n`reason` optional reason for mute.");
    }
    message(content, member, channel, guild, message, handler) {
        handler.database.getGuildPluginData(guild.id, this.plugin, {logChannel:null, muteRole:null}).then((response) => {
            const match = content.match(/[^\d]*(\d+)(?:$|.+?\s*(.*))/);
            if (match) {
                if (!response.muteRole) {
                    channel.send(new Discord.RichEmbed().setTitle("Mute").setDescription("Failed, mute role not set."));
                    return;
                }
                if (guild.members.has(match[1])) {
                    const reply = new Discord.RichEmbed().setTitle("Mute").setDescription(`Successfully muted ${guild.members.get(match[1])}.`);
                    if (match[2]) reply.addField("Reason: ", match[2]);
                    guild.members.get(match[1]).addRole(response.muteRole);
                    channel.send(reply);
                    if (response.logChannel && guild.channels.has(response.logChannel)) guild.channels.get(response.logChannel).send(reply.setDescription(`${member} Successfully muted ${guild.members.get(match[1])} (**${guild.members.get(match[1]).user.tag}**).`));
                } else {
                    channel.send(new Discord.RichEmbed().setTitle("Mute").setDescription("Failed, user does not exist."));
                }
            } else {
                channel.send(new Discord.RichEmbed().setTitle("Mute").setDescription("Failed to parse message."));
            }
        });
    }
}

class UnMute extends Discord.Command {
    constructor() {
        super("unmute", [], "unmute **@person** **time** `reason`", "unmute people if muterole is set.\n**@person** is required and must be a mention (or user id).\n`reason` optional reason for unmute.");
    }
    message(content, member, channel, guild, message, handler) {
        handler.database.getGuildPluginData(guild.id, this.plugin, {logChannel:null, muteRole:null}).then((response) => {
            const match = content.match(/[^\d]*(\d+)(?:$|.+?\s*(.*))/);
            if (match) {
                if (!response.muteRole) {
                    channel.send(new Discord.RichEmbed().setTitle("UnMute").setDescription("Failed, mute role not set."));
                    return;
                }
                if (guild.members.has(match[1])) {
                    const reply = new Discord.RichEmbed().setTitle("UnMute").setDescription(`Successfully unmuted ${guild.members.get(match[1])}.`);
                    if (match[2]) reply.addField("Reason: ", match[2]);
                    guild.members.get(match[1]).removeRole(response.muteRole);
                    channel.send(reply);
                    if (response.logChannel && guild.channels.has(response.logChannel)) guild.channels.get(response.logChannel).send(reply.setDescription(`${member} Successfully unmuted ${guild.members.get(match[1])} (**${guild.members.get(match[1]).user.tag}**).`));
                } else {
                    channel.send(new Discord.RichEmbed().setTitle("UnMute").setDescription("Failed, user does not exist."));
                }
            } else {
                channel.send(new Discord.RichEmbed().setTitle("UnMute").setDescription("Failed to parse message."));
            }
        });
    }
}

class Prune extends Discord.Command {
    constructor() {
        super("prune", [], "prune **length**", "deletes the last **length** messages.\n**length** is required.", false);
    }
    message(content, member, channel, guild, message, handler) {
        const match = content.match(/[^\d]*(\d+)/);
        if (match) {
            channel.bulkDelete(parseInt(match[1]) + 1, true);
            channel.send(new Discord.RichEmbed().setTitle("Prune").setDescription(`Successfully deleted \`${parseInt(match[1])}\` messages from ${channel}.`));
        }
    }
}

class Kick extends Discord.Command {
    constructor() {
        super("kick", [], "kick **@person** `reason`", "kicks **@person**.\n**@person** is required and must be a user resolvable.\n`reason` is optional and is the reason to kick.", false);
    }
    message(content, member, channel, guild, message, handler) {
        const match = content.match(/[^\d]*(\d+)(?:$|.+?\s*(.*))/);
        if (match) {
            if (guild.members.has(match[1])) {
                const reply = new Discord.RichEmbed().setTitle("Kick").setDescription(`Successfully Kicked ${guild.members.get(match[1])}`);
                if (match[2]) reply.addField("Reason: ", match[2]);
                const mention = guild.members.get(match[1]).toString();
                const tag = guild.members.get(match[1]).user.tag;
                guild.members.get(match[1]).kick(match[2])
                    .then(e => {
                        channel.send(reply);
                        handler.database.getGuildPluginData(guild.id, this.plugin, {logChannel:null, muteRole:null}).then((response) => {
                            if (response.logChannel && guild.channels.has(response.logChannel)) guild.channels.get(response.logChannel).send(reply.setDescription(`${member} Successfully Kicked ${mention} (**${tag}**).`));
                        });
                    })
                    .catch(e => {
                        channel.send(new Discord.RichEmbed().setTitle("Kick").setDescription(`Failed to kick ${guild.members.get(match[1])}`));
                    });
            } else {
                channel.send(new Discord.RichEmbed().setTitle("Kick").setDescription(`Failed to kick as \`${match[1]}\` not found.`));
            }
        } else {
            channel.send(new Discord.RichEmbed().setTitle("Kick").setDescription("Failed to parse message."));
        }
    }
}

class Ban extends Discord.Command {
    constructor() {
        super("ban", [], "ban **@person** **prune_days** `reason`", "bans **@person** and deletes their messages for the past **prune_days**.\n**@person** is required and must be a user resolvable.\n**prune_days** is required and is the ammount of days to delete messages from.\n`reason` is optional and is the reason to ban.", false);
    }
    message(content, member, channel, guild, message, handler) {
        const match = content.match(/[^\d]*(\d+)(?:$|.+?(\d+))(?:$|\s*(.*))/);
        console.log(match);
        if (match) {
            if (guild.members.has(match[1])) {
                const reply = new Discord.RichEmbed().setTitle("Ban").setDescription(`Successfully Banned ${guild.members.get(match[1])}`);
                if (match[3]) reply.addField("Reason: ", match[3]);
                const mention = guild.members.get(match[1]).toString();
                const tag = guild.members.get(match[1]).user.tag;
                guild.ban(match[1], {days:match[2] ? parseInt(match[2]) : 0, reason:match[3]})
                    .then(e => {
                        channel.send(reply);
                        handler.database.getGuildPluginData(guild.id, this.plugin, {logChannel:null, muteRole:null}).then((response) => {
                            if (response.logChannel && guild.channels.has(response.logChannel)) guild.channels.get(response.logChannel).send(reply.setDescription(`${member} Successfully banned ${mention} (**${tag}**).`));
                        });
                    })
                    .catch(e => {
                        channel.send(new Discord.RichEmbed().setTitle("Ban").setDescription(`Failed to ban ${guild.members.get(match[1])}`));
                    });
            } else {
                channel.send(new Discord.RichEmbed().setTitle("Ban").setDescription(`Failed to ban as \`${match[1]}\` not found or not bannable.`));
            }
        } else {
            channel.send(new Discord.RichEmbed().setTitle("Ban").setDescription("Failed to parse message."));
        }
    }
}

class UnBan extends Discord.Command {
    constructor() {
        super("unban", [], "unban **@person** `reason`", "unbans **@person**.\n**@person** is required and must be a user resolvable.\n`reason` is optional and is the reason to unban.", false);
    }
    message(content, member, channel, guild, message, handler) {
        const match = content.match(/[^\d]*(\d+)(?:$|.+?\s*(.*))/);
        if (match) {
            const reply = new Discord.RichEmbed().setTitle("UnBan").setDescription(`Successfully Unbanned \`${match[1]}\``);
            if (match[2]) reply.addField("Reason: ", match[2]);
            guild.unban(match[1], match[2])
                .then(e => {
                    channel.send(reply);
                    handler.database.getGuildPluginData(guild.id, this.plugin, {logChannel:null, muteRole:null}).then((response) => {
                        if (response.logChannel && guild.channels.has(response.logChannel)) guild.channels.get(response.logChannel).send(reply.setDescription(`${member} Successfully unbanned \`${match[1]}\`.`));
                    });
                })
                .catch(e => {
                    channel.send(new Discord.RichEmbed().setTitle("UnBan").setDescription(`Failed to unban \`${match[1]}\``));
                });
        } else {
            channel.send(new Discord.RichEmbed().setTitle("UnBan").setDescription("Failed to parse message."));
        }
    }
}

class ModTools extends Discord.Plugin {
    constructor() {
        super("ModTools", "Moderation tools.");
        this.addCommand(new LogChannel());
        this.addCommand(new MuteRole());
        this.addCommand(new Mute());
        this.addCommand(new UnMute());
        this.addCommand(new Prune());
        this.addCommand(new Kick());
        this.addCommand(new Ban());
        this.addCommand(new UnBan());
    }
}

module.exports.load = function (client) {
    client.addPlugin(new ModTools());

    //logchannel stuff
    client.on("messageUpdate", (oldMessage, newMessage) => {
        if (!newMessage.author.bot)
        client.database.getGuild(newMessage.guild.id, client.prefix).then((response) => {
            if (response.enabled.includes("ModTools")) {
                client.database.getGuildPluginData(newMessage.guild.id, "ModTools", {logChannel:null, muteRole:null}).then((response) => {
                    if (response.logChannel) {
                        if (newMessage.guild.channels.has(response.logChannel)) {
                            const reply = new Discord.RichEmbed().setAuthor(newMessage.author.tag, newMessage.author.displayAvatarURL).setDescription(`${newMessage.author}, Updated A Message in ${newMessage.channel}`).setTimestamp(newMessage.createdTimestamp);

                            if (oldMessage.content.length > 1000) {
                                reply.addField("From:", "\u200b", false);
                                for (const i of [`\u200b${oldMessage.content.substring(0, 1000)}`, `\u200b${oldMessage.content.substring(1000)}`]) {
                                    reply.addField("\u200b", i, false);
                                }
                            } else {
                                reply.addField("From: ", `\u200b${oldMessage.content}`, false);
                            }

                            if (newMessage.content.length > 1000) {
                                reply.addField("To: ", "\u200b", false);
                                for (const i of [`\u200b${newMessage.content.substring(0, 1000)}`, `\u200b${newMessage.content.substring(1000)}`]) {
                                    reply.addField("\u200b", i, false);
                                }
                            } else {
                                reply.addField("To: ", `\u200b${newMessage.content}`, false);
                            }
                            newMessage.guild.channels.get(response.logChannel).send(reply);
                        }
                    }
                });
            }
        });
    });

    client.on("messageDelete", (message) => {
        if (!message.author.bot)
        client.database.getGuild(message.guild.id, client.prefix).then((response) => {
            if (response.enabled.includes("ModTools")) {
                client.database.getGuildPluginData(message.guild.id, "ModTools", {logChannel:null, muteRole:null}).then((response) => {
                    if (response.logChannel) {
                        if (message.guild.channels.has(response.logChannel)) {
                            const reply = new Discord.RichEmbed().setAuthor(message.author.tag, message.author.displayAvatarURL).setDescription(`${message.author}, Deleted A Message in ${message.channel}`).setTimestamp(message.createdTimestamp);
                            if (message.content.length > 1000) {
                                reply.addField("Content: ", "\u200b", false);
                                for (const i of [`\u200b${message.content.substring(0, 1000)}`, `\u200b${message.content.substring(1000)}`]) {
                                    reply.addField("\u200b", i, false);
                                }
                            } else {
                                reply.addField("Content: ", message.content, false);
                            }

                            message.guild.channels.get(response.logChannel).send(reply);
                        }
                    }
                });
            }
        });
    });

}
