"use strict";

class Command {
    name;
    guildOnly   = false;
    group       = "user";
    params      = "";
    description = "";
    constructor(props) {
        if (typeof props.name === "string") {
            this.name = props.name;
        } else {
            throw new Error("Must specify a command name as a string");
        }
        if (typeof props.guildOnly === "boolean") {
            this.guildOnly = props.guildOnly;
        }
        if (typeof props.group !== "string") {
            this.group = props.group;
        }
        if (typeof props.params === "string") {
            this.params = props.params;
        }
        if (typeof props.description === "string") {
            this.description = props.description;
        }
        if (typeof props.execute === "function") {
            Object.defineProperty(this, "execute", {
                value: props.execute
            });
        } else {
            throw new Error("An \"execute\" method is missing or the constructor was supplied with an invalid one");
        }
    }
    get usage() {
        return `${this.name} ${this.params}`;
    }
    toString() {
        return `[${this.constructor.name} ${this.name}]`;
    }
};

module.exports = Command;
