const Discord = require("./CommandHandler2.js");
const fs = require("fs");
const Client = new Discord.Client(require("./Database.js"), "!!", "100748674849579008");

class DefaultPL extends Discord.Plugin {
    constructor() {
        super("default", "essential commands.");
        this.addCommand(new Help());
        this.addCommand(new Permissions());
    }
}

class Help extends Discord.Command {
    constructor() {
        super("help", [], "help `command`", "helps with the usage of commands. \n`command` is optional and must be the actual command name, not an alias.", true);
    }
    message(content, member, channel, guild, message, handler) {
        handler.database.getGuild(guild.id, handler.prefix).then((response) => {
            const { prefix, enabled } = response;
            if (content == null || content.match(/^ *$/) != null) {
                const reply = new Discord.RichEmbed()
                    .setTitle("Help: ")
                    .setThumbnail(handler.user.avatarURL);
                for (const plugin of enabled) {
                    if (handler.plugins.has(plugin)) {
                        reply.addField(plugin, Array.from(handler.plugins.get(plugin).keys()).join('\n'), true);
                    }
                }
                channel.send(reply);
            } else {
                content = content.toLowerCase();
                for (const plugin of enabled) {
                    if (handler.plugins.has(plugin)) {
                        for (const [name, command] of handler.plugins.get(plugin)) {
                            if (content == name) {
                                command.selfHelp(channel, guild, handler);
                            }
                        }
                    }
                }
            }
        });
    }
}

class Permissions extends Discord.Command {
    constructor() {
        super("permissions", [], "permissions **list**\npermissions **add** **command** **role**\npermissions **del** **command** **role**\npermissions reset **command**", "change what roles are allowed to use what commands\n **role** is required and must be a role resolvable (either @role or the corresponding number value).\n**command** is required and must be the command name, not an alias.", false);
    }
    message(content, member, channel, guild, message, handler) {
        content = content.toLowerCase();
        content = content.split(' ');
        switch (content[0]) {
            case "list":
                handler.database.getGuild(guild.id, handler.prefix).then(async (response) => {
                    const { prefix, enabled } = response;
                    const permissions = new Discord.RichEmbed()
                        .setTitle("Permissions: list")
                        .setDescription("List of commands and what roles can use them.");
                    for (const plugin of enabled) {
                        if(handler.plugins.has(plugin)) {
                            const perms = (await handler.database.getGuildPluginAliasesAndPerms(guild.id, plugin, handler.plugins.get(plugin).aliases, handler.plugins.get(plugin).perms)).perms;
                            const commands = [];
                            for (const command of Object.keys(perms)) {
                                const roles = [];
                                for (const role of perms[command]) {
                                    if (guild.roles.has(role)) roles.push(guild.roles.get(role).toString());
                                    if (role == "@everyone") roles.push("@everyone");
                                }
                                commands.push(`${command}: ${roles.length ? roles.join(' ') : "none"}`);
                            }
                            permissions.addField(plugin, commands.join('\n'));
                        }
                    }
                    channel.send(permissions);
                });
                break;
            case "add":
                handler.database.getGuild(guild.id, handler.prefix).then(async (response) => {
                    const { prefix, enabled } = response;
                    const reply = new Discord.RichEmbed()
                        .setTitle("Permissions: add");
                    let fail = true;
                    for (const plugin of enabled) {
                        if (handler.plugins.has(plugin)) {
                            if (handler.plugins.get(plugin).has(content[1])) {
                                reply.setDescription(content[1]);
                                const perms = (await handler.database.getGuildPluginAliasesAndPerms(guild.id, plugin, handler.plugins.get(plugin).aliases, handler.plugins.get(plugin).perms)).perms;
                                const regexMatch = content[2].match(/[^\d]*?(\d+)/);
                                if (regexMatch && guild.roles.has(regexMatch[1]) && regexMatch[1] != guild.id && !perms[content[1]].includes(regexMatch[1])) {
                                    perms[content[1]] = perms[content[1]] ? perms[content[1]].concat(regexMatch[1]) : [regexMatch[1]];
                                    handler.database.setGuildPluginPerms(guild.id, plugin, perms);
                                    reply.addField("Success", `Sucessfully added ${content[2]} to \`${content[1]}\`.`, false);
                                } else if ((content[2] == "@everyone" || regexMatch[1] == guild.id) && !perms[content[1]].includes("@everyone")) {
                                    perms[content[1]] = perms[content[1]] ? perms[content[1]].concat(["@everyone"]) : ["@everyone"];
                                    handler.database.setGuildPluginPerms(guild.id, plugin, perms);
                                    reply.addField("Success", `Sucessfully added @everyone to ${content[1]}.`, false);
                                } else {
                                    reply.addField("Fail", "**role** did not parse, or is already there.", false);
                                }
                                fail = false;
                            }
                        }
                    }
                    if (fail) {
                        reply.addField("Fail", "**command** did not parse.");
                    }
                    channel.send(reply);
                });
                break;
            case "del":
                handler.database.getGuild(guild.id, handler.prefix).then(async (response) => {
                    const { prefix, enabled } = response;
                    const reply = new Discord.RichEmbed()
                        .setTitle("Permissions: del");
                    let fail = true;
                    for (const plugin of enabled) {
                        if (handler.plugins.has(plugin)) {
                            if (handler.plugins.get(plugin).has(content[1])) {
                                reply.setDescription(content[1]);
                                const perms = (await handler.database.getGuildPluginAliasesAndPerms(guild.id, plugin, handler.plugins.get(plugin).aliases, handler.plugins.get(plugin).perms)).perms;
                                const regexMatch = content[2].match(/[^\d]*?(\d+)/);
                                if (regexMatch && regexMatch[1] != guild.id && perms[content[1]].includes(regexMatch[1])) {
                                    perms[content[1]] = perms[content[1]] ? perms[content[1]].filter(e => e != regexMatch[1]) : [];
                                    handler.database.setGuildPluginPerms(guild.id, plugin, perms);
                                    reply.addField("Success", `Sucessfully removed ${content[2]} from \`${content[1]}\`.`, false);
                                } else if ((content[2] == "@everyone" || (regexMatch && regexMatch[1] == guild.id)) && perms[content[1]].includes("@everyone")) {
                                    perms[content[1]] = perms[content[1]] ? perms[content[1]].filter(e => e != "@everyone") : [];
                                    handler.database.setGuildPluginPerms(guild.id, plugin, perms);
                                    reply.addField("Success", `Sucessfully removed @everyone from ${content[1]}.`, false);
                                } else {
                                    reply.addField("Fail", "**role** did not parse, or is not there.", false);
                                }
                                fail = false;
                            }
                        }
                    }
                    if (fail) {
                        reply.addField("Fail", "**command** did not parse.");
                    }
                    channel.send(reply);
                });
                break;
            case "reset":

                break;
            default:
                this.selfHelp();
        }
    }
}

Client.addPlugin(new DefaultPL());

Client.database.getClientToken("520769818870415380").then((secret) => { //obviously this'll change based on your implementation of storing secrets.
    Client.login(secret);
});
