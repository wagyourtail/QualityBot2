'use strict';
const Discord = require('discord.js');
const fs = require('fs');

class Client extends Discord.Client {
    constructor(database, defaultPrefix, owner) {
        super();
        this.on("message", this.handle);
        this.on("ready", () => { console.log(`${this.user.username} ready!`) });
        this.on("guildUpdate", (old, guild) => {
            guild.roles.fetch().catch(console.log);
        });
        this.on("guildMemberUpdate", (old, member) => {
            member.roles.fetch().catch(console.log);
        });
        this.on("guildMemberAdd", (member) => {
            member.guild.members.fetch();
        });
        this.on("guildMemberRemove", (member) => {
            member.guild.members.fetch();
        });
        this.plugins = new Discord.Collection();
        this.database = database;
        this.prefix = defaultPrefix;
        this.owner = owner;
    }
    addPlugin(plugin) {
        this.plugins.set(plugin.name, plugin);
    }
    checkRoles(member, commandPerms) {
        if (commandPerms.includes("@everyone")) return true;
        for (const perm of commandPerms) {
            if (member.roles.cache.has(perm)) return true;
        }
        return false;
    }

    handle(msg) {
        const gID = msg.guild.id;
        let content = msg.content;
        const member = msg.member;
        if (msg.guild) {
            this.database.getGuild(gID, this.prefix).then((response) => {
                const { prefix, enabled } = response;
                if (content.startsWith(prefix)) {
                    content = content.substring(prefix.length);
                    for (const plugin of enabled) {
                        this.database.getGuildPluginAliasesAndPerms(gID, plugin, this.plugins.get(plugin).aliases, this.plugins.get(plugin).perms).then((response) => {
                            const { aliases, perms } = response;
                            if (this.plugins.has(plugin)) {
                                this.plugins.get(plugin).forEach((command, commandName) => {
                                    for (const alias of aliases[commandName]) {
                                        if (content.toLowerCase().split(' ')[0] == alias) {
                                            if (member.permissions.bitfield & 40 || this.checkRoles(member, perms[commandName]) || member.id == this.owner) {
                                                command.message(content.substring(alias.length + 1), member, msg.channel, msg.guild, msg, this);
                                            }
                                        }
                                    }
                                });
                            }
                        });
                    }
                }
            });
        }
    }
}

class Plugin extends Discord.Collection {
    constructor(name="", description="") {
        super();
        this.name = name;
        this.description = description;
        this.perms = {}
        this.aliases = {}
    }
    addCommand(command) {
        command.plugin = this.name;
        this.perms[command.name] = command.perms;
        this.aliases[command.name] = command.aliases;
        this.set(command.name, command);
    }
}

class Command {
    constructor(name="", aliases=[], usage="", description="", everyoneDefault=false) {
        this.name = name;
        this.aliases = aliases.concat([name]);
        this.usage = usage;
        this.description = description;
        this.perms = everyoneDefault ? ["@everyone"] : [];
        this.plugin = null;
    }
    selfHelp(channel, guild, handler) {
        const reply = new Discord.RichEmbed()
            .setTitle(`Help: ${this.name}`)
            .setThumbnail(handler.user.avatarURL)
            .addField("Usage", this.usage)
            .addField("Description", this.description)
            .setDescription(this.plugin);
        handler.database.getGuildPluginAliasesAndPerms(guild.id, this.plugin, handler.plugins.get(this.plugin).aliases, handler.plugins.get(this.plugin).perms).then(async (response) => {
            const { aliases, perms } = response;
            reply.addField("Aliases",  aliases[this.name].join(", "));
            const roles = [];
            for (const role of perms[this.name]) {
                let roleResolve = guild.roles.resolve(role);
                if (roleResolve) roles.push(roleResolve.toString());
                if (role == "@everyone") roles.push("@everyone");
            }
            if (roles.length > 0) reply.addField("Permissions", roles.join(", "));
            channel.send(reply);
       });
    }
    message(content, member, channel, guild, message, handler) { }
}

class RichEmbed extends Discord.MessageEmbed {
	constructor() {
		super();
		this.setTimestamp();
		this.setFooter("Wagyourtail 2020. bit.ly/QualityBot2");
	}
}

Discord.RichEmbed = RichEmbed;
module.exports = Discord;
module.exports.Plugin = Plugin;
module.exports.Client = Client;
module.exports.Command = Command;
