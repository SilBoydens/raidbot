"use strict";

const util = require("util");

class Logger {
    #client;
    #hook;
    constructor(hookURL, client) {
        this.#client = client;
        this.hook    = hookURL;
    }
    set hook(hookURL) {
        let match = hookURL.match(/^https:\/\/discordapp\.com\/api\/webhooks\/(\d{15,})\/(.+)$/);
        if (match === null) {
            throw new Error("Invalid webhook URL");
        }
        return this.#hook = {
            id: match[1],
            token: match[2]
        };
    }
    send(entry, file) {
        let obj = false;
        if (typeof entry !== "string") {
            entry = util.inspect(entry);
            obj   = true;
        }
        entry = entry.replace(/`/g, "`" + String.fromCharCode(0x200b));
        if (file !== undefined) {
            file = {
                name: `${Date.now()}.${typeof file === "object" ? "json" : "txt"}`,
                file: Buffer.from(typeof file === "object" ? JSON.stringify(file, null, "\t") : file)
            };
        }
        if (entry.length > 2000) {
            let report = {
                name: "report_content_was_too_large_in_length.txt",
                file: Buffer.from(entry)
            };
            if (file !== undefined) {
                if (!Array.isArray(file)) {
                    file = [file];
                }
                file.push(report);
            } else {
                file = report;
            }
            entry = "SEE ATTACHMENT";
            obj   = false;
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
