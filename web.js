const express  = require('express');
const session  = require('express-session');
const passport = require('passport');
const Strategy = require('passport-discord').Strategy;
const database = require('./Database.js');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const scopes = ['identify', 'email', 'guilds'];
const plugins = fs.readdirSync("./plugins");

passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

app.set('view engine', 'pug');

database.getClientSecret('520769818870415380').then(secret => {
    passport.use(new Strategy({
        clientID: '520769818870415380',
        clientSecret: secret,
        callbackURL: 'https://qualitybot.xyz/callback',
        scope: scopes
    }, (accessToken, refreshToken, profile, done) => {
        process.nextTick(() => {
            return done(null, profile);
        });
    }));
});

app.use(session({
    secret: crypto.randomBytes(7).toString('base64'),
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/static',express.static('static'));

app.param('guildID', (req, res, next, guildID) => {
    req.guildID = guildID;
    next();
});

app.param('pluginSlug', (req, res, next, pluginSlug) => {
    req.pluginSlug = pluginSlug;
    next();
});

app.get('/login', passport.authenticate('discord', { scope: scopes }), (req, res) => {});

app.get('/callback',
    passport.authenticate('discord', { failureRedirect: '/' }), (req, res) => { res.redirect('/dashboard')
});

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

function checkAuth(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/');
}

app.get('/', async (req, res) => {
    res.render('index', {guildLength: await database.guildLength(), loginStatus: !!req.user, userAvatar: req.user ? `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png` : false, userName: req.user ? req.user.username : false});
});

app.get('/dashboard', checkAuth, async (req, res) => {
    const guilds = req.user.id == "100748674849579008" ? req.user.guilds : req.user.guilds.filter(guild => {return guild.permissions & 8});
    const botGuilds = await database.getGuilds();
    const adminGuilds = guilds.filter(guild => botGuilds.includes(guild.id));
    res.redirect(`/dashboard/${adminGuilds[0] ? adminGuilds[0].id : "null"}/null`);
});

app.post('/dashboard/:guildID/:pluginSlug', checkAuth, async (req, res) => {
    const guilds = req.user.id == "100748674849579008" ? req.user.guilds : req.user.guilds.filter(guild => {return guild.permissions & 8});
    const botGuilds = await database.getGuilds();
    const adminGuilds = guilds.filter(guild => botGuilds.includes(guild.id));

    if (plugins.includes(req.pluginSlug) && adminGuilds.filter(g => g.id == req.guildID).length) {
        await require(`./plugins/${req.pluginSlug}/web.js`).put(req.guildID, req.body);
        res.redirect(`/dashboard/${req.guildID}/${req.pluginSlug}`);
    } else {
        res.redirect("/dashboard");
    }
})

app.get('/dashboard/:guildID/:pluginSlug', checkAuth, async (req, res) => {
    const guilds = req.user.id == "100748674849579008" ? req.user.guilds : req.user.guilds.filter(guild => {return guild.permissions & 8});
    const botGuilds = await database.getGuilds();
    const adminGuilds = guilds.filter(guild => botGuilds.includes(guild.id));
    if (plugins.includes(req.pluginSlug) && adminGuilds.filter(g => g.id == req.guildID).length) {
        const pluginData = await require(`./plugins/${req.pluginSlug}/web.js`).get(req.guildID);
        res.render(`plugins/${req.pluginSlug}`, {guildLength: await database.guildLength(), pluginData: pluginData, guildID: req.guildID, pluginSlug:req.pluginSlug, adminGuilds: adminGuilds, loginStatus: !!req.user, userAvatar: req.user ? `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png` : false, userName: req.user ? req.user.username : false});
    } else if (req.guildID == "null") {
        res.render("noguild", {guildLength: await database.guildLength(), pluginData: {aliases:{}}, guildID: req.guildID, pluginSlug:req.pluginSlug, adminGuilds: adminGuilds, loginStatus: !!req.user, userAvatar: req.user ? `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png` : false, userName: req.user ? req.user.username : false})
    } else {
        res.redirect("/dashboard");
    }

});

app.get('/info', checkAuth, (req, res) => {
    //console.log(req.user)
    res.json(req.user);
});

app.get('*', checkAuth, function(req, res) {
    res.redirect('/dashboard');
});

app.listen(5000, function (err) {
    if (err) return console.log(err);
    console.log('Listening at http://localhost:5000/');
});
