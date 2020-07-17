const Discord = require("../../CommandHandler2.js");

function getPoints(x) {
    if (x <= 30) {
        return 0;
    }
    if (x <= 60) {
        return Math.floor(x / 6);
    }
    if (x <= 86400) {
        return 10;
    }
    if (x > 86400) {
        return Math.floor(604800 / x);
    }
}

class MRRole extends Discord.Command {
    constructor() {
        super("mrrole", [], "mrrole list\nmrrole add **top** **role**\nmrrole del **top**", "set roles people get for their rank on the server.\n**role** is required and must resolve to a role.\n**top** is required and must be either the rank or a number followed by a % for one that changes based on the number of people in the server", false);
    }
    message(content, member, channel, guild, message, handler) {
        switch(content.split(' ')[0]) {
            case "list":
                handler.database.getGuildPluginData(guild.id, this.plugin, {static:{}, dynamic:{}}).then(data => {
                    const reply = new Discord.RichEmbed()
                        .setTitle("MemberRankRole: list");
                    if (Object.keys(data.static).length) reply.addField("Static", Object.keys(data.static).filter(d => guild.roles.cache.has(data.static[d])).map(d => `Top ${d}: ${guild.roles.cache.get(data.static[d])}`).join('\n'));
                    if (Object.keys(data.dynamic).length) reply.addField("Dynamic", Object.keys(data.dynamic).filter(d => guild.roles.cache.has(data.dynamic[d])).map(d => `Top ${d}%: ${guild.roles.cache.get(data.dynamic[d])}`).join('\n'));
                    channel.send(reply);
                });
                break;
            case "add":
                handler.database.getGuildPluginData(guild.id, this.plugin, {static:{}, dynamic:{}}).then(data => {
                    const match = content.match(/(?:(\d+)%|(\d+))[^\d]+?(\d+)/);
                    const reply = new Discord.RichEmbed()
                        .setTitle("MemberRankRole: add");
                    if (match) {
                        if (match[1] && guild.roles.cache.has(match[3])) {
                            data.dynamic[match[1]] = match[3];
                            reply.addField("Success", `Top ${match[1]}%: ${guild.roles.cache.get(match[3])}`);
                            handler.database.setGuildPluginData(guild.id, this.plugin, data);
                        } else if (match[2] && guild.roles.cache.has(match[3])) {
                            data.static[match[2]] = match[3];
                            reply.addField("Success", `Top ${match[2]}: ${guild.roles.cache.get(match[3])}`);
                            handler.database.setGuildPluginData(guild.id, this.plugin, data);
                        } else {
                            reply.addField("Failed", "**role** didn't parse.");
                        }
                    } else {
                        reply.addField("Failed", "**top** or **role** didn't parse.");
                    }
                    channel.send(reply);
                });
                break;
            case "del":
                handler.database.getGuildPluginData(guild.id, this.plugin, {static:{}, dynamic:{}}).then(data => {
                    const match = content.match(/(?:(\d+)%|(\d+))/);
                    const reply = new Discord.RichEmbed()
                        .setTitle("MemberRankRole: del");
                    if (match) {
                        if (match[1] && data.dynamic[match[1]]) delete data.dynamic[match[1]];
                        if (match[2] && data.static[match[2]]) delete data.static[match[2]];
                        handler.database.setGuildPluginData(guild.id, this.plugin, data);
                    } else {
                        reply.addField("Failed", "**top** didn't parse.");
                    }
                });
                break;
            default:
                this.selfHelp(channel, guild, handler);
        }
    }
}
class MRXP extends Discord.Command {
    constructor() {
        super("mrxp", [], "mrxp `user`", "shows user xp level.\n`user` is optional.", true);
    }
    message(content, member, channel, guild, message, handler) {
        const match = content.match(/[^\d]*(\d+)/)
        const reply = new Discord.RichEmbed()
            .setTitle("MemberRankXP");
        if (match && guild.members.cache.has(match[1])) {
            reply.setDescription(guild.members.get(match[1]));
            handler.database.getGuildMemberEXP(guild.id, this.plugin, match[1]).then(res => {
                reply.addField(`Rank: #${res.rank === false ? guild.members.size : res.rank + 1}`, `\`${res.score}\` xp`);
                channel.send(reply);
            });
        } else {
            reply.setDescription(member);
            handler.database.getGuildMemberEXP(guild.id, this.plugin, member.id).then(res => {
                reply.addField(`Rank: #${res.rank === false ? guild.members.size : res.rank + 1}`, `\`${res.score}\` xp`);
                channel.send(reply);
            });
        }
    }
}

