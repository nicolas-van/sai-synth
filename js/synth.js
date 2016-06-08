"use strict";

(function() {

window.saisynth = {};

saisynth._tenv = new nunjucks.Environment(null, { autoescape: true });
var tenv = saisynth._tenv;

saisynth.SaiSynth = class SaiSynth extends widget.Widget {
    get className() { return "sai-synth"; }
    constructor() {
        super();
        this.el.innerHTML = tenv.renderString(`
            <div class="osc1">
                <div class="osc1-type osc-select btn-group" role="group">
                    <button type="button" class="btn btn-default" data-value="sine">sine</button>
                    <button type="button" class="btn btn-default" data-value="square">square</button>
                    <button type="button" class="btn btn-default" data-value="triangle">triangle</button>
                    <button type="button" class="btn btn-default" data-value="sawtooth">sawtooth</button>
                    <button type="button" class="btn btn-default" data-value="noise">noise</button>
                </div>
                <div class="osc1-gain knob-label">
                    <div class="knob-ctn"></div>
                    <label>Gain</label>
                </div>
            </div>
            <div class="osc2">
                <div class="osc2-type osc-select btn-group" role="group">
                    <button type="button" class="btn btn-default" data-value="sine">sine</button>
                    <button type="button" class="btn btn-default" data-value="square">square</button>
                    <button type="button" class="btn btn-default" data-value="triangle">triangle</button>
                    <button type="button" class="btn btn-default" data-value="sawtooth">sawtooth</button>
                    <button type="button" class="btn btn-default" data-value="noise">noise</button>
                </div>
                <div class="osc2-gain knob-label">
                    <div class="knob-ctn"></div>
                    <label>Gain</label>
                </div>
            </div>
        `);
        
        this.audioCtx = new AudioContext();
        this.track = new sai.Track(this.audioCtx);
        this.track.output.connect(this.audioCtx.destination);
        
        // osc1
        this.osc1Gain = new saisynth.Knob(this.track.osc1Gain);
        this.osc1Gain.appendTo(this.el.querySelector(".osc1-gain .knob-ctn"));
        this.osc1Gain.on("change:value", () => this.track.osc1Gain = this.osc1Gain.value);
        var actOsc1Val = function() {
            this.el.querySelectorAll(".osc1-type button").forEach((el) => el.classList.remove("selected"));
            this.el.querySelector(".osc1-type button[data-value='" + this.track.osc1Type + "']").classList.add("selected");
        }.bind(this);
        this.on("dom:click .osc1-type button", function(e) {
            this.track.osc1Type = e.target.dataset.value;
            actOsc1Val();
        }.bind(this));
        actOsc1Val();
        
        // osc2
        this.osc2Gain = new saisynth.Knob(this.track.osc2Gain);
        this.osc2Gain.appendTo(this.el.querySelector(".osc2-gain .knob-ctn"));
        this.osc2Gain.on("change:value", () => this.track.osc2Gain = this.osc2Gain.value);
        var actOsc2Val = function() {
            this.el.querySelectorAll(".osc2-type button").forEach((el) => el.classList.remove("selected"));
            this.el.querySelector(".osc2-type button[data-value='" + this.track.osc2Type + "']").classList.add("selected");
        }.bind(this);
        this.on("dom:click .osc2-type button", function(e) {
            this.track.osc2Type = e.target.dataset.value;
            actOsc2Val();
        }.bind(this));
        actOsc2Val();
        
        var receiveMessage = function(mes) {
            console.log("midi message", mes.cmdString, mes);
            this.track.midiMessage(mes);
            this.keys.receiveMidiMessage(mes);
        }.bind(this);
        
        console.log("trying to get midi access");
        window.navigator.requestMIDIAccess().then(function(midiAccess) {
            var inputs = midiAccess.inputs.values();
            var n = 0;
            for (var input = inputs.next(); input && ! input.done; input = inputs.next()) {
                input.value.onmidimessage = (message) => receiveMessage(new sai.MidiMessage(message.data));
                n++;
            }
            console.log("listening on " + n + " MIDI inputs");
        }.bind(this));
        
        // creation of virtual keyboard
        this.keys = new saisynth.Keys().appendTo(this.el);
        this.keys.on("midiMessage", function(e) {
            receiveMessage(e.detail);
        }.bind(this));
    }
};

})();
