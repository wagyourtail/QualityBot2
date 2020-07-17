const Discord = require("../../CommandHandler2.js");

class SecretPhrase extends Discord.Command {
    constructor() {
        super("secretphrase", [], "SecretPhrase list\nSecretPhrase add **role** \"**phrase**\"\nSecretPhrase del \"**phrase**\"", "change phrases that give users roles\n**role** is required\n**phrase** is required and must be in double-quotes.", false);
    }
    message(content, member, channel, guild, message, handler) {
        switch(content.split(' ')[0]) {
            case "list":
                handler.database.getGuildPluginData(guild.id, this.plugin, {roles:{}}).then((response) => {
                    const reply = new Discord.RichEmbed()
                        .setTitle("SecretPhrase: List");
                    const mappings = [];
                    for (const [key, value] of Object.entries(response.roles)) {
                        const role = guild.roles.resolve(value);
                        if (role) {
                            mappings.push(`\`${key.toLowerCase()}\` -> ${role}`);
                            if (key.toLowerCase() != key) {
                                delete response.roles[key];
                                response.roles[key.toLowerCase()] = value;
                            }
                        } else {
                            delete response.roles[key];
                        }
                    }
                    if (mappings.length) reply.setDescription(mappings.join('\n'));
                    channel.send(reply);
                    handler.database.setGuildPluginData(guild.id, this.plugin, response);
                });
                break;
            case "add":
                handler.database.getGuildPluginData(guild.id, this.plugin, {roles:{}}).then((response) => {
                    const reply = new Discord.RichEmbed()
                        .setTitle("SecretPhrase: Add");
                    const matches = content.match(/[^\d]*?(\d+)[^"]*?"([^\"]+)/);
                    const role = guild.roles.resolve(matches?.[1])
                    if (role) {
                        response.roles[matches[2].toLowerCase()] = matches[1];
                        reply.addField("Success", `\`${matches[2].toLowerCase()}\` -> ${role}`);
                    } else {
                        reply.addField("Fail", "failed to parse role/phrase");
                    }
                    handler.database.setGuildPluginData(guild.id, this.plugin, response);
                    channel.send(reply);
                    if (response.message) updateMessage(guild, response);
                });
                break;
            case "del":
                handler.database.getGuildPluginData(guild.id, this.plugin, {roles:{}}).then((response) => {
                    const reply = new Discord.RichEmbed()
                        .setTitle("SecretPhrase: Del");
                    const matches = content.match(/[^"]*?"([^\"]+)/);
                    if (matches) {
                        delete response.roles[matches[1].toLowerCase()];
                        reply.addField("Success", `\`${matches[1].toLowerCase()}\` no longer assigned.`);
                    } else {
                        reply.addField("Fail", "failed to parse **phrase** or is not assigned.");
                    }
                    handler.database.setGuildPluginData(guild.id, this.plugin, response);
                    channel.send(reply);
                });
                break;
            default:
                this.selfHelp(channel, guild, handler);
        }
    }
}

class SecretPhrasePL extends Discord.Plugin {
    constructor() {
        super("SecretPhrase", "use a secret phrase in order to gain a role in servers that have this enabled.");
        this.addCommand(new SecretPhrase());
    }
}

module.exports.load = function (client) {
    client.addPlugin(new SecretPhrasePL());

    client.on("message", (message) => {
        client.database.getGuild(message.guild.id, client.prefix).then((response) => {
            if (response.enabled.includes("SecretPhrase")) {
                client.database.getGuildPluginData(message.guild.id, "SecretPhrase", {roles:{}}).then(data => {
                    if (data.roles[message.content.toLowerCase()]) {
                        message.member.addRole(data.roles[message.content.toLowerCase()]);
                    }
                });
            }
        });
    });
}
