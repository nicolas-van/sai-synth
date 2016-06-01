"use strict";

(function() {

window.saisynth = {};

saisynth._tenv = new nunjucks.Environment(null, { autoescape: true });
var tenv = saisynth._tenv;

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

})();
