/*jshint esversion: 6 */
require('dotenv').load();
/* require envs:
  RAIDBOT_TOKEN
  DB_FILE
  CONFIG_FILE
*/
const Discord = require('discord.js');
const client = new Discord.Client();
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(process.env.DB_FILE);
// config is kept in ram, but is writen to disk on changes
var config = require(process.env.CONFIG_FILE);
var guilds = []; // list of guilds for dbclean job
// in zombie mode, the bot doesn't talk or do anything at all, it only logs everything it should do to the console.
// used for development, so the bot doesn't send doubles
// node ./raidbot.js zombie
const zombie = process.argv.includes("zombie");

process.on('uncaughtException', function(e) {
  console.error('Caught exception: ' + e);
  senderrors({content: 'uncaughtException in global'}, e);
});

/* ###### COMMANDS ###### */

function raid(msg) {
  if (msg.content.split(' ')[3]) {
    var message = "[raid]userid list: ```";
    var sql;
    var guildid = msg.guild.id;
    var term = msg.content.split(' ');
    term.splice(0, 3);
    term = term.join(' ');
    var time = new Date(new Date().getTime() - ((config[msg.guild.id].raid.lookback | 5) * 60 * 1000)).getTime();
    if (['user', 'name'].includes(msg.content.split(' ')[2].toLowerCase())) {
      sql = `SELECT userid, username FROM g${guildid} WHERE username LIKE '${term}%' AND timestamp > ${time} GROUP BY userid`;
    } else if (['message'].includes(msg.content.split(' ')[2].toLowerCase())) {
      sql = `SELECT userid, username FROM g${guildid} WHERE message LIKE '${term}%' GROUP BY userid`;
    } else {
      msg.reply('[raid]invalid\n either use a username or a message:\n`@server raid user username\n@server raid message messagecontent`');
      return;
    }
    console.log(sql);
    db.all(sql, function(err,rows) {
      console.log(rows);
      if (rows.length) {
        rows.forEach(row => {
          message = message + "\n" + row.userid;
        });
        msg.reply(message + "```\nif you think these are all raidbots, pls report them to discord on (<https://http//dis.gd/contact> => trust and safety => type: raiding) or directly to a discord trust and safety member");
        rows.forEach(row => {
          try {
            if (zombie) {
              console.log(`ban from ${msg.guild.id}: $row.userid`);
            } else {
              msg.guild.member(row.userid).ban({reason: 'raid', days: 7});
            }
          } catch (error) {
            console.error(error);
            // ban failed                    
          }
        });
      } else {
        msg.reply("[raid] nothing found");
      }
    });
  } else {
    msg.reply(`[raid] could not find enough arguments
      Usage:
      \`@${client.user.tag} raid user username\`
      \`@${client.user.tag} raid message messagecontent\`
    `);
  }
}

function lockdown(msg) {
  let everyone = msg.guild.roles.get(msg.guild.id);
  if (!msg.content.split(' ')[2]) {
    if(everyone.hasPermission("SEND_MESSAGES")) {
      try {
        if (!zombie) everyone.setPermissions(everyone.permissions - 0x800);
        var links = ['https://zippy.gfycat.com/CarelessSplendidKiskadee.webm', 'https://i.gifer.com/7DUg.mp4'];
        msg.reply(`server locked down\n${links[Math.floor(Math.random()*links.length)]}`);
      } catch(Exception) {
        msg.reply("something went wrong while locking down\nhttps://i.gifer.com/8urI.mp4");
      }
    } else {
      msg.reply("server already in lockdown state");
    }
  } else if (msg.content.split(' ')[2] && msg.content.split(' ')[2] === 'off') {
    if(!everyone.hasPermission("SEND_MESSAGES")) {
      try {
        if (!zombie) everyone.setPermissions(everyone.permissions + 0x800);
        msg.reply("unlocked the server");
      } catch(Exception) {
        msg.reply("something went wrong while unlocking");
      }
    } else {
      msg.reply("can not unlock, server is not locked");
    }
  } else {
    msg.reply('[lockdown] could not understand "' + msg.content.split(' ')[2] + '"\nUsage:\n`@server lockdown` lock the server down\n`@server lockdown off` disable lockdown');
  }
}

