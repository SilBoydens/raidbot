"use strict";

const Eris    = require("eris");
const Command = require("./Command");
const Config  = require("./Config");
const Context = require("./Context");
const Logger  = require("./Logger");
const sqlite3 = require("sqlite3").verbose();
const fs      = require("fs");
const path    = require("path");

class RaidBot extends Eris.Client {
    #guilds = new Set(); // list of guilds for flushDB job
    constructor(token, erisOptions, options = {}) {
        super(token, erisOptions);

        this.db       = new sqlite3.Database(path.join(process.cwd(), options.dbFile)); // config is kept in ram, but is writen to disk on changes
        this.config   = new Config(options.configFile);
        this.commands = new Eris.Collection(Command);
        /**
         * in zombie mode, the bot doesn't talk or do anything at all, it only logs everything it should do to the console
         * used for development, so the bot doesn't send doubles
         */
        this.zombie = process.argv.includes("zombie");
        this.logger = new Logger(options.logsWebhook, this);

        for (let file of fs.readdirSync("./commands").filter(f => f.endsWith(".js"))) {
            let [id] = file.split("."), props = require(`../commands/${id}`);
            this.commands.add({
                id,
                ...props
            });
        }

        process.on("uncaughtException", (e) => {
            this.logger ? this.logger.send(e) : console.log(e);
        });

        this.on("messageCreate", this.onMessageCreate);
        this.on("commandInvoked", this.onCommandInvoked);
        this.on("guildCreate", (guild) => {
            this.createTable(guild.id);
        });
    }

    get createMessage() {
        return this.zombie ? function() {
            console.log("Attempted to send a message while in zombie mode, arguments:", [...arguments]);
        } : super.createMessage;
    }

    onMessageCreate(msg) {
        if (msg.author.bot) return;
        if (msg.channel.guild) {
            if (!this.#guilds.has(msg.channel.guild.id)) {
                this.createTable(msg.channel.guild.id);
            }
            this.config.createIfNotExists(msg.channel.guild.id);
            this.dumpMessage(msg);
        }
        let ctx = Context.from(msg, this);
        if (ctx !== null) {
            ctx.processCommand();
        } else {
            if (!msg.channel.guild) {
                msg.channel.createMessage("👀 You seem to be needing some help\nhttps://github.com/SilBoydens/raidbot/blob/master/readme.md")
                .catch(this.logger.send);
            }
        }
    }

    onCommandInvoked(ctx) {
        if (ctx.guild === null) return;
        let config = this.config.get(ctx.guild.id);
        if (config === undefined) {
            this.config.createIfNotExists(ctx.guild.id);
        }
        if (config.general.sendlogs.length) {
            for (let channelID of config.general.sendlogs) {
                this.createMessage(channelID, {
                    embed: {
                        title: "Bot Command Used",
                        description: `${ctx.user.mention} has used the \`${ctx.command.id}\` command on ${ctx.channel.mention}`,
                        fields: [
                            {
                                name: "Arguments",
                                value: ctx.args.length ? `[${ctx.args.join(", ")}]` : "None"
                            }
                        ],
                        timestamp: new Date()
                    },
                    allowedMentions: {}
                }).catch(this.logger.send);
            }
        }
    }

    dumpMessage(msg) {
        let stmt = this.db.prepare(`INSERT INTO g${msg.channel.guild.id} VALUES (?, ?, ?, ?)`);
        stmt.run(msg.author.id, msg.author.username, msg.content, new Date());
    }

    createTable(guildID) {
        this.#guilds.add(guildID);
        // table names start with a g for guilds, because they can't start with a number
        this.db.run(`CREATE TABLE IF NOT EXISTS g${guildID} (
        userid nchar not null,
        username nchar not null,
        message nchar not null,
        timestamp datetime not null);`);
    }

    flushDB() {
        for (let id of this.#guilds) {
            let stmt = this.db.prepare(`DELETE FROM g${id} WHERE timestamp < ${new Date(new Date().getTime() - (3600000)).getTime()}`);
            stmt.run();
        }
    }

    [Symbol.for("nodejs.util.inspect.custom")]() {
        let copy = {
            ...this
        };
        delete copy.token;
        return copy;
    }
}

module.exports = RaidBot;
