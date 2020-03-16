# Template Plugin

Rename all PluginName file/folder names to the name of your plugin (no spaces, case sensitive, please use capital first letter on all).

[Join The Discord For More Info.](https://discord.gg/UCP6pnf)

# Creating a Plugin

`./plugins/PluginName/PluginName.js` has some basic example code currently in it to show how the structure of the plugin and command should be layed out.
`./plugins/PluginName/web.js` needs its permissions and default groups updated in order to not have issues with the website.
`./views/plugins/PluginName.pug` should have it's description updated with a short plugin description.
`./views/plugins/PluginName.css` can be left blank unless you want to add some non-standard parts to the plugin's webpage to control parts of the plugin's data online by changing the recieved/sent data in `web.js` and making an interface for it in `PluginName.pug`.
