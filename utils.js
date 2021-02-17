"use strict";

const housecall = require("housecall");
const fs        = require("fs/promises");
const path      = require("path");
const util      = require("util");

function _createErrorLog(entry, file) {
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

function _onCommandInvoked(ctx) {
    if (ctx.guild === null) return;
    let config = this.config.get(ctx.guild.id, true);
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
                    timestamp: new Date
                },
                allowedMentions: {}
            }).catch((e) => this.createErrorLog(e));
        }
    }
}

function _handleError(err) {
    this.createErrorLog(err);
}

function _dumpMessage(msg) {
    if (msg.channel.guild === undefined) {
        return;
    }
    let stmt = this.db.prepare(`INSERT INTO g${msg.channel.guild.id} VALUES (?, ?, ?, ?)`).on("error", _handleError.bind(this));
    stmt.run(msg.author.id, msg.author.username, msg.content, new Date());
}

function _createTable(guildID) {
    if (this._guilds.has(guildID)) {
        return;
    }
    this._guilds.add(guildID);
    // table names start with a g for guilds, because they can't start with a number
    this.db.run(`CREATE TABLE IF NOT EXISTS g${guildID} (
    userid nchar not null,
    username nchar not null,
    message nchar not null,
    timestamp datetime not null);`);
}

class Config {
    constructor(filePath) {
        this.path   = path.join(process.cwd(), filePath);
        this._store = require(this.path);
        this._queue = housecall({
            concurrency: 2,
            cooldown: 1000
        });
    }

    get(key, guild = false) {
        if (guild && this._store[key] === undefined) {
            this._store[key] = JSON.parse(JSON.stringify(Config.default));
            this.save();
        }
        return this._store[key];
    }

    set(key, value) {
        return this._store[key] = value;
    }

    del(key) {
        return delete this._store[key];
    }

    save() {
        this._queue.push(() => fs.writeFile(this.path, JSON.stringify(this._store), "utf8"));
    }
    
    toString() {
        return `[${this.constructor.name}]`;
    }

    static get default() {
        return require("./default_config.json");
    }
}

module.exports = {
    _createErrorLog,
    _onCommandInvoked,
    _handleError,
    _dumpMessage,
    _createTable,
    Config
};
