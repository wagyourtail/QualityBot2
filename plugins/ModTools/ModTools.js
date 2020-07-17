const Discord = require("../../CommandHandler2.js");

class LogChannel extends Discord.Command {
    constructor() {
        super("logchannel", [], "logchannel **#channel**", "set channel for logging, \n**channel** is required (or dont type it to disable).", false);
    }
    message(content, member, channel, guild, message, handler) {
        handler.database.getGuildPluginData(guild.id, this.plugin, {logChannel:null, muteRole:null, logChanges:false}).then((response) => {
            const match = content.match(/[^\d]*(\d+)/);
            if (!match) response.logChannel = null;
            else response.logChannel = match[1];
            channel.send(new Discord.RichEmbed().setTitle("Log Channel").setDescription(`Log Channel set to ${match ? guild.channels.resolve(match[1]) : "`none`"}.`));
            handler.database.setGuildPluginData(guild.id, this.plugin, response);
        });
    }
}

class LogChanges extends Discord.Command {
    constructor() {
        super("logchanges", [], "logchanges `true/false`", "set/toggle whether to log changes to member's messages\n`true/false` is not required, if not supplied will toggle instead.", false);
    }
    message(content, member, channel, guild, message, handler) {
        handler.database.getGuildPluginData(guild.id, this.plugin, {logChannel:null, muteRole:null, logChanges:false}).then((response) => {
            response.logChanges = !response.logChanges;
            if (content.trim().toLowerCase() == "false") response.logChanges = false;
            else if (content.trim().toLowerCase() == "true") response.logChanges = true;
            channel.send(new Discord.RichEmbed().setTitle("Log Changes").setDescription(`Log Changes set to \`${response.logChanges}\`.`));
            handler.database.setGuildPluginData(guild.id, this.plugin, response);
        });
    }
}

class MuteRole extends Discord.Command {
    constructor() {
        super("muterole", [], "muterole **role**", "set role for muting people, \n**role** is required and must be a role resolvable (@role or id).", false);
    }
    message(content, member, channel, guild, message, handler) {
        handler.database.getGuildPluginData(guild.id, this.plugin, {logChannel:null, muteRole:null, logChanges:false}).then((response) => {
            const match = content.match(/[^\d]*(\d+)/);
            if (!match) response.muteRole = null;
            else response.muteRole = guild.roles.resolve(match[1]) ? match[1] : null;
            channel.send(new Discord.RichEmbed().setTitle("Mute Role").setDescription(`Mute Role set to ${response.muteRole ? guild.roles.resolve(match[1]) : "`none`"}.`));
            handler.database.setGuildPluginData(guild.id, this.plugin, response);
            if (response.muteRole) {
                Array.from(guild.channels).filter(e => e[1].type != "voice").forEach(e => {
                    let overwrite = true;
                    if (e[1].permissionOverwrites.has(response.muteRole)) overwrite = !(e[1].permissionOverwrites.get(response.muteRole).allow & 2048);
                    if (overwrite) e[1].overwritePermissions(response.muteRole, {SEND_MESSAGES: false}, "auto update muterole perms.");
                });
            }
        });
    }
}

class Warn extends Discord.Command {
    constructor() {
        super("warn", [], "warn **@person** `reason`", "warn people when they are out of line")
    }
    message(content, member, channel, guild, message, handler) {
        const match = content.match(/[^\d]*(\d+)(?:$|.+?\s*(.*))/);
        if (match) {
            const mmember = guild.members.resolve(match[1]);
            if (mmember) {
                const reply = new Discord.RichEmbed().setTitle("Warn").setDescription(`Warn ${mmember}`);
                if (match[2]) reply.addField("Reason: ", match[2]);
                const mention = mmember.toString();
                const tag = member.user.tag;
                channel.send(reply);
                handler.database.getGuildPluginData(guild.id, this.plugin, { logChannel: null, muteRole: null, logChanges: false }).then((response) => {
                    const logChannel = guild.channels.resolve(response.logChannel);
                    if (logChannel) logChannel.send(reply.setDescription(`${member} Warned ${mention} (**${tag}**).`));
                });
            } else {
                channel.send(new Discord.RichEmbed().setTitle("Kick").setDescription(`Failed to kick as \`${match[1]}\` not found.`));
            }
        } else {
            channel.send(new Discord.RichEmbed().setTitle("Kick").setDescription("Failed to parse message."));
        }
    }
}

