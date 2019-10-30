'use strict';
const redis = require('redis');
const db = redis.createClient({db: 1});

module.exports.guildLength = function() {
    return new Promise((resolve, reject) => {
        db.scard("Guilds", (err, reply) => {
            resolve(reply);
        });
    });
}

module.exports.getGuilds = function() {
    return new Promise((resolve, reject) => {
        db.smembers("Guilds", (error, reply) => {
            resolve(reply);
        });
    });
}

module.exports.getGuild = function(guildID, prefix) {
    return new Promise((resolve, reject) => {
        db.sismember("Guilds", guildID, (error, reply) => {
            if (reply == 0) {
                db.set(`Guilds:${guildID}`, `{ "prefix": "${prefix}", "enabled": ["Default"] }`);
                db.sadd("Guilds", guildID);
                resolve({prefix:prefix, enabled:["Default"]});
            } else {
                db.get(`Guilds:${guildID}`, (error, reply) => {
                    const data = JSON.parse(reply);
                    resolve(data);
                });
            }
        });
    });
}

module.exports.checkGuildPlugin = function(guildID, plugin) {
    return new Promise((resolve, reject) => {
        db.sismember(`Guilds:${guildID}:Plugins`, plugin, (error, reply) => {
            if (reply == 0) resolve(false);
            else resolve(true);
        });
    });
}

module.exports.getGuildPluginAliasesAndPerms = function(guildID, plugin, defaultPluginAliases, defaultPluginPerms) {
    return new Promise((resolve, reject) => {
        db.sismember(`Guilds:${guildID}:Plugins`, plugin, (error, reply) => {
            if (reply == 0) {
                db.hmset(`Guilds:${guildID}:Plugins:${plugin}`, "Alias", JSON.stringify(defaultPluginAliases), "Perms", JSON.stringify(defaultPluginPerms));
                db.sadd(`Guilds:${guildID}:Plugins`, plugin);
                resolve({aliases:defaultPluginAliases, perms:defaultPluginPerms});
            } else {
                db.hmget(`Guilds:${guildID}:Plugins:${plugin}`, "Alias", "Perms", (err, res) => {
                    try {
                        resolve({aliases:Object.assign(defaultPluginAliases, JSON.parse(res[0])), perms:Object.assign(defaultPluginPerms, JSON.parse(res[1]))});
                    } catch(e) {
                        console.log(err);
                    }
                });
            }
        });
    });
}

module.exports.getGuildPluginData = function(guildID, plugin, defaultData) {
    return new Promise((resolve, reject) => {
        db.hget(`Guilds:${guildID}:Plugins:${plugin}`, "Data", (error, reply) => {
            if (reply) {
                resolve(JSON.parse(reply));
            } else {
                db.hset(`Guilds:${guildID}:Plugins:${plugin}`, "Data", JSON.stringify(defaultData));
                resolve(defaultData);
            }
        });
    });
}

module.exports.setGuildPluginData = function(guildID, plugin, data) {
    db.hset(`Guilds:${guildID}:Plugins:${plugin}`, "Data", JSON.stringify(data));
}

module.exports.setGuildPluginAliases = function(guildID, plugin, aliasesObject) {
    db.hset(`Guilds:${guildID}:Plugins:${plugin}`, "Alias", JSON.stringify(aliasesObject));
}

module.exports.setGuildPluginPerms = function(guildID, plugin, permsObject) {
    db.hset(`Guilds:${guildID}:Plugins:${plugin}`, "Perms", JSON.stringify(permsObject));
}

module.exports.setGuildPrefix = function(guildID, prefix) {
    db.get(`Guilds:${guildID}`, (error, reply) => {
        const data = JSON.parse(reply);
        data.prefix = prefix;
        db.set(`Guilds:${guildID}`, JSON.stringify(data));
    });
}

module.exports.setGuildEnabled = function(guildID, plugins) {
    db.get(`Guilds:${guildID}`, (error, reply) => {
        const data = JSON.parse(reply);
        data.enabled = plugins;
        db.set(`Guilds:${guildID}`, JSON.stringify(data));
    });
}

/* token and secret for bot id */
module.exports.getClients = function() {
    return new Promise((resolve, reject) => {
        db.smembers("Secrets", (err, reply) => {
            resolve(reply);
        });
    });
}

module.exports.getClientToken = function(clientID) {
    return new Promise((resolve, reject) => {
        db.sismember("Secrets", clientID, (err, reply) => {
            if (reply == 0)
                reject("Bot Not Found");
            else {
                db.hget(`Secrets:${clientID}`, "Token", (err, reply) => {
                    resolve(reply);
                });
            }
        });
    });
}

module.exports.getClientSecret = function(clientID) {
    return new Promise((resolve, reject) => {
        db.sismember("Secrets", clientID, (err, reply) => {
            if (reply == 0)
                reject("Bot Not Found");
            else {
                db.hget(`Secrets:${clientID}`, "Secret", (err, reply) => {
                    resolve(reply);
                });
            }
        });
    });
}


//these functions are specifically for the MemberRank plugin.

module.exports.guildMemberAddEXP = function(guildID, plugin, member, increment) {
    db.zadd(`Guilds:${guildID}:Plugins:${plugin}:Data:EXPList`, "INCR", increment, member);
}

module.exports.getRanks = function(guildID, plugin, start, count) {
    return new Promise((resolve, reject) => {
        //ZREVRANGEBYSCORE myset +inf -inf WITHSCORES LIMIT 0 1
        db.zrevrangebyscore(`Guilds:${guildID}:Plugins:${plugin}:Data:EXPList`, "+inf", "-inf", "WITHSCORES", "LIMIT", start, count, (err, res) => {
            const result = []
            for(let i = 0; i < res.length; i++) {
                result.push({member:res[2*i], score:res[2*i+1]});
            }
            resolve(result);
        });
    });
}

module.exports.getUserCount = function(guildID, plugin) {
    return new Promise((resolve, reject) => {
        db.zcard(`Guilds:${guildID}:Plugins:${plugin}:Data:EXPList`, (err, res) => {
            resolve(res);
        });
    });
}

module.exports.deleteUser = function(guildID, plugin, member) {
    db.zrem(`Guilds:${guildID}:Plugins:${plugin}:Data:EXPList`, member);
    db.hdel(`Guilds:${guildID}:Plugins:${plugin}:Data:MsgTime`, member);
}

module.exports.getGuildMemberEXP = function(guildID, plugin, member) {
    return new Promise((resolve, reject) => {
        db.zrevrank(`Guilds:${guildID}:Plugins:${plugin}:Data:EXPList`, member, (err, rank) => {
            db.zscore(`Guilds:${guildID}:Plugins:${plugin}:Data:EXPList`, member, (err, score) => {
                if (score !== null) resolve({rank:rank, score:score});
                else resolve({rank: false, score:0});
            });
        });
    });
}

module.exports.getGuildMemberLastMessage = function(guildID, plugin, member) {
    return new Promise((resolve, reject) => {
        db.hget(`Guilds:${guildID}:Plugins:${plugin}:Data:MsgTime`, member, (err, reply) => {
            if (reply) resolve(reply);
            else resolve(0);
        });
    });
}

module.exports.setGuildMemberLastMessage = function(guildID, plugin, member, time) {
    db.hset(`Guilds:${guildID}:Plugins:${plugin}:Data:MsgTime`, member, time);
}