class MRAdjust extends Discord.Command {
    constructor() {
        super("mradjust", [], "mradjust add **user** **xp**\nmradjust sub **user** **xp**", "adjust xp of people.\n**user** is required.\n**xp** is required and must be a number.", false);
    }
    message(content, member, channel, guild, message, handler) {
        const match = content.match(/(add|sub) [^\d]*?(\d+)[^\d]+?(\d+)/)
        if (match) {
            const reply = new Discord.RichEmbed()
                .setTitle(`MemberRankAdjust: ${match[1]}`);
            if (guild.members.cache.has(match[2])) {
                handler.database.guildMemberAddEXP(guild.id, this.plugin, match[2], match[1] == "add" ? parseInt(match[3]) : -parseInt(match[3]));
                reply.addField("Success", `${match[1] == "add" ? "added" : "subtracted"} ${match[3]} xp from ${guild.members.get(match[2])}`);
            } else {
                reply.addField("Failed", "**User** did not parse.");
            }
            channel.send(reply);
        } else {
            this.selfHelp(channel, guild, handler);
        }
    }
}

class MRTop extends Discord.Command {
    constructor() {
        super("mrtop", [], "mrtop `page`", "top ranks.\n`page` is optional.", true);
    }
    message(content, member, channel, guild, message, handler) {
        content = parseInt(content) ? parseInt(content) - 1 : 0;
        if (content < 0) content = 0;
        handler.database.getRanks(guild.id, this.plugin, content*10, 10).then(async (members) => {
            const reply = new Discord.RichEmbed()
                .setTitle("MemberRank: Top")
                .addField("Page: ", `${content+1}/${Math.ceil((await handler.database.getUserCount(guild.id, this.plugin))/10)}`);
            let i = content*10;
            const ranks = []
            for (const memb of members) {
                if (guild.members.cache.has(memb.member)) {
                    ranks.push(`**${++i}**: ${guild.members.get(memb.member)}: ${memb.score}`);
                } else {
                    handler.database.deleteUser(guild.id, "MemberRank", memb.member);
                }
            }
            reply.setDescription(ranks.join('\n'));
            channel.send(reply);
        });
    }
}

class MemberRankPL extends Discord.Plugin {
    constructor() {
        super("MemberRank", "Give members XP for typing.");

        this.addCommand(new MRRole());
        this.addCommand(new MRTop());
        this.addCommand(new MRAdjust());
        this.addCommand(new MRXP());
    }
}

function updateMember(member, guild, client) {
    return new Promise((resolve, reject) => {
        client.database.getGuildPluginData(guild.id, "MemberRank", {static:{}, dynamic:{}}).then(async (ranks) => {
            const userRank = await client.database.getGuildMemberEXP(guild.id, "MemberRank", member.id);
            ++userRank.rank;
            for (const [rank, role] of Object.entries(ranks.static)) {
                if (userRank.rank <= rank && guild.roles.cache.has(role) && !member.roles.cache.has(role)) member.addRole(role);
                if (userRank.rank > rank && guild.roles.cache.has(role) && member.roles.cache.has(role)) member.removeRole(role);
            }
            const userCount = await client.database.getUserCount(guild.id, "MemberRank");
            for (const [rank, role] of Object.entries(ranks.dynamic)) {
                if (userRank.rank <= (userCount * rank / 100) && guild.roles.cache.has(role) && !member.roles.cache.has(role)) member.addRole(role);
                if (userRank.rank > (userCount * rank / 100) && guild.roles.cache.has(role) && member.roles.cache.has(role)) member.removeRole(role);
            }
            resolve(userRank.rank);
        });
    });
}

module.exports.load = function (client) {
    client.addPlugin(new MemberRankPL());

    client.on("message", (msg) => {
        if (!msg.author.bot) {
            client.database.getGuild(msg.guild.id).then(async (data) => {
                if (data.enabled.includes("MemberRank")) {
                    const time = (msg.createdTimestamp - (await client.database.getGuildMemberLastMessage(msg.guild.id, "MemberRank", msg.author.id))) / 1000;
                    if (time > 30) {
                        client.database.guildMemberAddEXP(msg.guild.id, "MemberRank", msg.author.id, getPoints(time));
                        client.database.setGuildMemberLastMessage(msg.guild.id, "MemberRank", msg.author.id, msg.createdTimestamp);
                        updateMember(msg.member, msg.guild, client).then(async (rank) => {
                            const member = (await client.database.getRanks(msg.guild.id, "MemberRank", rank, 1))[0];
                            if (member && msg.guild.members.cache.has(member.member)) updateMember(msg.guild.members.get(member.member), msg.guild, client);
                            else if (member) client.database.deleteUser(msg.guild.id, "MemberRank", member.member);
                        });
                    }
                }
            });
        }
    });
}
