"use strict";

const Eris = require("eris");

module.exports = {
    execute() {
        return "This command is a work in progress, check back later!";
    },
    description: "Allows you to view or change the settings for current server",
    default_member_permissions: Eris.Constants.Permissions.administrator,
    dm_permission: false
};