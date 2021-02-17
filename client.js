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

        return cmd === undefined ? null : {
            client: this,
            msg,
            command: cmd,
            args,
            user: msg.author,
            channel: msg.channel,
            get member() {
                return this.msg.member ?? null;
            },
            get selfMember() {
                return this.msg.channel.guild ? this.msg.channel.guild.members.get(this.client.user.id) : null;
            },
            get guild() {
                return this.msg.channel.guild ?? null;
            },
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
                    if (err instanceof Error && err.name.split(" ")[0] === "DiscordRESTError") {
                        if (err.code >= 10001 && err.code <= 10036) {
                            response = `${err.message.split(" ")[1]} not found.`;
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
            },
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
        };
    }

    command(data) {
        let cmd = {
            id: data.id,
            guildOnly: false,
            level: "user",
            params: "",
            description: "",
            get usage() {
                return this.params ? `${this.id} ${this.params}` : this.id;
            }
        };
        if (typeof cmd.id !== "string") {
            throw new Error("Missing a proper command identifier");
        }
        if (typeof data.guildOnly === "boolean") {
            cmd.guildOnly = data.guildOnly;
        }
        if (typeof data.level === "string") {
            cmd.level = data.level;
        }
        if (typeof data.params === "string") {
            cmd.params = data.params;
        }
        if (typeof data.description === "string") {
            cmd.description = data.description;
        }
        if (typeof data.execute === "function") {
            cmd.execute = data.execute;
        }
        return this.commands[cmd.id] = cmd;
    }
}

module.exports = RaidBot;