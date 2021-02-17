"use strict";

const housecall = require("housecall");
const fs        = require("fs/promises");
const path      = require("path");

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
    _handleError,
    _dumpMessage,
    _createTable,
    Config
};