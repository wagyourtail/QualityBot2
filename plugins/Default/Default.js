const Discord = require("../../CommandHandler2.js");

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
                                    let roleResolve = guild.roles.resolve(role);
                                    if (roleResolve) roles.push(roleResolve.toString());
                                    if (role == "@everyone") roles.push("@everyone");
                                }
                                commands.push(`**${command}:** ${roles.length ? roles.join(' ') : "none"}`);
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
                                if (regexMatch && guild.roles.cache.has(regexMatch[1]) && regexMatch[1] != guild.id && !perms[content[1]].includes(regexMatch[1])) {
                                    perms[content[1]] = perms[content[1]] ? perms[content[1]].concat(regexMatch[1]) : [regexMatch[1]];
                                    handler.database.setGuildPluginPerms(guild.id, plugin, perms);
                                    reply.addField("Success", `Sucessfully added ${content[2]} to **${content[1]}**.`, false);
                                } else if ((content[2] == "@everyone" || regexMatch[1] == guild.id) && !perms[content[1]].includes("@everyone")) {
                                    perms[content[1]] = perms[content[1]] ? perms[content[1]].concat(["@everyone"]) : ["@everyone"];
                                    handler.database.setGuildPluginPerms(guild.id, plugin, perms);
                                    reply.addField("Success", `Sucessfully added @everyone to **${content[1]}**.`, false);
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
                                    reply.addField("Success", `Sucessfully removed ${content[2]} from **${content[1]}**.`, false);
                                } else if ((content[2] == "@everyone" || (regexMatch && regexMatch[1] == guild.id)) && perms[content[1]].includes("@everyone")) {
                                    perms[content[1]] = perms[content[1]] ? perms[content[1]].filter(e => e != "@everyone") : [];
                                    handler.database.setGuildPluginPerms(guild.id, plugin, perms);
                                    reply.addField("Success", `Sucessfully removed @everyone from **${content[1]}**.`, false);
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
                handler.database.getGuild(guild.id, handler.prefix).then(async (response) => {
                    const { prefix, enabled } = response;
                    const reply = new Discord.RichEmbed()
                        .setTitle("Permissions: reset");
                    let fail = true;
                    for (const plugin of enabled) {
                        if (handler.plugins.has(plugin)) {
                            if (handler.plugins.get(plugin).has(content[1])) {
                                reply.setDescription(content[1]);
                                const perms = (await handler.database.getGuildPluginAliasesAndPerms(guild.id, plugin, handler.plugins.get(plugin).aliases, handler.plugins.get(plugin).perms)).perms;
                                perms[content[1]] = handler.plugins.get(plugin).get(content[1]).perms;
                                handler.database.setGuildPluginPerms(guild.id, plugin, perms);
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
            default:
                this.selfHelp(channel, guild, handler);
        }
    }
}

class Aliases extends Discord.Command {
    constructor() {
        super("aliases", [], "aliases **list**\naliases **add** **command** **alias**\naliases **del** **command** **alias**\naliases reset **alias**", "change what aliases are assigned to use what commands\n **alias** is required and must not contain a space.\n**command** is required and must be the command name, not an alias.", false);
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
                            const aliases = (await handler.database.getGuildPluginAliasesAndPerms(guild.id, plugin, handler.plugins.get(plugin).aliases, handler.plugins.get(plugin).perms)).aliases;
                            const commands = [];
                            for (const command of Object.keys(aliases)) {
                                commands.push(`**${command}:** ${aliases[command].length ? aliases[command] : "`none`"}`);
                            }
                            permissions.addField(`**${plugin}**`, commands.join('\n'));
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
                                const aliases = (await handler.database.getGuildPluginAliasesAndPerms(guild.id, plugin, handler.plugins.get(plugin).aliases, handler.plugins.get(plugin).perms)).aliases;
                                if (content[2] && !aliases[content[1]].includes(content[2])) {
                                    aliases[content[1]] = aliases[content[1]] ? aliases[content[1]].concat(content[2]) : [content[2]];
                                    handler.database.setGuildPluginAliases(guild.id, plugin, aliases);
                                    reply.addField("Success", `Sucessfully added \`${content[2]}\` to **${content[1]}**.`, false);
                                } else {
                                    reply.addField("Fail", `**alias** didn't parse, or already exists.`, false);
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
                        .setTitle("Permissions: add");
                    let fail = true;
                    for (const plugin of enabled) {
                        if (handler.plugins.has(plugin)) {
                            if (handler.plugins.get(plugin).has(content[1])) {
                                reply.setDescription(content[1]);
                                const aliases = (await handler.database.getGuildPluginAliasesAndPerms(guild.id, plugin, handler.plugins.get(plugin).aliases, handler.plugins.get(plugin).perms)).aliases;
                                if (content[2] && aliases[content[1]].includes(content[2])) {
                                    aliases[content[1]] = aliases[content[1]] ? aliases[content[1]].filter(e => e != content[2]) : [];
                                    handler.database.setGuildPluginAliases(guild.id, plugin, aliases);
                                    reply.addField("Success", `Sucessfully removed \`${content[2]}\` from **${content[1]}**.`, false);
                                } else {
                                    reply.addField("Fail", `**alias** didn't parse, or already exists.`, false);
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
                handler.database.getGuild(guild.id, handler.prefix).then(async (response) => {
                    const { prefix, enabled } = response;
                    const reply = new Discord.RichEmbed()
                        .setTitle("Permissions: reset");
                    let fail = true;
                    for (const plugin of enabled) {
                        if (handler.plugins.has(plugin)) {
                            if (handler.plugins.get(plugin).has(content[1])) {
                                reply.setDescription(content[1]);
                                const aliases = (await handler.database.getGuildPluginAliasesAndPerms(guild.id, plugin, handler.plugins.get(plugin).aliases, handler.plugins.get(plugin).perms)).aliases;
                                aliases[content[1]] = handler.plugins.get(plugin).get(content[1]).aliases;
                                handler.database.setGuildPluginAliases(guild.id, plugin, aliases);
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
            default:
                this.selfHelp(channel, guild, handler);
        }
    }
}

class SetPrefix extends Discord.Command {
    constructor() {
        super("setprefix", [], "setprefix **prefix**", "sets prefix for the server.\n**prefix** must not contain a space.", false);
    }
    message(content, member, channel, guild, message, handler) {
        content = content.split(' ');
        const reply = new Discord.RichEmbed()
            .setTitle("SetPrefix: ");
        if (content[0] && content[0].length < 10 && content[0].length > 0) {
            handler.database.setGuildPrefix(guild.id, content[0]);
            reply.setDescription(`Prefix sucessfully set to \`${content[0]}\``);
        } else {
            reply.setDescription("Failed, **prefix** could not be parsed");
        }
        channel.send(reply);
    }
}

class Plugins extends Discord.Command {
    constructor() {
        super("plugins", [], "plugins list\nplugins info **plugin**\nplugins enable **plugin**\nplugins disable **plugin**", "enables/disables plugin components.\n**plugin** is required and must be the name of the plugin.");
    }
    message(content, member, channel, guild, message, handler) {
        content = content.toLowerCase();
        content = content.split(' ');
        switch (content[0]) {
            case "list":
                handler.database.getGuild(guild.id, handler.prefix).then((response) => {
                    const enabled = response.enabled;
                    const plugins = Array.from(handler.plugins.keys());
                    const reply = new Discord.RichEmbed()
                        .setTitle("Plugins: list");
                    const enable = plugins.filter(e => enabled.includes(e)).join(", ");
                    const disable = plugins.filter(e => !enabled.includes(e)).join(", ");
                    if (enable) reply.addField("Enabled", enable);
                    if (disable) reply.addField("Disabled", disable);
                    channel.send(reply);
                });
                break;
            case "info":
                handler.database.getGuild(guild.id, handler.prefix).then((response) => {
                    const enabled = response.enabled;
                    const reply = new Discord.RichEmbed()
                        .setTitle("Plugins: info");
                    const result = Array.from(handler.plugins.keys()).filter(e => e.toLowerCase() == content[1].toLowerCase());
                    if (result[0]) {
                        reply.setDescription(`${enabled.includes(result[0]) ? "Enabled" : "Disabled"}`);
                        reply.addField(handler.plugins.get(result[0]).name, handler.plugins.get(result[0]).description);
                    } else {
                        reply.addField("Failed", "**Plugin** failed to parse.");
                    }
                    channel.send(reply);
                });
                break;
            case "enable":
                handler.database.getGuild(guild.id, handler.prefix).then((response) => {
                    const enabled = response.enabled;
                    const reply = new Discord.RichEmbed()
                        .setTitle("Plugins: enable");
                    const result = Array.from(handler.plugins.keys()).filter(e => e.toLowerCase() == content[1].toLowerCase());
                    if (result.length && !enabled.includes(result[0])) {
                        reply.setDescription(result[0]);
                        handler.database.setGuildEnabled(guild.id, enabled.concat(result[0]));
                    } else {
                        reply.addField("Failed", "**Plugin** failed to parse or is already enabled.");
                    }
                    channel.send(reply);
                });
                break;
            case "disable":
                handler.database.getGuild(guild.id, handler.prefix).then((response) => {
                    const enabled = response.enabled;
                    const reply = new Discord.RichEmbed()
                        .setTitle("Plugins: disable");
                    const result = Array.from(handler.plugins.keys()).filter(e => e.toLowerCase() == content[1].toLowerCase());
                    if (result.length && enabled.includes(result[0]) && result[0] != "Default") {
                        reply.setDescription(result[0]);
                        handler.database.setGuildEnabled(guild.id, enabled.filter(e => e != result[0]));
                    } else {
                        reply.addField("Failed", "**Plugin** failed to parse or is already disabled.");
                    }
                    channel.send(reply);
                });
                break;
            default:
                this.selfHelp(channel, guild, handler);
        }
    }
}

class DefaultPL extends Discord.Plugin {
    constructor() {
        super("Default", "Essential commands.");
        this.addCommand(new Help());
        this.addCommand(new Permissions());
        this.addCommand(new Aliases());
        this.addCommand(new SetPrefix());
        this.addCommand(new Plugins());
    }
}

module.exports.load = function(client) {
    client.addPlugin(new DefaultPL());
}
