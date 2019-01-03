# raidbot

This bot helps moderators to stop and clean up raids.  
This bot does NOT prevent raid or stop raids itself.  
It always needs to be triggered by a moderator.  

**invite the bot:**  
https://discordapp.com/oauth2/authorize?client_id=528531827246366760&permissions=268435460&scope=bot  
**help keep this bot online:**  
https://www.paypal.me/silboydens
(with `raidbot` anywhere in the description)  
**contact me:**  
i'm `@Sil#5262` on discord and i can usually be found in the MEE6 bot support server (discord.gg/mee6)

# commands for dm
commands in dm have no prefix, just send the command

## changelog
sending `changelog` in a dm to the bot will let you opt-in or opt-out of receving updates

## help
send anything that the bot does not understand as a command and it will give you the help message.... link to this

# commands for guilds

all commands start with `@raidbot#0165` (or when selfhosting, with the bots name)  
`@raidbot#0165 command arguments`

## raid

`@raidbot raid message <insert message here>`  
`@raidbot raid user <insert username here>`  
will ban all users who talked in the last 5 minutes (configurable) with a message/username that starts with <insert xxx here>

## lockdown

`@raidbot lockdown`  
`@raidbot lockdown off`  
enables or disables lockdown  
you need to have @everyone in roles set to allow send messages and in channels on neutral or denied

## config

`@raidbot config [list/add/remove/set] module setting [value]`  
(module means command)  

to add roles that can use the commands:  
`@raidbot config add raid allowed_roles <role_here>`  
`@raidbot config add lockdown allowed_roles <role_here>`  
(you need admin perms to use the "config" command, you can't set allowed roles for config)

# TODO
slowmode
add more to readme  
config input validation  
config add list of users who should get dm's on command usage  
split in even more files  
website for config? (maybe)  

# selfhosting

## setup
run the commands:
```bash
git clone git@github.com:SilBoydens/raidbot.git
cd raidbot
npm i
```

copy `raidbot_default.json` to `raidbot.json` and fill in your userID  
copy `example.env` to `.env` and fill in the needed values  
for `DB_file` i would recomend using a ramdisk as there is no need to write this to the disk, if you want to use a ramdisk, read ## ramdisk

## running the bot
just run
```bash
node ./raidbot.js
```
there is no need to set up databases or anything else


## ramdisk
a ramdisk is a part of your ram that get's dedicated as a virtual disk, this reads and writes really fast but is volitile, meaning on a blackout you lose the content.

execute these commands (you can change /ram)
```bash
sudo mkdir -p /ram
sudo mount -t tmpfs -o size=2048M tmpfs /ram
```

and add this at the end of `/etc/fstab`
```
none /ram tmpfs nodev,nosuid,noexec,nodiratime,size=2048M 0 0
```
and now you have a ramdisk at `/ram`