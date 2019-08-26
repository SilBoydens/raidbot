'use strict';

class CommandContainer extends Map {
    constructor() {
        super();
        this.map = function(cb) {
            const arr = [];
            for(const thing of this.values()) {
                arr.push(cb(thing));
            }
            return arr;
        }
        this.filter = function(cb) {
            const arr = [];
            for(const thing of this.values()) {
                if(cb(thing)) {
                    arr.push(thing);
                }
            }
            return arr;
        }
        this.find = function(cb) {
            for(const thing of this.values()) {
                if(cb(thing)) {
                    return thing;
                }
            }
        }
    }
};

class Command {
    constructor(name, options = {}) {
        Object.assign({
            guildOnly: false,
            group: 'botOwner',
            execute: {}
        }, options);
        this.name = name;
        this.guildOnly = options.guildOnly;
        this.group = options.group;
        this.execute = options.execute;
    }
};

function loadCommands(bot) {
    const fs = require('fs');
    bot.commands = new CommandContainer();
    fs.readdir("./commands/", (error, files) => {
      if(error) {
        throw new Error(error);
      }
      files = files.filter(f => f.endsWith('.js'));
      files.forEach(file => {
          const props = require(`./commands/${file}`);
          const commandName = file.split('.')[0];
          bot.commands.set(commandName, new Command(commandName, props));
      });
    });
};

function checkPoint(client, msg, cmd) {
    let response = 200;
    if(cmd.guildOnly) {
        if(!msg.channel.guild) {
            response = 401;
        }
    }
    if(response !== 200) {
        return response;
    }
    switch(cmd.group) {
        case 'botOwner': {
            if(!client.config.owners.includes(msg.author.id)) {
                response = 401;
            }
            break;
        }
        case 'serverManager': {
            if(!msg.member.hasPermission('MANAGE_GUILD')) {
                response = 401;
            }
            break;
        }
        case 'serverMod': {
            response = 401;
            const allowedRoles = client.config[msg.guild.id][cmd.name].allowed_roles;
            if(allowedRoles.some(role => msg.member.roles.map(r => r.id).includes(role)) || msg.member.hasPermission('MANAGE_GUILD')) {
                response = 200;
            }
            break;
        }
        case 'user': break;
    }
    return response;
};

module.exports = {
    CommandContainer,
    Command,
    loadCommands,
    checkPoint
};
