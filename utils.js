"use strict";

const housecall = require("housecall");
const fs        = require("fs/promises");
const path      = require("path");
const util      = require("util");
const Eris      = require("eris");

function deepClone(object) {
    return JSON.parse(JSON.stringify(object));
}

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
                }
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

    get(key, init) {
        if (init !== undefined && this._store[key] === undefined) {
            this._store[key] = deepClone(init);
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
}

class Context {
    constructor(msg, command, args, client) {
        this.client  = client;
        this.msg     = msg;
        this.command = command;
        this.args    = args;
        this.user    = msg.author;
        this.channel = msg.channel;
    }

    get member() {
        return this.msg.member || null;
    }

    get selfMember() {
        return this.msg.channel.guild?.members.get(this.client.user.id) ?? null;
    }

    get guild() {
        return this.msg.channel.guild ?? null;
    }

    async processCommand() {
        try {
            if (this.guild === null && this.command.guildOnly) {
                return await this.channel.createMessage("Need help? send anything in here that is not a command");
            }
            if (!this.checkpoint) return;
            
            this.client.emit("commandInvoked", this);
            let executed = await this.command.execute.call(this.client, this);
            if (executed === null) return;
            if (typeof executed === "string") {
                executed = {
                    content: executed
                };
            }
            if (typeof executed.content === "string" && executed.content.length > 2000) {
                let file = {
                    name: "message.txt",
                    file: Buffer.from(executed.content)
                };
                if (executed.file !== undefined) {
                    if (!Array.isArray(executed.file)) {
                        executed.file = [executed.file];
                    }
                    executed.file.push(file);
                } else {
                    executed.file = file;
                }
                executed.content = "";
            }
            await this.channel.createMessage(executed, executed.file);
        } catch(err) {
            let response = "";
            if (err instanceof Eris.DiscordRESTError) {
                if (err.code >= 10001 && err.code <= 10036) {
                    let [, ...entity] = err.message.split(" ");
                    response = `${entity.join(" ")} not found.`;
                } else if (err.code === 50007) {
                    response = "Unable to send a direct message due to recipient's privacy settings.";
                } else if (err.code === 50013) {
                    response = "I don't have the required permission to perform this action.";
                } else {
                    response = `**${err.name}**: ${err.message}`;
                }
            } else if (typeof err === "string") {
                response = err;
            } else {
                response = "Something went wrong. 😢";
                this.client.createErrorLog(err, JSON.stringify(this.msg.toJSON()));
            }
            this.channel.createMessage(response).catch((e) => this.client.createErrorLog(e));
        }
    }

    get checkpoint() {
        switch (this.command.level) {
            case "user": return true;
            case "bot_owner": {
                return this.client.config.get("owners").includes(this.user.id);
            }
            case "guild_manager": {
                return this.member.permissions.has("manageGuild");
            }
            case "guild_mod": {
                if (this.member.permissions.has("manageGuild")) {
                    return true;
                } else {
                    let cb = (rid) => this.member.roles.includes(rid), config = this.client.config.get(this.guild.id);
                    if (!Array.isArray(config.mod_roles)) {
                        config.mod_roles = [];
                        this.client.config.save();
                    }
                    return config.mod_roles.some(cb) || (config[this.command.id] ? config[this.command.id].allowed_roles.some(cb) : false);
                }
            }
            default: {
                throw new Error(`Unknown command level specified for ${this.command}`);
            }
        }
    }
}

class Command {
    constructor(data) {
        this.id          = data.id;
        this.guildOnly   = false;
        this.level       = "user";
        this.params      = "";
        this.description = "";
        if (typeof this.id !== "string") {
            throw new Error("Missing a proper command identifier");
        }
        if (typeof data.guildOnly === "boolean") {
            this.guildOnly = data.guildOnly;
        }
        if (typeof data.level === "string") {
            this.level = data.level;
        }
        if (typeof data.params === "string") {
            this.params = data.params;
        }
        if (typeof data.description === "string") {
            this.description = data.description;
        }
        if (typeof data.execute === "function") {
            this.execute = data.execute;
        }
    }

    get usage() {
        return this.params ? `${this.id} ${this.params}` : this.id;
    }
}

function snowflakeToTime(id) {
    return new Eris.Base(id).createdAt;
}

function parseDuration(str) {
    if (typeof str === "number" /* what a twist */) str = "" + str;
    let match = str.match(/^(?:(\d+)w)?(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/i);
    if (match === null) return match;
    let [,
        weeks   = 0,
        days    = 0,
        hours   = 0,
        minutes = 0,
        seconds = 0
    ] = match;
    return {
        weeks  : +weeks,
        days   : +days,
        hours  : +hours,
        minutes: +minutes,
        seconds: +seconds,
        get total() {
            return this.weeks   * 6048E2
            +      this.days    * 864E2
            +      this.hours   * 36E2
            +      this.minutes * 60
            +      this.seconds;
        }
    };
}

module.exports = {
    deepClone,
    _createErrorLog,
    _onCommandInvoked,
    _handleError,
    _dumpMessage,
    _createTable,
    Config,
    Context,
    Command,
    snowflakeToTime,
    parseDuration
};
