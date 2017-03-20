"use strict";

var __extends = undefined && undefined.__extends || function () {
    var extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function (d, b) {
        d.__proto__ = b;
    } || function (d, b) {
        for (var p in b) {
            if (b.hasOwnProperty(p)) d[p] = b[p];
        }
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() {
            this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
}();
Object.defineProperty(exports, "__esModule", { value: true });
var uuid = require('uuid');
var World = function () {
    function World() {}
    return World;
}();
var GameObject = function () {
    function GameObject() {
        this.position = {
            x: 0,
            y: 0
        };
    }
    return GameObject;
}();
var GameBoundedObject = function (_super) {
    __extends(GameBoundedObject, _super);
    function GameBoundedObject() {
        return _super.call(this) || this;
    }
    return GameBoundedObject;
}(GameObject);
var GameMovableObject = function (_super) {
    __extends(GameMovableObject, _super);
    function GameMovableObject() {
        var _this = _super.call(this) || this;
        _this.speed = 0;
        _this.dx = 0;
        _this.dy = 0;
        return _this;
    }
    return GameMovableObject;
}(GameObject);
var GameCharacter = function (_super) {
    __extends(GameCharacter, _super);
    function GameCharacter() {
        return _super.call(this) || this;
    }
    return GameCharacter;
}(GameObject);
var GamePlayer = function () {
    function GamePlayer() {
        this.id = uuid();
        this.character = new GameCharacter();
    }
    return GamePlayer;
}();
exports.GamePlayer = GamePlayer;