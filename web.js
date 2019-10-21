const express  = require('express');
const session  = require('express-session');
const passport = require('passport');
const Strategy = require('passport-discord').Strategy;
const request = require('request');
const database = require('./Database.js');
const crypto = require('crypto');
const app = express();

passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

const scopes = ['identify', 'email', 'guilds'];

app.set('view engine', 'pug');

database.getClientSecret('520769818870415380').then(secret => {
    passport.use(new Strategy({
        clientID: '520769818870415380',
        clientSecret: secret,
        callbackURL: 'http://wys1.root.sx:5000/callback',
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

app.param('guildID', (req, res, next, guildID) => {
    req.guildID = guildID;
    next();
});

app.param('pluginSlug', (req, res, next, pluginSlug) => {
    req.pluginSlug = pluginSlug;
    next();
});

app.use('/static',express.static('static'));

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

app.get('/', (req, res) => {
    res.render('index', {loginStatus: !!req.user, userAvatar: req.user ? `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png` : false, userName: req.user ? req.user.username : false});
});

app.get('/dashboard', checkAuth, (req, res) => {
    let adminGuilds = req.user.guilds.filter(guild => {return guild.permissions & 8});
    res.redirect(`/dashboard/${adminGuilds[0] ? adminGuilds[0].id : "null"}/null`);
});

app.get('/dashboard/:guildID/:pluginSlug', checkAuth, (req, res) => {
    const adminGuilds = req.user.guilds.filter(guild => {return guild.permissions & 8});
    res.render(`plugins/${req.pluginSlug}`, {guildID: req.guildID, adminGuilds: adminGuilds, loginStatus: !!req.user, userAvatar: req.user ? `https://cdn.discordapp.com/avatars/${req.user.id}/${req.user.avatar}.png` : false, userName: req.user ? req.user.username : false});
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
