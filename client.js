"use strict";

const Eris    = require("eris");
const sqlite3 = require("sqlite3").verbose();
const fs      = require("fs");
const path    = require("path");
const utils   = require("./utils");

class RaidBot extends Eris.Client {
    constructor(token, erisOptions, options = {}) {
        super(token, erisOptions);
        this.createErrorLog = utils._createErrorLog.bind(this);

        let _handleError = utils._handleError.bind(this);

        this.db       = new sqlite3.Database(path.join(process.cwd(), options.dbFile)).on("error", _handleError);
        this.config   = new utils.Config(options.configFile);
        this.commands = {};
        this.zombie   = process.argv.includes("zombie");
        this._guilds  = new Set;

        for (let file of fs.readdirSync("./commands").filter(f => f.endsWith(".js"))) {
            let fpath = require.resolve(`./commands/${file}`);
            let id = file.split(".").shift(), data = require(fpath);
            this.command({ id, ...data });
            delete require.cache[fpath];
        }

        process.on("unhandledRejection", _handleError);

        this.on("messageCreate", (msg) => {
            if (msg.author.bot) return;
            if (msg.channel.guild !== undefined) {
                utils._createTable.call(this, msg.channel.guild.id);
                this.config.get(msg.channel.guild.id, require("./default_config.json"));
                utils._dumpMessage.call(this, msg);
            }
            let ctx = this.contextify(msg);
            if (ctx !== null) {
                ctx.processCommand();
            } else {
                if (!msg.channel.guild) {
                    msg.channel.createMessage("👀 You seem to be needing some help\nhttps://github.com/SilBoydens/raidbot/blob/master/readme.md")
                    .catch(_handleError);
                }
            }
        });
        this.on("commandInvoked", utils._onCommandInvoked.bind(this));
        this.on("guildCreate", (guild) => utils._createTable.call(this, guild.id));
        this.on("error", _handleError);
        
        this.flushDBTimer = setInterval(() => {
            for (let id of this._guilds) {
                let stmt = this.db.prepare(`DELETE FROM g${id} WHERE timestamp < ${new Date(new Date().getTime() - (36E5)).getTime()}`).on("error", _handleError);
                stmt.run();
            }
        }, 36E5); // clean the sqlite db every hour

        if (options.helpCommand) {
            this.command({
                id: "help",
                guildOnly: true,
                description: "Lists all of the available commands",
                execute(ctx) {
                    let commands = Object.values(this.commands).filter((command) => {
                        if (command.id === "help") return false;
                        return this.contextify(ctx.msg, command).checkpoint;
                    });
                    if (commands.length === 0) {
                        return "No commands to show!";
                    }
                    return commands.map(c => {
                        return `**\`${c.params ? c.usage : c.id}\`**\n${c.description ? c.description : "*No description provided*"}`;
                    }).join("\n\n");
                }
            });
        }
    }

    get createMessage() {
        return this.zombie ? function() {
            console.log("Attempted to send a message while in zombie mode, arguments:", [...arguments]);
        } : super.createMessage;
    }

    contextify(msg, withCommand) {
        let prefix = msg.content.match(new RegExp(`^(<@!?${this.user.id}>|${msg.channel.guild ? "" : "|"})`));
        if (prefix === null) {
            return prefix;
        }

        const args    = msg.content.slice(prefix[1].length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        const cmd     = withCommand ?? this.commands[command];

        return cmd === undefined ? null : new utils.Context(msg, cmd, args, this);
    }

    command(data) {
        let cmd = new utils.Command(data);
        return this.commands[cmd.id] = cmd;
    }
}

module.exports = RaidBot;