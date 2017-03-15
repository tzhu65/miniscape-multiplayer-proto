"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var scCodecMinBin = require('sc-codec-min-bin');
var uuid = require('uuid');
module.exports.run = function (worker) {
    console.log('   >> Worker PID:', process.pid);
    worker.scServer.setCodecEngine(scCodecMinBin);
    var environment = worker.options.environment;
    var scServer = worker.scServer;
    var count = 0;
    var worldData = {};
    var updatesPerSecond = 20;
    var interval = setInterval(function () {
        scServer.exchange.publish('tickUpdate', worldData);
    }, 1000 / updatesPerSecond);
    var serverUpdatesPerSecond = 20;
    var delta = 1000 / serverUpdatesPerSecond;
    var speed = 0.30;
    var updateInterval = setInterval(function () {
        for (var pid in worldData) {
            if (!worldData.hasOwnProperty(pid)) continue;
            var player = worldData[pid];
            player.position.x += delta / 1000 * player.dx * speed;
            player.position.y += delta / 1000 * player.dy * speed;
        }
    }, serverUpdatesPerSecond);
    /*
      In here we handle our incoming realtime connections and listen for events.
    */
    scServer.on('connection', function (socket) {
        // Some sample logic to show how to handle client events,
        // replace this with your own logic
        var player = {
            id: socket.id,
            position: {
                x: 0,
                y: 0
            },
            dx: 0,
            dy: 0
        };
        socket.on('sampleClientEvent', function (data) {
            count++;
            console.log('Handled sampleClientEvent', data);
            scServer.exchange.publish('sample', count);
        });
        socket.on("joinWorld", function (data) {
            console.log(data);
            player.name = data.name;
            player.position.x = Math.random();
            player.position.y = Math.random();
            worldData[player.id] = player;
            socket.emit("joinedWorld", player.position);
            scServer.exchange.publish("newPlayer", player);
            // scServer.exchange.publish("joinedWorld", position);
        });
        socket.on("getWorldData", function () {
            socket.emit("gotWorldData", worldData);
        });
        socket.on("updatePlayer", function (movement) {
            player.dx = movement.x;
            player.dy = movement.y;
        });
        var interval = setInterval(function () {
            socket.emit('rand', {
                rand: Math.floor(Math.random() * 5)
            });
        }, 1000);
        socket.on('disconnect', function () {
            delete worldData[player.id];
            scServer.exchange.publish("playerLeft", player.id);
            clearInterval(interval);
        });
    });
};