function settings(msg) {
  createconfig(msg.guild.id);
  // TODO implement
  if (!config[msg.guild.id][msg.content.split(' ')[3]]) {
    msg.reply(`invallid module name ${msg.content.split(' ')[3]}\n`+
      `the following modules exist:\n`+
      ` - ${Object.keys(config[msg.guild.id]).join('\n - ')}`);
    return;
  }
  if (!config[msg.guild.id][msg.content.split(' ')[3]][msg.content.split(' ')[4]]) {
    console.log(config[msg.guild.id][msg.content.split(' ')[3]]);
    msg.reply(`invallid setting ${msg.content.split(' ')[4]} for module ${msg.content.split(' ')[3]}\n`+
      `the following settings exist:\n`+
      ` - ${Object.keys(config[msg.guild.id][msg.content.split(' ')[3]]).join('\n - ')}`);
    return;
  }
  var response, value = '';
  switch(msg.content.split(' ')[2]) {
    case 'list':
      response = `the value(s) for ${msg.content.split(' ')[4]} in module ${msg.content.split(' ')[3]} is/are:\n - `;
      value = config[msg.guild.id][msg.content.split(' ')[3]][msg.content.split(' ')[4]];
      if (Array.isArray(value)) value = value.join('\n - ');
      msg.reply(response + value);
      break;
    case 'add':
      value = config[msg.guild.id][msg.content.split(' ')[3]][msg.content.split(' ')[4]];
      if (!Array.isArray(value)) {msg.reply('not a list, pls use \'set\''); return;}
      config[msg.guild.id][msg.content.split(' ')[3]][msg.content.split(' ')[4]].push(msg.content.split(' ')[5].match(/\d/g).join(''));
      response = `the the new value(s) for ${msg.content.split(' ')[4]} in module ${msg.content.split(' ')[3]} is/are:\n - `;
      value = config[msg.guild.id][msg.content.split(' ')[3]][msg.content.split(' ')[4]].join('\n - ');
      msg.reply(response + value);
      break;
    case 'remove':
      value = config[msg.guild.id][msg.content.split(' ')[3]][msg.content.split(' ')[4]];
      if (!Array.isArray(value)) {msg.reply('not a list, pls use \'set\''); return;}
      if (arr.indexOf(msg.content.split(' ')[5].match(/\d/g).join(''))) {
        arr.splice(arr.indexOf(msg.content.split(' ')[5].match(/\d/g).join('')), 1);
        response = `the the new value(s) for ${msg.content.split(' ')[4]} in module ${msg.content.split(' ')[3]} is/are:\n - `;
      } else {
        response = `i did not find that :cry:\nthe the value(s) for ${msg.content.split(' ')[4]} in module ${msg.content.split(' ')[3]} is/are:\n - `;
      }
      value = config[msg.guild.id][msg.content.split(' ')[3]][msg.content.split(' ')[4]].join('\n - ');
      msg.reply(response + value);
      break;
    case 'set':
      value = config[msg.guild.id][msg.content.split(' ')[3]][msg.content.split(' ')[4]];
      if (Array.isArray(value)) {msg.reply('this is a list, pls use \'add\' and \'remove\''); return;}
      config[msg.guild.id][msg.content.split(' ')[3]][msg.content.split(' ')[4]] = msg.content.split(' ')[5];
      response = `the the new value for ${msg.content.split(' ')[4]} in module ${msg.content.split(' ')[3]} is: `;
      value = config[msg.guild.id][msg.content.split(' ')[3]][msg.content.split(' ')[4]];
      msg.reply(response + value);
      break;
    default:
      msg.reply(`i wasn't able to understand ${msg.content.split(' ')[2]}, try using:
       - list (works for everything)
       - add (for lists)
       - remove (for lists)
       - set (not for lists)`);
      return;
  }
  safeconfig();
}

var commands = { raid: raid, lockdown: lockdown, config: settings };

function changelog(msg) {
  if (config.owners.includes(msg.author.id)) {
    var message = msg.content.substring(10);
    config.changelog.concat(config.owners).forEach(user => {
      if (user === client.user.id) return; // don't dm yourself
      client.fetchUser(user)
      .then(dm => {
        dm.send(message); 
      });
    });
  } else if (config.changelog.includes(msg.author.id)) {
    msg.channel.send('you won\'t receive changelogs anymore :sad:');
    config.changelog = config.changelog.filter(function(value, index, arr){
      return value !== msg.author.id;
    });
  } else {
    msg.channel.send('you will now start receiving changelogs :tada:');
    config.changelog.push(msg.author.id);
  }
  safeconfig();
}

var DMcommands = { changelog: changelog };

/* ###### OTHERS ###### */

