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
        this._min = 0;
        this._max = 10;
        this.on({
            "change:value": this.updateDisplay,
        });
        this.updateDisplay();
    }
    get value() {
        return this._value;
    }
    set value(val) {
        this._value = Math.min(Math.max(val, this.min), this.max);
        this.trigger("change:value");
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
    updateDisplay() {
        var percent = (this.value - this.min) / (this.max - this.min);
        var minD = -135;
        var maxD = 135;
        var degs = (percent * (maxD - minD)) + minD;
        this.el.querySelector(".knob-circle").style.transform = "rotate(" + degs + "deg)";
    }
}

})();
