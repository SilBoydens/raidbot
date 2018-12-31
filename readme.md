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

# commands

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
add more to readme  
config for send user ID's on raid  
config input validation  
config add list of users who should get dm's on command usage  
split in even more files  
website for config? (maybe)  
make code public (this is going to be fun)  