"use strict";

const Eris        = require("eris");
const sqlite3     = require("sqlite3").verbose();
const path        = require("path");
const fs          = require("fs");
const util        = require("util");
const GuildConfig = require("./guild_config");
const Context     = require("./context");

class RaidBot extends Eris.Client {
    constructor(token, erisOptions) {
        super(token, erisOptions);

        this.sql      = new sqlite3.Database(path.join(process.cwd(), process.env.DB_FILE)).on("error", this.onError.bind(this));
        this.config   = new GuildConfig(process.env.CONFIG_FILE);
        this.commands = {};
        this.zombie   = process.argv.includes("zombie");

        let commandFiles = fs.readdirSync("./commands").map((file) => {
            let [name, ext] = file.split(".");
            if (ext !== "js") return;
            let obj = require(`../commands/${file}`);
            obj.name = name;
            return this.commands[name] = obj;
        }).filter((obj) => obj !== undefined);
        if (process.argv.includes("slash")) {
            this.bulkEditCommands(commandFiles.map((cmd) => {
                let data = {...cmd};
                delete data.execute;
                return data;
            }))
            .catch((err) => this.onError(err));
        }

        process.on("unhandledRejection", this.onError.bind(this));

        this
        .on("interactionCreate", this.onInteractionCreate.bind(this))
        .on("messageCreate", this.onMessageCreate.bind(this))
        .on("guildCreate", this.onGuildCreate.bind(this))
        .on("error", this.onError.bind(this));
        
        this.sqlFlush = setInterval(() => {
            for (let [id] of this.guilds) {
                this.sql.run(`DELETE FROM g${id} WHERE timestamp < ${Date.now() - 36E5}`);
            }
        }, 36E5); // clean the sqlite db every hour
    }

    get createMessage() { // suppress the method on zombie mode
        return this.zombie ? function() {
            console.log("Attempted to send a message while in zombie mode, arguments:", [...arguments]);
        } : super.createMessage;
    }

    async onInteractionCreate(interaction) {
        let command = this.commands[interaction.data.name];
        let ctx = new Context(interaction, command);
        this.onCommandInvoked(ctx);
        try {
            let result = await command.execute.call(this, ctx);
            if (result === undefined) return;
            if (typeof result === "string") {
                result = {
                    content: result
                };
            }
            if (typeof result.content === "string" && result.content.length > 2000) {
                let file = {
                    name: "message_was_too_long.txt",
                    file: Buffer.from(result.content)
                };
                if (result.file !== undefined) {
                    if (!Array.isArray(result.file)) {
                        result.file = [result.file];
                    }
                    result.file.push(file);
                } else {
                    result.file = file;
                }
                result.content = "";
            }
            await ctx.interaction.createMessage(result, result.file);
        } catch (err) {
            this.onError(err, {
                interaction_id: ctx.interaction.id, command_id: ctx.command.id, command_name: ctx.command.name,
                user_id: ctx.user.id, guild_id: ctx.guild.id, channel_id: ctx.channel.id
            });
            await ctx.interaction.createMessage("Something went wrong. 😢");
        }
    }

    onMessageCreate(msg) {
        if (msg.author.bot || msg.channel.guild === undefined) return;
        this.sql.run(`INSERT INTO g${msg.channel.guild.id} VALUES (?, ?, ?, ?)`, [msg.author.id, msg.author.username, msg.content, new Date()]);
    }

    onGuildCreate(guild) {
        this.config.get(guild.id);
        // table names start with a g for guilds, because they can't start with a number
        this.sql.run(`CREATE TABLE IF NOT EXISTS g${guild.id} (userid nchar not null, username nchar not null, message nchar not null, timestamp datetime not null);`);
    }

    onCommandInvoked(ctx) {
        if (ctx.guild === undefined) return;
        let config = this.config.get(ctx.guild.id);
        if (config.logs_channel_id !== null) {
            let { name, options } = ctx.interaction.data;
            // flatten options for log message, this is only appropriate for the current commandbase, not very flexible (yet?)
            if (options?.[0].options !== undefined) { // sub-command
                name += ` ${options[0].name}`;
                ({options} = options[0]);
            }
            this.createMessage(config.logs_channel_id, {
                embed: {
                    title: "Bot Command Used",
                    description: `${ctx.user.mention} has used the \`/${name}\` command on ${ctx.channel.mention}`,
                    fields: [
                        {
                            name: "Arguments",
                            value: options?.length > 0 ? options.map((o) => o.value).join(" ") : "None"
                        }
                    ],
                    timestamp: new Date(ctx.interaction.createdAt)
                }
            })
            .catch((err) => this.onError(err));
        }
    }

    onError(error, context) {
        let out;
        if (error instanceof Error) {
            out = `\`\`\`${error.stack.replaceAll("`", "$&\u200B")}\`\`\``;
        }
        if (context !== undefined) {
            out = `${Object.entries(context).map(([k, v]) => k + ": " + util.inspect(v)).join(", ")}\n${out}`;
        }
        this.createMessage(process.env.LOGCHANNEL, out)
        .catch((err) => {
            console.error(`Couldn't send error report on Discord (${err}) dumping to console...\n${out}`);
        });
    }
}

module.exports = RaidBot;
