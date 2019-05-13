#!/usr/bin/env node

/**
 * Module dependencies.
 */
// config should be imported before importing any other file
import config from "../config/config";

import * as fs from "fs";
import * as http from "http";
import * as https from "https";
import * as mongoose from "mongoose";
import app from "../app";

// // make bluebird default Promise
// Promise = require('bluebird'); // eslint-disable-line no-global-assign

// // plugin bluebird promise in mongoose
// mongoose.Promise = Promise;

/**
 * Get port from environment and store in Express.
 */

// connect to mongo db
const mongoUri = config.mongo.host;
mongoose.connect(mongoUri, { server: { socketOptions: { keepAlive: 1 } } });
mongoose.connection.on("error", () => {
    throw new Error(`unable to connect to database: ${mongoUri}`);
}).on("connected", () => {
    console.log("Mongodb connected");
});

// print mongoose logs in dev env
if (process.env.MONGOOSE_DEBUG) {
    mongoose.set("debug", (collectionName: any, method: any, query: any, doc: any) => {
        // debug(`${collectionName}.${method}`, util.inspect(query, false, 20), doc);
    });
}

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */
const port = normalizePort(config.port);

server.listen(port);
server.on("error", onError);
server.on("listening", () => {
    onListening(server);
});

if (config.env == "production") {
    let options = {
        key: fs.readFileSync("/etc/letsencrypt/live/gdjzj.hzsdgames.com/privkey.pem"),
        cert: fs.readFileSync("/etc/letsencrypt/live/gdjzj.hzsdgames.com/fullchain.pem"),
    };
    let sslServer = https.createServer(options, app);
    sslServer.listen(config.sslPort);
    sslServer.on("error", onError);
    sslServer.on("listening", () => {
        onListening(sslServer);
    });
}

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val: string) {
    const port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: any) {
    if (error.syscall !== "listen") {
        throw error;
    }

    const bind = typeof port === "string"
        ? "Pipe " + port
        : "Port " + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case "EACCES":
            console.error(bind + " requires elevated privileges");
            process.exit(1);
            break;
        case "EADDRINUSE":
            console.error(bind + " is already in use");
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening(server) {
    const addr = server.address();
    const bind = typeof addr === "string"
        ? "pipe " + addr
        : "port " + addr.port;
    console.log("Listening on " + bind);
}
