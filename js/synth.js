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
                <span class="osc1-type">
                </span>
                <div class="osc1-gain knob-label">
                    <div class="knob-ctn"></div>
                    <label>Gain</label>
                </div>
            </div>
            <div class="osc2">
                <span class="osc2-type">
                </span>
                <div class="osc2-gain knob-label">
                    <div class="knob-ctn"></div>
                    <label>Gain</label>
                </div>
            </div>
            <div class="envelope">
                <div class="attack knob-label">
                    <div class="knob-ctn"></div>
                    <label>Attack</label>
                </div>
                <div class="decay knob-label">
                    <div class="knob-ctn"></div>
                    <label>Decay</label>
                </div>
                <div class="sustain knob-label">
                    <div class="knob-ctn"></div>
                    <label>Sustain</label>
                </div>
                <div class="release knob-label">
                    <div class="knob-ctn"></div>
                    <label>Release</label>
                </div>
            </div>
            <div class="lfo">
                <div class="lfo-freq knob-label">
                    <div class="knob-ctn"></div>
                    <label>LFO F.</label>
                </div>
                <div class="lfo-osc1-gain knob-label">
                    <div class="knob-ctn"></div>
                    <label>Osc1 Gain</label>
                </div>
                <div class="lfo-osc2-gain knob-label">
                    <div class="knob-ctn"></div>
                    <label>Osc2Gain</label>
                </div>
            </div>
            <div class="general">
                <div class="gain knob-label">
                    <div class="knob-ctn"></div>
                    <label>Gain</label>
                </div>
            </div>
            <div class="keys-container"></div>
        `);
        
        this.audioCtx = new AudioContext();
        this.track = new sai.Track(this.audioCtx);
        this.track.output.connect(this.audioCtx.destination);
        this.track.attack = 0.1;
        this.track.decay = 2;
        this.track.sustain = 0;
        this.track.release = 0.3;
        
        // osc1
        this.osc1Gain = new saisynth.Knob(this.track.osc1Gain, 0, 0.25, "exponential").
            appendTo(this.el.querySelector(".osc1-gain .knob-ctn"));
        this.osc1Gain.on("change:value", () => this.track.osc1Gain = this.osc1Gain.value);
        this.osc1Type = new saisynth.ButtonSelect([["sine", sineHtml()], 
            ["square", squareHtml()],
            ["triangle", triangleHtml()],
            ["sawtooth", sawHtml()],
            ["noise", noiseHtml()]]).appendTo(this.el.querySelector(".osc1-type"));
        this.osc1Type.on("change:value", () => this.track.osc1Type = this.osc1Type.value);
        
        // osc2
        this.osc2Gain = new saisynth.Knob(this.track.osc2Gain, 0, 0.25, "exponential").
            appendTo(this.el.querySelector(".osc2-gain .knob-ctn"));
        this.osc2Gain.on("change:value", () => this.track.osc2Gain = this.osc2Gain.value);
        this.osc2Type = new saisynth.ButtonSelect([["sine", sineHtml()], 
            ["square", squareHtml()],
            ["triangle", triangleHtml()],
            ["sawtooth", sawHtml()],
            ["noise", noiseHtml()]]).appendTo(this.el.querySelector(".osc2-type"));
        this.osc2Type.on("change:value", () => this.track.osc2Type = this.osc2Type.value);
        
        // envelope
        this.attack = new saisynth.Knob(this.track.attack, 0.01, 10, "exponential").
            appendTo(this.el.querySelector(".attack .knob-ctn"));
        this.attack.on("change:value", () => this.track.attack = this.attack.value);
        this.decay = new saisynth.Knob(this.track.decay, 0.01, 10, "exponential").
            appendTo(this.el.querySelector(".decay .knob-ctn"));
        this.decay.on("change:value", () => this.track.decay = this.decay.value);
        this.sustain = new saisynth.Knob(this.track.sustain, 0, 1, "exponential").
            appendTo(this.el.querySelector(".sustain .knob-ctn"));
        this.sustain.on("change:value", () => this.track.sustain = this.sustain.value);
        this.release = new saisynth.Knob(this.track.release, 0.01, 10, "exponential").
            appendTo(this.el.querySelector(".release .knob-ctn"));
        this.release.on("change:value", () => this.track.release = this.release.value);
        
        // lfo
        this.lfoFrequency = new saisynth.Knob(this.track.lfoFrequency, 0.10, 20, "exponential").
            appendTo(this.el.querySelector(".lfo-freq .knob-ctn"));
        this.lfoFrequency.on("change:value", () => this.track.lfoFrequency = this.lfoFrequency.value);
        this.lfoOsc1Gain = new saisynth.Knob(this.track.lfoOsc1Gain, 0, 400, "exponential").
            appendTo(this.el.querySelector(".lfo-osc1-gain .knob-ctn"));
        this.lfoOsc1Gain.on("change:value", () => this.track.lfoOsc1Gain = this.lfoOsc1Gain.value);
        this.lfoOsc2Gain = new saisynth.Knob(this.track.lfoOsc2Gain, 0, 400, "exponential").
            appendTo(this.el.querySelector(".lfo-osc2-gain .knob-ctn"));
        this.lfoOsc2Gain.on("change:value", () => this.track.lfoOsc2Gain = this.lfoOsc2Gain.value);
        
        // gain
        this.gain = new saisynth.Knob(this.track.gain, 0, 8, "exponential").
            appendTo(this.el.querySelector(".gain .knob-ctn"));
        this.gain.on("change:value", () => this.track.gain = this.gain.value);
        
        var receiveMessage = function(mes) {
            console.log("midi message", mes.cmdString, mes);
            this.track.midiMessage(mes);
            this.keys.midiMessage(mes);
        }.bind(this);
        
        this.midiReceiver = new saisynth.MidiReceiver();
        this.midiReceiver.parent = this;
        this.midiReceiver.on("midiMessage", (e) => receiveMessage(e.detail));
        
        // creation of virtual keyboard
        this.keys = new saisynth.Keys().appendTo(this.el.querySelector(".keys-container"));
        this.keys.width = "100%";
        this.keys.height = "100%";
        this.keys.firstNote = 69 - 9 - 12;
        this.keys.keys = 25;
        this.keys.on("midiMessage", (e) => receiveMessage(e.detail));
    }
};

saisynth.MidiReceiver = class MidiReceiver extends widget.EventDispatcher {
    constructor() {
        super();
        this._register();
        this._listening = {};
    }
    _register() {
        window.navigator.requestMIDIAccess().then(function(midiAccess) {
            if (this.destroyed)
                return;
            var inputs = midiAccess.inputs.values();
            var ids = [];
            for (var input = inputs.next(); input && ! input.done; input = inputs.next()) {
                var midiInput = input.value;
                ids.push(midiInput.id);
                if (this._listening[midiInput.id])
                    continue;
                var receive = (message) => this.trigger("midiMessage", new sai.MidiMessage(message.data));
                midiInput.addEventListener("midimessage", receive);
                this._listening[midiInput.id] = [midiInput, receive];
                console.log("listening on MIDI input " + midiInput.id);
            }
            _.each(_.clone(this._listening), function(val, key) {
                if (_.includes(ids, key))
                    return;
                this._listening[key][0].removeEventListener("midimessage", this._listening[key][1]);
                delete this._listening[key];
                console.log("stopping to listen on Midi input " + key);
            }.bind(this));
            setTimeout(this._register.bind(this), 1000);
        }.bind(this));
    }
    destroy() {
        _.each(this._listening, function(val, key) {
            val[0].removeEventListener("midimessage", val[1]);
        });
        super.destroy();
    }
};

function squareHtml() {
    var el = document.createElement("div");
    el.innerHTML = tenv.renderString(`
        <svg width="24px" height="16px" viewBox="0 0 15 10" preserveAspectRatio="none"
            style="margin-top: 2px; margin-bottom: -3px;"></svg>
    `);
    var _s = Snap(el.querySelector('svg'));
    var c = _s.path("M 1 1 L 7.5 1 L 7.5 9 L 14 9").attr({
        fill: "none",
        "stroke": "#bbbbbb",
        "strokeWidth": 2,
    });
    return el.innerHTML;
};

function sineHtml() {
    var el = document.createElement("div");
    el.innerHTML = tenv.renderString(`
        <svg width="24px" height="16px" viewBox="0 0 15 10" preserveAspectRatio="none"
            style="margin-top: 2px; margin-bottom: -3px;"></svg>
    `);
    var _s = Snap(el.querySelector('svg'));
    var c = _s.path("M 1 5 C 1 0, 7.5 0, 7.5 5 S 14 10, 14 5").attr({
        fill: "none",
        "stroke": "#bbbbbb",
        "strokeWidth": 2,
    });
    return el.innerHTML;
};

function triangleHtml() {
    var el = document.createElement("div");
    el.innerHTML = tenv.renderString(`
        <svg width="24px" height="16px" viewBox="0 0 15 10" preserveAspectRatio="none"
            style="margin-top: 2px; margin-bottom: -3px;"></svg>
    `);
    var _s = Snap(el.querySelector('svg'));
    var c = _s.path("M 1 9 L 7.5 1 L 14 9").attr({
        fill: "none",
        "stroke": "#bbbbbb",
        "strokeWidth": 2,
    });
    return el.innerHTML;
};

function sawHtml() {
    var el = document.createElement("div");
    el.innerHTML = tenv.renderString(`
        <svg width="24px" height="16px" viewBox="0 0 15 10" preserveAspectRatio="none"
            style="margin-top: 2px; margin-bottom: -3px;"></svg>
    `);
    var _s = Snap(el.querySelector('svg'));
    var c = _s.path("M 1 9 L 14 1 L 14 9").attr({
        fill: "none",
        "stroke": "#bbbbbb",
        "strokeWidth": 2,
    });
    return el.innerHTML;
};

function noiseHtml() {
    var el = document.createElement("div");
    el.innerHTML = tenv.renderString(`
        <svg width="24px" height="16px" viewBox="0 0 10 10" preserveAspectRatio="none"
            style="margin-top: 2px; margin-bottom: -3px;"></svg>
    `);
    var _s = Snap(el.querySelector('svg'));
    var c = _s.path("M 1 5 L 2 3 L 2 7 L 3 4 L 3 6 L 4 2 L 4 8 L 5 1 L 5 9 L 6 2 L 6 8 L 7 4 L 7 6 L 8 3 L 8 7 L 9 5").attr({
        fill: "none",
        "stroke": "#bbbbbb",
        "strokeWidth": 0.4,
    });
    return el.innerHTML;
};

})();
