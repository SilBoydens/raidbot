"use strict";

class Context {
    constructor(msg, command, args, client) {
        this.client  = client;
        this.msg     = msg;
        this.command = command;
        this.args    = args;
    }

    get user() {
        return this.msg.author;
    }

    get member() {
        return this.msg.member || null;
    }

    get selfMember() {
        return this.msg.channel.guild ? this.msg.channel.guild.members.get(this.client.user.id) : null;
    }

    get guild() {
        return this.msg.channel.guild || null;
    }

    get channel() {
        return this.msg.channel;
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
    }

    get checkpoint() {
        switch (this.command.level) {
            case "user": return true;
            case "botOwner": {
                return this.client.config.get("owners").includes(this.user.id);
            }
            case "guildManager": {
                return this.member.permissions.has("manageGuild");
            }
            case "guildMod": {
                if (this.member.permissions.has("manageGuild")) {
                    return true;
                } else {
                    let cb = role => this.member.roles.includes(role);
                    let config = this.client.config.get(this.guild.id);
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

    toString() {
        return `[${this.constructor.name} ${this.msg.id}]`;
    }
}

module.exports = Context;