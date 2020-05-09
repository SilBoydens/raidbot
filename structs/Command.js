"use strict";

class Command {
    id;
    guildOnly   = false;
    group       = "user";
    params      = "";
    description = "";
    constructor(props) {
        if (typeof props.id === "string") {
            this.id = props.id;
        } else {
            throw new Error("Must specify a command identifier as a string");
        }
        if (typeof props.guildOnly === "boolean") {
            this.guildOnly = props.guildOnly;
        }
        if (typeof props.group === "string") {
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
        return `${this.id} ${this.params}`;
    }
    toString() {
        return `[${this.constructor.name} ${this.id}]`;
    }
};

module.exports = Command;
