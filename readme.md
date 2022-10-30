This bot helps moderators to stop and clean up raids. it does NOT prevent raid or stop raids itself, it always needs to be triggered by a moderator.

[Click here to invite the bot](<https://discordapp.com/oauth2/authorize?client_id=528531827246366760&permissions=268435460&scope=bot>)
[Help keep this bot online](<https://www.paypal.me/silboydens>) (with `raidbot` anywhere in the description)

I'm `@Sil#5262` on Discord and I can usually be found in the [MEE6 bot support server](<https://discord.gg/mee6>).

# Commands

By default only those with `Manage Server` permission can use the commands (an exception goes to `/config` where you require Administrator permission), you can overwrite this on Server Settings → Integrations → select `raidbot` under `Bots and Apps` and configure your desired command permissions.

## /raid

`/raid message <insert message here>`  
`/raid user <insert username here>`  

Will ban all users who talked in the last 5 minutes (configurable) with a message/username that starts with <insert xxx here>.

## /lockdown

`/lockdown`
`/lockdown off`

Enables or disables lockdown, you need to have `@everyone` in roles set to allow send messages and in channels on neutral or denied for this to work. as the command simply disables send messages permission in Server Settings → Roles → `@everyone`.

## /config

`/config` shows your server's current configuration, this is also an interactive message that allows you to modify the configuration.

# Selfhosting

## Setup

run the commands:
```bash
git clone git@github.com:SilBoydens/raidbot.git
cd raidbot
npm i
```

Rename `example.env` to `.env` and fill in the needed values.
For `DB_file` I would recomend using a ramdisk as there is no need to write this to the disk, if you want to use a ramdisk, read [ramdisk](#ramdisk).

## Running

If you're running the bot for the first time provide a `slash` argument to synchronize bot's commands with Discord:
```bash
node ./raidbot.js slash
```

In normal instances, just run:
```bash
node ./raidbot.js
```
There is no need to set up databases or anything else.

## Ramdisk

A ramdisk is a part of your ram that get's dedicated as a virtual disk, this reads and writes really fast but is volitile, meaning on a blackout you lose the content.

Execute these commands: (you can change /ram)
```bash
sudo mkdir -p /ram
sudo mount -t tmpfs -o size=2048M tmpfs /ram
```

And add this at the end of `/etc/fstab`:
```
none /ram tmpfs nodev,nosuid,noexec,nodiratime,size=2048M 0 0
```
and now you have a ramdisk at `/ram`.

# TODO

- [x] add more to readme

- [x] config input validation

- [x] split in even more files

- [ ] website for config? (maybe)
