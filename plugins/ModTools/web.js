const db = require('../../Database.js');
const Discord =require('../../DiscordAPI.js');

module.exports.get = function(guildID) {
    return new Promise(async (res, rej) => {
        const data = await db.getGuildPluginAliasesAndPerms(guildID, "ModTools", {"logchannel":["logchannel"], "muterole":["muterole"], "mute":["mute"], "unmute":["unmute"], "prune":["prune"], "warn":["warn"], "kick":["kick"], "ban":["ban"], "unban":["unban"]}, {"logchannel":[], "muterole":[], "mute":[], "unmute":[], "prune":[], "warn":[], "kick":[], "ban":[], "unban":[]});
        data.roles = await Discord.getGuildRoles(guildID);
        res(data);
    });
}

module.exports.put = function(guildID, data) {
    return new Promise(async (res, rej) => {
        Discord.getGuildRoles(guildID).then(roles => {
            const rolesByName = {};
            for (const [id, val] of Object.entries(roles)) {
                rolesByName[val.name.replace('@', '')] = id;
            }
            const commands = Object.keys(data).filter(d => d.endsWith("aliases")).map(d => d.replace(".aliases", ""));
            const perms = {};
            const aliases = {};
            for (const command of commands) {
                aliases[command] = [].concat(data[`${command}.aliases`]).map(d => d.replace(/\s/g, "")).filter(d => d != "");
                perms[command] = [].concat(data[`${command}.perms`]).map(d => rolesByName[d.replace('@', '')]).filter(d => d);
            }
            db.setGuildPluginAliases(guildID, "ModTools", aliases);
            db.setGuildPluginPerms(guildID, "ModTools", perms);
            res();
        });
    });
}