function log(msg) {
  try {
    var stmt = db.prepare(`INSERT INTO g${msg.guild.id} VALUES (?, ?, ?, ?)`);
    stmt.run(msg.author.id, msg.author.username, msg.content, new Date());
  } catch (error) {
    createTable(msg.guild.id);
    // i don't make a table when you invite the bot
    // this should catch that and miss the first message
    // but raidbots keep spamming so it's fine  
  }
}

function isAllowed(msg, command) {
  if (config.owners.includes(msg.author.id)) return true;
  // for the public bot, this is just 1 person (and the bot itself) ;-)
  if (msg.member.hasPermission('Administrator')) return true;
  if (msg.content.startsWith(`<@${client.user.id}> config`)) {
    return false; // only for admins and those already got a return true
  }
  if (!config[msg.guild.id]) {
    msg.reply(`failed to find config, try \`@${client.user.tag} config\` to create or update this servers config`);
    return false;
  }
  var allowed = false;
  if (config[msg.guild.id][command]) {
    msg.member.roles.forEach((v, e1)=>config[msg.guild.id][command].allowed_roles.forEach((e2)=> {
      if (e1 === e2) {
        allowed = true;
        return true;
      }
    }));
  }
  return allowed;
}

function createTable(guildid) {
  guilds.push(guildid);
  // table names start with a g for guilds, because they can't start with a number
  db.run(`CREATE TABLE IF NOT EXISTS g${guildid} (
    userid nchar not null,
    username nchar not null,
    message nchar not null,
    timestamp datetime not null);`);
}

function cleanDB() {
  guilds.forEach(guildid => {
    var stmt = db.prepare(`DELETE FROM g${guildid} WHERE timestamp < ${new Date(new Date().getTime() - (60 * 60 * 1000)).getTime()}`);
    stmt.run();
  });
}

function safeconfig() {
  var fs = require('fs');
  fs.writeFile('raidbot.json', JSON.stringify(config, null, 2), 'utf8', function () {});
}

function createconfig(guildID) {
  if (!config[guildID]) msg.channel.send('creating default config');
  config[guildID] = Object.assign(require('./default_config.json'), config[guildID]);
}

function senderrors(msg, e) {
  // who doesn't like his dm spammed with errors? (mostly missing permission)
  config.owners.forEach(owner => {
    if (owner === client.user.id) return; // don't dm yourself
    client.fetchUser(owner)
    .then(dm => { // this also sends in zombie mode
      dm.send(`a error has occoured:
      message: ${msg.content}\n${e.message}`);
      dm.send(`
      \`\`\`
      ${e.stack}
      \`\`\``);// let's hope stacktraces aren't 1988+ characters
    });
  });
}

/* ###### client ###### */

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  console.log(`serving ${client.guilds.size} guilds:`);
  client.guilds.forEach(guild => {
    createTable(guild.id);
    console.log('*', guild.name);
  });
  client.user.setActivity("helping moderators");
  // clean the sqlite db every hour
  setInterval(() => {
    cleanDB();
  }, 60 * 60 * 1000);
  setTimeout(() => {
    // for when lockdown locks out the moderators.... has happened..... LOL
    // client.channels.get("channelID").send(`<@${client.user.id}> lockdown off`);
  }, 5000);
});

client.on('message', msg => {
  // don't listen to other bots, but listen to yourself for worst case scenario
  if (msg.author.bot && !(msg.author.id === client.user.id)) return;
  if (zombie) { // prevent the dev bot from talking
    var send = function (args) {console.log(`trying to send message while in zombie mode: \n`, args);};
    msg.reply = send;
    msg.channel.send = send;
  }
  if (msg.guild) { // in a guild
    log(msg);
    if(msg.content.startsWith(`<@${client.user.id}> `)) {
      var command = msg.content.split(' ')[1];
      if (commands.hasOwnProperty(command) && isAllowed(msg, command)) {
        try {
          commands[command](msg);
        } catch (e) {
          msg.channel.send(`something went wrong :cry:`);
          console.error(e);
          senderrors(msg, e);
        }
      }
    }
  } else { // in DM
    if (msg.author.bot) return; //this stops sending the help message when the bot says something
    var DMcommand = msg.content.split(' ')[1];
    if (DMcommands.hasOwnProperty(DMcommand)) {
      DMcommands[DMcommand](msg);
      msg.channel.send('want help? send anything in here that is not a command');
    } else {
      msg.channel.send(':eyes: you seems to be needing some help\nhttps://github.com/SilBoydens/raidbot/readme.md');
    }
  }
});

client.login("bot "+ process.env.RAIDBOT_TOKEN);
