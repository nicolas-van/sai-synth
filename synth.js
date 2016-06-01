"use strict";

(function() {

var tenv = new nunjucks.Environment(null, { autoescape: true });

window.saisynth = {};

saisynth.SaiSynth = class SaiSynth extends widget.Widget {
    get className() { return "sai-synth"; }
    render() {
        return tenv.renderString(`
            <span class="test-knob"></span>
        `);
    }
    constructor() {
        super();
        var knob = new saisynth.Knob();
        knob.value = 3;
        knob.defaultValue = 5;
        knob.replace(this.el.querySelector(".test-knob"));
    }
};

saisynth.Knob = class Knob extends widget.Widget {
    get className() { return "knob"; }
    render() {
        return tenv.renderString(`
            <div class="knob-circle">
                <div class="knob-bar"></div>
            </div>
        `);
    }
    constructor(options) {
        super();
        this._value = 0;
        this._defaultValue = 0;
        this._min = 0;
        this._max = 10;
        this._updatingPercent = false;
        this._updatingValue = false;
        this.on({
            "change:value": this._valueChange,
            "change:percent": this._percentChange,
            "dom:mousedown": this._mouseDown,
            "dom:dblclick": () => this.value = this.defaultValue,
        });
        this._value = this._value;
    }
    get value() {
        return this._value;
    }
    set value(val) {
        this._value = Math.min(Math.max(val, this.min), this.max);
        this.trigger("change:value");
    }
    get defaultValue() {
        return this._defaultValue;
    }
    set defaultValue(val) {
        this._defaultValue = val;
        this.trigger("change:defaultValue");
    }
    get min() {
        return this._min;
    }
    set min(val) {
        this._min = val;
        this.trigger("change:min");
        this.value = this.value;
    }
    get max() {
        return this._max;
    }
    set max(val) {
        this._max = max;
        this.trigger("change:max");
        this.value = this.value;
    }
    _valueChange() {
        if (this._updatingPercent)
            return;
        this._updatingValue = true;
        this.percent = (this.value - this.min) / (this.max - this.min);
        this._updatingValue = false;
    }
    get percent() {
        return this.__percent;
    }
    set percent(val) {
        this.__percent = Math.min(Math.max(val, 0), 1);
        this.trigger("change:percent");
    }
    _percentChange() {
        var degrees = (this.percent * (135 * 2)) - 135;
        this.el.querySelector(".knob-circle").style.transform = "rotate(" + degrees + "deg)";
        if (this._updatingValue)
            return;
        this._updatingPercent = true;
        this.value = (this.percent * (this.max - this.min)) + this.min;
        this._updatingPercent = false;
    }
    _mouseDown(e) {
        var mult = 0.005;
        var percent = this.percent;
        var initialX = e.screenX;
        var initialY = e.screenY;
        var moveCallback = function(e) {
            this.percent = percent + ((e.screenX - initialX) * mult) + ((initialY - e.screenY) * mult);
        }.bind(this);
        var upCallback = function(e) {
            window.removeEventListener("mousemove", moveCallback);
            window.removeEventListener("mouseup", upCallback);
        }.bind(this);
        window.addEventListener("mousemove", moveCallback);
        window.addEventListener("mouseup", upCallback);
    }
}

})();
