"use strict";

class Context {
    #client;
    constructor(msg, command, args, client) {
        this.#client = client;
        this.msg     = msg;
        this.command = command;
        this.args    = args;
    }
    get id() {
        return this.msg.id;
    }
    get user() {
        return this.msg.author;
    }
    get member() {
        return this.msg.member || null;
    }
    get selfMember() {
        return this.msg.channel.guild ? this.msg.channel.guild.members.get(this.#client.user.id) : null;
    }
    get guild() {
        return this.msg.channel.guild || null;
    }
    get channel() {
        return this.msg.channel;
    }
    async processCommand() {
        if (this.command === undefined) {
            throw new Error("No command to process");
        }
        try {
            if (!this.msg.channel.guild && this.command.guildOnly) {
                throw "Need help? send anything in here that is not a command";
            }
            if (!this.checkpoint) return;
            let executed = await this.command.execute.call(this.#client, this);
            if (executed === null) return;
            if (typeof executed === "string") {
                executed = {
                    content: executed
                };
            }
            if (typeof executed.content === "string" && executed.content.length > 2000) {
                executed.file = {
                    name: "content_too_large_in_length.txt",
                    file: Buffer.from(executed.content)
                };
                executed.content = "";
            }
            await this.channel.createMessage(executed, executed.file);
        } catch(e) {
            this.panic(e);
        }
    }
    panic(error) {
        let response = "";
        if (error instanceof Error && error.name.split(" ")[0] === "DiscordRESTError") {
            if (error.code >= 10001 && error.code <= 10036) {
                response = `${error.message.split(" ")[1]} not found.`;
            } else if (error.code === 50007) {
                response = "Unable to send a direct message due to recipient's privacy settings.";
            } else if (error.code === 50013) {
                response = "I don't have the required permission to perform this action."
            } else {
                response = `**${error.name}**: ${error.message}`;
            }
        } else if (typeof error === "string") {
            response = error;
        } else {
            response = "Something went wrong. 😢";
            this.#client.logger.send(error, JSON.stringify(this.msg.toJSON()));
        }
        return this.channel.createMessage(response).catch(this.#client.logger.send);
    }
    get checkpoint() {
        if (this.command === undefined) {
            throw new Error("No command to inspect permissions for");
        }
        switch (this.command.group) {
            case "user": break;
            case "botOwner": {
                return this.#client.config.get("owners").includes(this.user.id);
            }
            case "guildManager": {
                return this.member.permission.json.manageGuild;
            }
            case "guildMod": {
                return this.member.permission.json.manageGuild || this.#client.config.get(this.guild.id)[this.command.name].allowed_roles.some(role => {
                    return this.member.roles.includes(role);
                });
            }
            default: {
                throw new Error(`Unknown command group specified for ${this.command}`);
            }
        }
    }
    toString() {
        return `[${this.constructor.name} ${this.msg.id}]`;
    }
    static from(msg, self) {
        let prefix = msg.content.match(new RegExp(`^(<@!?${self.user.id}>|raidbot${msg.channel.guild ? "" : "|"})`, "i"));
        if (prefix === null) {
            return prefix;
        }

        const args    = msg.content.slice(prefix[1].length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        const cmd     = self.commands.get(command);

        return cmd === undefined ? null : new Context(msg, cmd, args, self);
    }
};

module.exports = Context;
