"use strict";

const Eris             = require("eris");
const CommandContainer = require("./CommandContainer");
const Context          = require("./Context");
const Config           = require("./Config");
const Logger           = require("./Logger");
const sqlite3          = require("sqlite3").verbose();
const fs               = require("fs");
const path             = require("path");

class RaidBot extends Eris.Client {
    #guilds = new Set(); // list of guilds for flushDB job
    constructor(token, erisOptions, options = {}) {
        super(token, erisOptions);

        this.db       = new sqlite3.Database(path.join(process.cwd(), options.dbFile)); // config is kept in ram, but is writen to disk on changes
        this.config   = new Config(options.configFile);
        this.commands = new CommandContainer();
        /**
         * in zombie mode, the bot doesn't talk or do anything at all, it only logs everything it should do to the console
         * used for development, so the bot doesn't send doubles
         */
        this.zombie = process.argv.includes("zombie");
        this.logger = new Logger(options.logsWebhook, this);

        for (let file of fs.readdirSync("./commands").filter(f => f.endsWith(".js"))) {
            let [name] = file.split("."), props = require(`../commands/${name}`);
            this.commands.set(name, {
              name,
              ...props
            });
        }

        process.on("uncaughtException", (e) => {
            this.logger.send(e);
        });

        this.on("messageCreate", this.onMessageCreate);
    }
    get createMessage() {
        return this.zombie ? function() {
            console.log("Attempted to send a message while in zombie mode:", arguments);
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
};

module.exports = RaidBot;