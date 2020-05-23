"use strict";

const housecall = require("housecall");
const fs        = require("fs");
const path      = require("path");

class Config {
    static default = require("../default_config.json");
    #cache;
    #queue = housecall({
        concurrency: 2,
        cooldown: 1000
    });
    constructor(filePath) {
        this.path   = path.join(process.cwd(), filePath);
        this.#cache = require(this.path);
    }

    get(key) {
        return this.#cache[key];
    }

    set(key, value) {
        return this.#cache[key] = value;
    }

    del(key) {
        return delete this.#cache[key];
    }

    createIfNotExists(guildID) {
        if (this.#cache[guildID]) return;
        this.#cache[guildID] = Config.default;
        this.save();
    }

    save() {
        this.#queue.push(() => {
            fs.writeFile(this.path, JSON.stringify(this.#cache), "utf8", () => {});
        });
    }
    
    toString() {
        return `[${this.constructor.name}]`;
    }
}

module.exports = Config;
