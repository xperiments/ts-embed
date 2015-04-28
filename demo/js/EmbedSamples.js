/**
 * EmbedSampleClass
 * Created by xperiments on 07/04/15.
 */
/// <reference path="typings/es6-promise/es6-promise.d.ts" />
/// <reference path="typings/ts-embed/ts-embed.d.ts" />
var __decorate = this.__decorate || function (decorators, target, key, value) {
    var kind = typeof (arguments.length == 2 ? value = target : value);
    for (var i = decorators.length - 1; i >= 0; --i) {
        var decorator = decorators[i];
        switch (kind) {
            case "function": value = decorator(value) || value; break;
            case "number": decorator(target, key, value); break;
            case "undefined": decorator(target, key); break;
            case "object": value = decorator(target, key, value) || value; break;
        }
    }
    return value;
};
var embed = tsembed.embed;
var EmbedType = tsembed.EmbedType;
var EmbedUtils = tsembed.EmbedUtils;
var EmbedSamples = (function () {
    function EmbedSamples() {
    }
    __decorate([embed({ src: './resources/Examples.js', as: EmbedType.script, mime: 'text/javascript' })], EmbedSamples, "examples");
    return EmbedSamples;
})();
