const Discord = require("../../CommandHandler2.js"); //require commandhandler to use classes and all.

class CommandName extends Discord.Command {
    constructor() {
        super("commandname", ["aliases"], "command usage", "command description", false) //command name and aliases must be all lower case. boolean at end is if @everyone should be able to use command by default
    }
    message(content, member, channel, guild, message, handler) {
        //handle message and do stuff
    }
}

//initialize plugin
class PluginName extends Discord.Plugin {
    constructor() {
        super("PluginName", "plugin description. (not currently used)");
        this.addCommand(new CommandName()); //add command to plugin
    }
}

module.exports.load = function(client) {
    client.addPlugin(new PluginName()); //add plugin to the bot
    //you can also put stuff to directly to the discordjs client event emmiter if you need access to it  ie.
    client.on("messageUpdate", (old, new) => {});
}