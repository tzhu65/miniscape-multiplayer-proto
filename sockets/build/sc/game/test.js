"use strict";

function applyMixins(derivedCtor, baseCtors) {
    baseCtors.forEach(function (baseCtor) {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach(function (name) {
            derivedCtor.prototype[name] = baseCtor.prototype[name];
        });
    });
}
// Disposable Mixin
var Disposable = function () {
    function Disposable() {}
    Disposable.prototype.dispose = function () {
        this.isDisposed = true;
    };
    return Disposable;
}();
// Activatable Mixin
var Activatable = function () {
    function Activatable() {}
    Activatable.prototype.activate = function () {
        this.isActive = true;
    };
    Activatable.prototype.deactivate = function () {
        this.isActive = false;
    };
    return Activatable;
}();
var SmartObject = function () {
    function SmartObject() {
        var _this = this;
        // Disposable
        this.isDisposed = false;
        // Activatable
        this.isActive = false;
        setInterval(function () {
            return console.log(_this.isActive + " : " + _this.isDisposed);
        }, 500);
    }
    SmartObject.prototype.interact = function () {
        this.activate();
    };
    return SmartObject;
}();
applyMixins(SmartObject, [Disposable, Activatable]);