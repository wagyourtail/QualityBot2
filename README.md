# QualityBot

[Invite to server.](https://discordapp.com/api/oauth2/authorize?client_id=520769818870415380&scope=bot&permissions=8)

# Installing

```bash
apt install redis
git clone https://github.com/wagyourtail/QualityBot2.git

#get nodejs.

#add your bot token and secret to your database or just how login works in bot.js
redis-cli
>select 1
>sadd Secrets <clientid> #add your client id to list
>hmset Secrets:<clientid> Token <token> Secret <secret> #token is bot token, secret is the other one. 
>exit

nano bot.js #edit your client id
startnode.sh #this contains a while loop so if the bot crashes it'll restart.
# or if you installed pm2
pm2 start bot.js
```
