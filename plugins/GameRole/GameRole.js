const Discord = require("../../CommandHandler2.js");

const updateMessage = (guild, data) => {
    const reactions = Object.keys(data.roles);
    const messages = [].concat(data.message);
    for (let i = 0; i < Math.ceil(reactions.length / 15); i++) {
        if (messages[i]) {
            guild.channels.resolve(messages[i].channel).fetchMessage(messages[i].id).then(msg => {
                for(let j = 15*i; j < 15 * (i + 1) && j < reactions.length; j++) {
                    if (!msg.reactions.resolve(reactions[j]).me) msg.react(reactions[j]);
                }
            });
        }
    }
    /*
    guild.channels.get(data.message.channel).fetchMessage(data.message.id).then(message => {
        Object.keys(data.roles).filter(reaction => !message.reactions.has(reaction)).forEach(reaction => message.react(reaction));
        message.reactions.filter(reaction => !Object.keys(data.roles).includes(reaction._emoji.id)).forEach(reaction => {
            reaction.fetchUsers().then(users => {
                users.forEach(user => {
                    reaction.remove(user);
                });
            });
        });
    }).catch(console.log);
    */
}

class GameRole extends Discord.Command {
    constructor() {
        super("gamerole", [], "gamerole list\ngamerole add **role** **emoji**\ngamerole del **emoji**", "manages roles to hand people for reacting to a message.\n**role** is required and must be a role resolvable (either number or @mention)", false);
    }
    message(content, member, channel, guild, message, handler) {
        switch(content.split(' ')[0]) {
            case "list":
                handler.database.getGuildPluginData(guild.id, this.plugin, {roles:{}, message:[]}).then((response) => {
                    const reply = new Discord.RichEmbed()
                        .setTitle("GameRole: List");
                    const mappings = [];
                    for (const [key, value] of Object.entries(response.roles)) {
                        mappings.push(`${guild.emojis.resolve(key)} -> ${guild.roles.resolve(value)}`);
                    }
                    if (mappings.length) reply.setDescription(mappings.join('\n'));
                    channel.send(reply);
                });
                break;
            case "add":
                handler.database.getGuildPluginData(guild.id, this.plugin, {roles:{}, message:[]}).then((response) => {
                    const reply = new Discord.RichEmbed()
                        .setTitle("GameRole: Add");
                    const matches = content.match(/[^\d]*(\d+)[^\d]+?:[^\s]+:[^\d]*(\d+)/);
                    const role = guild.roles.resolve(matches[1]);
                    const emoji = guild.emojis.resolve(matches[2]);
                    if (role && emoji) {
                        response.roles[matches[2]] = matches[1];
                        reply.addField("Success", `${emoji} -> ${role}`);
                    } else {
                        reply.addField("Fail", "failed to parse role/emoji");
                    }
                    handler.database.setGuildPluginData(guild.id, this.plugin, response);
                    channel.send(reply);
                    if (response.message) updateMessage(guild, response);
                });
                break;
            case "del":
                handler.database.getGuildPluginData(guild.id, this.plugin, {roles:{}, message:[]}).then((response) => {
                    const reply = new Discord.RichEmbed()
                        .setTitle("GameRole: Del");
                    const matches = content.match(/[^\d]*?:[^\s]+:[^\d]*(\d+)/);
                    if (matches && response.roles[matches[1]]) {
                        delete response.roles[matches[1]];
                        reply.addField("Success", `${guild.emojis.resolve(matches[1])} no longer assigned.`);
                    } else {
                        reply.addField("Fail", "failed to parse emoji or is not assigned.");
                    }
                    handler.database.setGuildPluginData(guild.id, this.plugin, response);
                    channel.send(reply);
                    if (response.message) updateMessage(guild, response);
                });
                break;
            default:
                this.selfHelp(channel, guild, handler);
        }
    }
}

