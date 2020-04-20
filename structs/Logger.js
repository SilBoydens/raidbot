"use strict";

function resolveWebhook(hookURL) {
    let match = hookURL.match(/^https:\/\/discordapp\.com\/api\/webhooks\/(\d{15,})\/(.+)$/);
    if (match === null) {
        throw new Error("Invalid webhook URL");
    }
    return {
        id: match[1],
        token: match[2]
    };
}

let util = require("util");

class Logger {
    #client;
    #hook;
    constructor(hookURL, client) {
        this.#client = client;
        this.hook    = hookURL;
    }
    set hook(hookURL) {
        return this.#hook = resolveWebhook(hookURL);
    }
    send(entry, file) {
        let obj = false;
        if (typeof entry !== "string") {
            entry = util.inspect(entry);
            obj   = true;
        }
        entry = entry.replace(/`/g, "`" + String.fromCharCode(0x200b));
        if (entry.length > 2000) {
            entry = entry.substring(0, 1980) + "...";
        }
        if (file !== undefined) {
            file = {
                name: `${Date.now()}.${typeof file === "object" ? "json" : "txt"}`,
                file: Buffer.from(typeof file === "object" ? JSON.stringify(file, null, "\t") : file)
            };
        }
        this.#client.executeWebhook(this.#hook.id, this.#hook.token, {
            username: `raidbot${this.#client.ready ? "" : " (not logged in)"}`,
            ...(this.#client.ready ? {
                avatarURL: this.#client.user.avatarURL.split("?")[0]
            } : {}),
            content: `\`\`\`${obj ? "js\n" : ""}${entry}\`\`\``,
            file
        })
        .catch(e => {
            console.log(`${this.constructor.name}#send failed\n${e}\nDumping to console...\n${entry}`);
        });
    }
    toString() {
        return `[${this.constructor.name} ${this.#hook.id}]`;
    }
    [Symbol.for("nodejs.util.inspect.custom")]() {
        return `[${this.constructor.name}]`;
    }
};

module.exports = Logger;