class Mute extends Discord.Command {
    constructor() {
        super("mute", [], "mute **@person** **time** `reason`", "mute people if muterole is set.\n**@person** is required and must be a mention (or user id).\n`reason` optional reason for mute.");
    }
    message(content, member, channel, guild, message, handler) {
        handler.database.getGuildPluginData(guild.id, this.plugin, {logChannel:null, muteRole:null, logChanges:false}).then((response) => {
            const match = content.match(/[^\d]*(\d+)(?:$|.+?\s*(.*))/);
            if (match) {
                if (!response.muteRole) {
                    channel.send(new Discord.RichEmbed().setTitle("Mute").setDescription("Failed, mute role not set."));
                    return;
                }
                const mention = guild.members.resolve(match[1]);
                if (mention) {
                    const reply = new Discord.RichEmbed().setTitle("Mute").setDescription(`Successfully muted ${mention}.`);
                    if (match[2]) reply.addField("Reason: ", match[2]);
                    mention.roles.add(response.muteRole);
                    channel.send(reply);
                    const logChannel = guild.channels.resolve(response.logChannel);
                    if (logChannel) logChannel.send(reply.setDescription(`${member} Successfully muted ${mention} (**${mention.user.tag}**).`));
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
        handler.database.getGuildPluginData(guild.id, this.plugin, {logChannel:null, muteRole:null, logChanges:false}).then((response) => {
            const match = content.match(/[^\d]*(\d+)(?:$|.+?\s*(.*))/);
            if (match) {
                if (!response.muteRole) {
                    channel.send(new Discord.RichEmbed().setTitle("UnMute").setDescription("Failed, mute role not set."));
                    return;
                }
                const mention = guild.members.resolve(match[1]);
                if (mention) {
                    const reply = new Discord.RichEmbed().setTitle("UnMute").setDescription(`Successfully unmuted ${mention}.`);
                    if (match[2]) reply.addField("Reason: ", match[2]);
                    mention.roles.remove(response.muteRole);
                    channel.send(reply);
                    const logChannel = guild.channels.resolve(response.logChannel);
                    if (logChannel) logChannel.send(reply.setDescription(`${member} Successfully unmuted ${mention} (**${mention.user.tag}**).`));
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
        const mention = guild.members.resolve(match[1]);
        if (match) {
            if (mention) {
                const reply = new Discord.RichEmbed().setTitle("Kick").setDescription(`Successfully Kicked ${mention}`);
                if (match[2]) reply.addField("Reason: ", match[2]);
                guild.members.cache.get(match[1]).kick(match[2])
                    .then(e => {
                        channel.send(reply);
                        handler.database.getGuildPluginData(guild.id, this.plugin, { logChannel: null, muteRole: null, logChanges: false }).then((response) => {
                            const logChannel = guild.channels.resolve(response.logChannel);
                            if (logChannel) logChannel.send(reply.setDescription(`${member} Successfully Kicked ${mention} (**${mention.user.tag}**).`));
                        });
                    })
                    .catch(e => {
                        channel.send(new Discord.RichEmbed().setTitle("Kick").setDescription(`Failed to kick ${mention}`));
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
        const mention = guild.members.resolve(match[1]);
        if (match) {
            if (mention) {
                const reply = new Discord.RichEmbed().setTitle("Ban").setDescription(`Successfully Banned ${mention}`);
                if (match[3]) reply.addField("Reason: ", match[3]);
                guild.ban(match[1], {days:match[2] ? parseInt(match[2]) : 0, reason:match[3]})
                    .then(e => {
                        channel.send(reply);
                        handler.database.getGuildPluginData(guild.id, this.plugin, { logChannel: null, muteRole: null, logChanges: false }).then((response) => {
                            const logChannel = guild.channels.resolve(response.logChannel);
                            if (logChannel) logChannel.send(reply.setDescription(`${member} Successfully banned ${mention} (**${mention.user.tag}**).`));
                        });
                    })
                    .catch(e => {
                        channel.send(new Discord.RichEmbed().setTitle("Ban").setDescription(`Failed to ban ${mention}`));
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
                    handler.database.getGuildPluginData(guild.id, this.plugin, { logChannel: null, muteRole: null, logChanges: false }).then((response) => {
                        const logChannel = guild.channels.resolve(response.logChannel);
                        if (logChannel) logChannel.send(reply.setDescription(`${member} Successfully unbanned \`${match[1]}\`.`));
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
        this.addCommand(new LogChanges());
        this.addCommand(new MuteRole());
        this.addCommand(new Mute());
        this.addCommand(new UnMute());
        this.addCommand(new Prune());
        this.addCommand(new Kick());
        this.addCommand(new Ban());
        this.addCommand(new UnBan());
        this.addCommand(new Warn());
    }
}

module.exports.load = function (client) {
    client.addPlugin(new ModTools());

    //logchannel stuff
    client.on("messageUpdate", (oldMessage, newMessage) => {
        if (!newMessage.author.bot)
        client.database.getGuild(newMessage.guild.id, client.prefix).then((response) => {
            if (response.enabled.includes("ModTools")) {
                client.database.getGuildPluginData(newMessage.guild.id, "ModTools", {logChannel:null, muteRole:null, logChanges:false}).then((response) => {
                    if (response.logChannel && response.logChanges && oldMessage.content != newMessage.content) {
                        const logChannel = newMessage.guild.channels.resolve(response.logChannel);
                        if (logChannel) {
                            const reply = new Discord.RichEmbed().setAuthor(newMessage.author.tag, newMessage.author.displayAvatarURL).setDescription(`${newMessage.author}, Updated A Message in ${newMessage.channel}`).setTimestamp(newMessage.createdTimestamp).setTitle("Message Updated").setURL(newMessage.url);

                            if (oldMessage.content.length > 1000) {
                                reply.addField("From:", `\u200b${oldMessage.content.substring(0, 1000)}`, false);
                                reply.addField("\u200b", `\u200b${oldMessage.content.substring(1000)}`, false);
                            } else {
                                reply.addField("From: ", `\u200b${oldMessage.content}`, false);
                            }

                            if (newMessage.content.length > 1000) {
                                reply.addField("To: ", `\u200b${newMessage.content.substring(0, 1000)}`, false);
                                reply.addField("\u200b", `\u200b${newMessage.content.substring(1000)}`, false);
                            } else {
                                reply.addField("To: ", `\u200b${newMessage.content}`, false);
                            }
                            const attachments = Array.from(newMessage.attachments);
                            console.log(attachments)
                            if (attachments.length) reply.addField("Attachments: ", attachments.map(e => e[1].proxyURL).join("\n"));
                            logChannel.send(reply);
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
                client.database.getGuildPluginData(message.guild.id, "ModTools", {logChannel:null, muteRole:null, logChanges:false}).then((response) => {
                    if (response.logChannel && response.logChanges) {
                        const logChannel = message.guild.channels.resolve(response.logChannel);
                        if (logChannel) {
                            const reply = new Discord.RichEmbed().setAuthor(message.author.tag, message.author.displayAvatarURL).setDescription(`A message was deleted in ${message.channel}`).setTimestamp(message.createdTimestamp).setTitle("Message Deleted");
                            if (message.content.length > 1000) {
                                reply.addField("Content: ", `\u200b${message.content.substring(0, 1000)}`, false);
                                reply.addField("\u200b", `\u200b${message.content.substring(1000)}`, false);
                            } else {
                                reply.addField("Content: ", `\u200b${message.content}`, false);
                            }
                            const attachments = Array.from(message.attachments);
                            if (attachments.length) reply.addField("Attachments: ", attachments.map(e => e[1].proxyURL).join("\n"));
                            logChannel.send(reply);
                        }
                    }
                });
            }
        });
    });

    client.on("channelCreate", (channel) => {
        if (channel.guild && channel.type != "voice") {
            client.database.getGuild(channel.guild.id, client.prefix).then((response) => {
                if (response.enabled.includes("ModTools")) {
                    client.database.getGuildPluginData(channel.guild.id, "ModTools", {logChannel:null, muteRole:null, logChanges:false}).then((response) => {
                        if (response.muteRole) {
                            let overwrite = true;
                            if (channel.permissionOverwrites.has(response.muteRole)) overwrite = !(channel.permissionOverwrites.get(response.muteRole).allow & 2048);
                            if (overwrite) channel.overwritePermissions(response.muteRole, {SEND_MESSAGES: false}, "auto update muterole perms.");
                        }
                    });
                }
            });
        }
    });
}
