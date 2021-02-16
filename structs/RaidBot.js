"use strict";

const Eris    = require("eris");
const Command = require("./Command");
const Config  = require("./Config");
const Context = require("./Context");
const sqlite3 = require("sqlite3").verbose();
const fs      = require("fs");
const path    = require("path");
const util    = require("util");

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

        for (let file of fs.readdirSync("./commands").filter(f => f.endsWith(".js"))) {
            let [id] = file.split("."), props = require(`../commands/${id}`);
            this.commands.add({
                id,
                ...props
            });
        }

        process.on("unhandledRejection", (e) => this.createErrorLog(e));

        this.on("messageCreate", this.onMessageCreate);
        this.on("commandInvoked", this.onCommandInvoked);
        this.on("guildCreate", (guild) => this.createTable(guild.id));
        // clean the sqlite db every hour
        this.flushDBTimer = setInterval(this.flushDB, 3600000);
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
                .catch((e) => this.createErrorLog(e));
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
                }).catch((e) => this.createErrorLog(e));
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

    createErrorLog(entry, file) {
        let str = true;
        if (typeof entry !== "string") {
            [entry, str] = [util.inspect(entry), false];
        }
        if (file !== undefined) {
            file = {
                name: `${Date.now()}.txt`,
                file: Buffer.isBuffer(file) ? file : Buffer.from(file)
            };
        }
        if (entry.length > 2E3) {
            let report = {
                name: "report_content_too_large_in_length.txt",
                file: Buffer.from(entry)
            };
            if (file !== undefined) {
                if (!Array.isArray(file)) file = [file];
                file.push(report);
            } else {
                file = report;
            }
            [entry, str] = ["", true];
        }
        this.createMessage(process.env.LOGCHANNEL, {
            content: str ? entry : `\`\`\`js\n${entry}\`\`\``,
            allowedMentions: {}
        }, file).catch((err) => {
            let out = `${this.constructor.name}#createErrorLog failed (${err})\nDumping to console\n${entry}`;
            if (file !== undefined) {
                out += `\n${Array.isArray(file) ? file.map(f => f.file).join("\n") : "" + file.file}`;
            }
            console.error(out);
        });
    }

    flushDB() {
        for (let id of this.#guilds) {
            let stmt = this.db.prepare(`DELETE FROM g${id} WHERE timestamp < ${new Date(new Date().getTime() - (3600000)).getTime()}`);
            stmt.run();
        }
    }

    [util.inspect.custom]() {
        let copy = {
            ...this
        };
        delete copy.token;
        return copy;
    }
}

module.exports = RaidBot;