class GameRoleMessage extends Discord.Command {
    constructor() {
        super("gamerolemessage", [], "gamerolemessage list\ngamerolemessage add **messageid**\ngamerolemessage del **messageid**", "set message(s) for reactions,\n**messageid** is required and must be the ID of a message in the same channel as this command.\n if **messageid** is not supplied or is supplied incorrectly, bot will auto-gen a message under this command. \n\n MAX 15 REACTIONS PER MESSAGE.", false);
    }
    message(content, author, channel, guild, message, handler) {
        handler.database.getGuildPluginData(guild.id, this.plugin, {roles:{}, message:[]}).then(async (response) => {
            const matches = content.match(/[^\d]*(\d+)/);
            switch (content.split(" ")[0]) {
                case "list":
                    channel.send(new Discord.RichEmbed().setTitle("GameRoleMessage: list").setDescription([].concat(response.message).map(e => `<#${e.channel}>: ${e.id}`).join('\n')));
                    break;
                case "add":
                    let msg;
                    if (matches) msg = await channel.fetchMessage(matches[1]);
                    if (!msg) msg = await channel.send("**react to this message to get your roles.**");
                    if (msg) {
                        response.message = [].concat(response.message, {id:msg.id, channel:channel.id});
                        handler.database.setGuildPluginData(guild.id, this.plugin, response);
                        updateMessage(guild, response);
                    }
                    break;
                case "del":
                    if (matches) {
                        response.message = [].concat(response.message).filter(e => e.id != matches[1]);
                        handler.database.setGuildPluginData(guild.id, this.plugin, response);
                        updateMessage(guild, response);
                    }
                    break;
                default:
                    this.selfHelp(channel, guild, handler);
            }

            /*
            let msg;
            if (matches) msg = await channel.fetchMessage(matches[1]);
            if (!msg) msg = (await channel.fetchMessages({limit: 2})).last();
            if (msg) {
                response.message = {id:msg.id, channel:channel.id};
                handler.database.setGuildPluginData(guild.id, this.plugin, response);
                updateMessage(guild, response);
            } else {
                channel.send(new Discord.RichEmbed().setTitle("GameRoleMessage").addField("Failed", "could not find message to hook to."));
            }
            message.delete();
            */
        });
    }
}

class GameRolePL extends Discord.Plugin {
    constructor() {
        super("GameRole", "Reaction Role Assignment.");
        this.addCommand(new GameRole());
        this.addCommand(new GameRoleMessage());
    }
}

module.exports.load = function(client) {
    client.addPlugin(new GameRolePL());

    client.on("raw", event => {
        if (event.t == "MESSAGE_REACTION_ADD" && event.d.user_id != client.user.id && event.d.guild_id) {
            client.database.getGuild(event.d.guild_id, client.prefix).then((response) => {
                if (response.enabled.includes("GameRole")) {
                    client.database.getGuildPluginData(event.d.guild_id, "GameRole", {roles:{}, message:[]}).then(response => {
                        if ([].concat(response.message).map(e => e.id).includes(event.d.message_id) && response.roles[event.d.emoji.id]) {
                            client.guilds.resolve(event.d.guild_id).members.resolve(event.d.user_id).addRole(response.roles[event.d.emoji.id]).catch(console.log);
                        }
                    });
                }
            });
        } else if (event.t == "MESSAGE_REACTION_REMOVE" && event.d.user_id != client.user.id && event.d.guild_id) {
            client.database.getGuild(event.d.guild_id, client.prefix).then((response) => {
                if (response.enabled.includes("GameRole")) {
                    client.database.getGuildPluginData(event.d.guild_id, "GameRole", {roles:{}, message:[]}).then(response => {
                        if ([].concat(response.message).map(e => e.id).includes(event.d.message_id) && response.roles[event.d.emoji.id]) {
                            client.guilds.resolve(event.d.guild_id).members.resolve(event.d.user_id).removeRole(response.roles[event.d.emoji.id]).catch(console.log);
                        }
                    });
                }
            });
        }
    });
}
