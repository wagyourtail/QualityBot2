const Discord = require("../../CommandHandler2.js");

class ChannelFilter extends Discord.Command {
    constructor() {
        super("channelfilter", [], "channelfilter list **channel**\nchannelfilter add **channel** **/regex/**\nchannelfilter del **channel** **/regex/**", "filter chat by [regex](https://regexr.com/).\n**/regex/** is a regular expression or `attachments` to delete messages with attachments.\n**channel** is a channel resolvable or `all` for all channels.");
    }
    message(content, member, channel, guild, message, handler) {
        switch(content.split(" ")[0]) {
            case "list":
                {
                    const match = content.match(/[^\d]*?(\d+|all)/);
                    if (match && (match[1] == "all" || guild.channels.cache.has(match[1]))) {
                        handler.database.getGuildPluginData(guild.id, this.plugin, {}).then(data => {
                            if (!data[match[1]]) data[match[1]] = {regex:[], attachments:false};
                            let i = 0;
                            const reply = new Discord.RichEmbed().setTitle("ChannelFilter: list").addField("Attachments", data[match[1]].attachments ? "Blocked" : "Allowed");
                            if (data[match[1]].regex.length) reply.addField("Filters", data[match[1]].regex.map(d => `${++i}: \`/${d}/i\``).join("\n") + " ");
                            channel.send(reply);
                        });
                    } else {
                        channel.send(new Discord.RichEmbed().setTitle("ChannelFilter: list").addField("Failed", "**channel** didn't parse."))
                    }
                }
                break;
            case "add":
                {
                    const match = content.match(/[^\d]*?(\d+|all).*?(?:\/(.+)\/|attachments)/);
                    if (match && (match[1] == "all" || guild.channels.cache.has(match[1]))) {
                        handler.database.getGuildPluginData(guild.id, this.plugin, {}).then(data => {
                            if (!data[match[1]]) data[match[1]] = {regex:[], attachments:false};
                            if (content.split(" ")[2] == "attachments") {
                                data[match[1]].attachments = true;
                                channel.send(new Discord.RichEmbed().setTitle("ChannelFilter: add").addField("Success", `successfully added attachments block to ${content.split(" ")[1]}`));
                                handler.database.setGuildPluginData(guild.id, this.plugin, data);
                            } else {
                                if (match && match[2] && !data[match[1]].regex.includes(match[2])) {
                                    data[match[1]].regex.push(match[2]);
                                    channel.send(new Discord.RichEmbed().setTitle("ChannelFilter: add").addField("Success", `successfully added \`/${match[2]}/i\` to ${content.split(" ")[1]}`));
                                    handler.database.setGuildPluginData(guild.id, this.plugin, data);
                                } else {
                                    channel.send(new Discord.RichEmbed().setTitle("ChannelFilter: add").addField("Failed", "regex didn't parse"));
                                }
                            }
                        });
                    } else {
                        channel.send(new Discord.RichEmbed().setTitle("ChannelFilter: list").addField("Failed", "**channel** didn't parse."));
                    }
                }
                break;
            case "del":
                {
                    const match = content.match(/[^\d]*?(\d+|all).*?(?:\/(.+)\/|attachments)/);
                    if (match && (match[1] == "all" || guild.channels.cache.has(match[1]))) {
                        handler.database.getGuildPluginData(guild.id, this.plugin, {}).then(data => {
                            if (!data[match[1]]) data[match[1]] = {regex:[], attachments:false};
                            if (content.split(" ")[2] == "attachments") {
                                data[match[1]].attachments = false;
                                channel.send(new Discord.RichEmbed().setTitle("ChannelFilter: del").addField("Success", `successfully removed attachments block to ${content.split(" ")[1]}`));
                                handler.database.setGuildPluginData(guild.id, this.plugin, data);
                            } else {
                                if (match && match[2] && data[match[1]].regex.includes(match[2])) {
                                    data[match[1]].regex = data[match[1]].regex.filter(d => d != match[2]);
                                    channel.send(new Discord.RichEmbed().setTitle("ChannelFilter: del").addField("Success", `successfully removed \`/${match[2]}/i\` from ${content.split(" ")[1]}`));
                                    handler.database.setGuildPluginData(guild.id, this.plugin, data);
                                } else {
                                    channel.send(new Discord.RichEmbed().setTitle("ChannelFilter: del").addField("Failed", "regex didn't parse"));
                                }
                            }
                        });
                    } else {
                        channel.send(new Discord.RichEmbed().setTitle("ChannelFilter: list").addField("Failed", "**channel** didn't parse."));
                    }
                }
                break;
            default:
                this.selfHelp(channel, guild, handler);
        }
    }
}

class ChannelFilterPL extends Discord.Plugin {
    constructor() {
        super("ChannelFilter", "Channel Message Filtering");
        this.addCommand(new ChannelFilter());
    }
}

module.exports.load = function (client) {
    client.addPlugin(new ChannelFilterPL());

    client.on("message", (msg) => {
        client.database.getGuild(msg.guild.id, client.prefix).then((response) => {
            if (response.enabled.includes("ChannelFilter")) {
                client.database.getGuildPluginData(msg.guild.id, "ChannelFilter", {roles:{}}).then(filters => {
                    if (filters[msg.channel.id]) {
            			if (filters[msg.channel.id].regex.length != 0 && msg.content.match(new RegExp(filters[msg.channel.id].regex.join("|"),"i"))) {
            				msg.delete();
            			}

            			if (filters[msg.channel.id].attachments && msg.attachments.size != 0) {
            				msg.delete();
            			}
            		}
                    if (filters["all"]) {
            			if (filters["all"].regex.length != 0 && msg.content.match(new RegExp(filters["all"].regex.join("|"),"i"))) {
            				msg.delete();
            			}

            			if (filters["all"].attachments && msg.attachments.size != 0) {
            				msg.delete();
            			}
            		}
                });
            }
        });
    });

    client.on("messageUpdate", (old, msg) => {
        client.database.getGuild(msg.guild.id, client.prefix).then((response) => {
            if (response.enabled.includes("ChannelFilter")) {
                client.database.getGuildPluginData(msg.guild.id, "ChannelFilter", {roles:{}}).then(filters => {
                    if (filters[msg.channel.id]) {
            			if (filters[msg.channel.id].regex.length != 0 && msg.content.match(new RegExp(filters[msg.channel.id].regex.join("|"),"i"))) {
            				msg.delete();
            			}

            			if (filters[msg.channel.id].attachments && msg.attachments.size != 0) {
            				msg.delete();
            			}
            		}
                    if (filters["all"]) {
            			if (filters["all"].regex.length != 0 && msg.content.match(new RegExp(filters["all"].regex.join("|"),"i"))) {
            				msg.delete();
            			}

            			if (filters["all"].attachments && msg.attachments.size != 0) {
            				msg.delete();
            			}
            		}
                });
            }
        });
    });
}
