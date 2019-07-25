/* jshint esversion: 6 */
require('dotenv').load();
/* require envs:
  RAIDBOT_TOKEN
  DB_FILE
  CONFIG_FILE
*/
const Discord = require('discord.js');
const client = new Discord.Client();
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
// config is kept in ram, but is writen to disk on changes
client.db = new sqlite3.Database(process.env.DB_FILE);
client.config = require(process.env.CONFIG_FILE);
let guilds = []; // list of guilds for dbclean job

/**
 * in zombie mode, the bot doesn't talk or do anything at all, it only logs everything it should do to the console.
 * used for development, so the bot doesn't send doubles
 * node ./raidbot.js zombie
 */

client.zombie = process.argv.includes("zombie");

const {util} = require('./util.js');

// our friendly neighbourhood command handler
client.commands = new Discord.Collection();
fs.readdir("./commands/", (e, files) => {
  if(error) throw err;
  files.forEach(file => {
      if (!file.endsWith(".js")) return;
      const properties = require(`./commands/${file}`);
      const commandName = file.split(".")[0];
      client.commands.set(commandName, properties);
  });
});

process.on('uncaughtException', e => {
  console.error('Caught exception: ' + e);
  util.sendErrors(client, {content: 'uncaughtException in global'}, e);
});

client.on('ready', () => {
  /**
   * i don't care about old messages as i use the sqlite to keep track
   * because of low ram on the vps, every minute, clear all messages older then a minute
   * yes, sweeping messages clears more memory then the ramdisk uses
   */
  setInterval(() => {
    client.sweepMessages(60);
  }, 60000);
  console.log(`Logged in as ${client.user.tag}!`);
  console.log(`serving ${client.guilds.size} guilds:`);
  client.guilds.map(guild => {
    util.createTable(client, guilds, guild.id);
    console.log('*', guild.name);
  });
  client.user.setActivity("helping moderators");
  // clean the sqlite db every hour
  setInterval(() => {
    util.cleanDB(guilds);
  }, 60 * 60 * 1000);
  setTimeout(() => {
    /**
     * for when lockdown locks out the moderators.... has happened..... LOL
     * client.commands.get('lockdown').execute(client, msg, ['off']);
     */
  }, 5000);
});

client.on('message', msg => {
  if(msg.author.bot) return; // don't listen to other bots
  if(client.zombie) { // prevent the dev bot from talking
    let send = function (args) {console.log(`Trying to send message while in zombie mode: \n`, args);};
    msg.reply = send;
    msg.channel.send = send;
  };
  let prefix;
  const prefixes = [`<@${client.user.id}> `, `<@!${client.user.id}> `];
  for(const aPrefix of prefixes) {
    if(msg.content.startsWith(aPrefix)) prefix = (!msg.guild) ? '' : aPrefix; // no prefix in DMs
  }
  if(!aPrefix && !msg.channel.guild) return;
  const args = msg.content.slice(prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  const cmd = client.commands.get(command);
  if(msg.guild) {
    if (!guilds.includes(msg.guild.id)) util.createTable(client, guilds, msg.guild.id);
    if(!prefix) return;
    if(!cmd) return;
    util.log(client, msg);
    util.createConfig(msg.guild.id, msg);
    util.logCommands(client, msg);
    if(util.isAllowed(client, msg, command)) {
      try {
        cmd.execute(client, msg, args);
      } catch (e) {
        msg.channel.send('Something went wrong. 😢');
        console.error(e);
        util.sendErrors(client, msg, e);
      };
    };
  } else {
    if(msg.author.bot) return;
    if(!cmd) {
      return msg.channel.send('👀 You seem to be needing some help\nhttps://github.com/SilBoydens/raidbot/blob/master/readme.md');
    }
    if(cmd.dm) {
      try {
        cmd.execute(client, msg, args)
      } catch(e) {
        console.log(e);
        util.sendErrors(client, msg, e);
      }
    } else {
      return msg.channel.send('Want help? send anything in here that is not a command');
    }
  }
});

client.login('BOT ' + process.env.RAIDBOT_TOKEN);
