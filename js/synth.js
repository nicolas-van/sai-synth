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
        `);
        
        this.audioCtx = new AudioContext();
        this.track = new sai.Track(this.audioCtx);
        this.track.output.connect(this.audioCtx.destination);
        this.track.attack = 0.1;
        this.track.decay = 2;
        this.track.sustain = 0;
        this.track.release = 0.3;
        
        // osc1
        this.osc1Gain = new saisynth.Knob(this.track.osc1Gain, 0, 1, "exponential").
            appendTo(this.el.querySelector(".osc1-gain .knob-ctn"));
        this.osc1Gain.on("change:value", () => this.track.osc1Gain = this.osc1Gain.value);
        this.osc1Type = new saisynth.ButtonSelect([["sine", "sine"], 
            ["square", "square"],
            ["triangle", "triangle"],
            ["sawtooth", "sawtooth"],
            ["noise", "noise"]]).appendTo(this.el.querySelector(".osc1-type"));
        this.osc1Type.on("change:value", () => this.track.osc1Type = this.osc1Type.value);
        
        // osc2
        this.osc2Gain = new saisynth.Knob(this.track.osc2Gain, 0, 1, "exponential").
            appendTo(this.el.querySelector(".osc2-gain .knob-ctn"));
        this.osc2Gain.on("change:value", () => this.track.osc2Gain = this.osc2Gain.value);
        this.osc2Type = new saisynth.ButtonSelect([["sine", "sine"], 
            ["square", "square"],
            ["triangle", "triangle"],
            ["sawtooth", "sawtooth"],
            ["noise", "noise"]]).appendTo(this.el.querySelector(".osc2-type"));
        this.osc2Type.on("change:value", () => this.track.osc2Type = this.osc2Type.value);
        
        // envelope
        this.attack = new saisynth.Knob(this.track.attack, 0, 10, "exponential").
            appendTo(this.el.querySelector(".attack .knob-ctn"));
        this.attack.on("change:value", () => this.track.attack = this.attack.value);
        this.decay = new saisynth.Knob(this.track.decay, 0, 10, "exponential").
            appendTo(this.el.querySelector(".decay .knob-ctn"));
        this.decay.on("change:value", () => this.track.decay = this.decay.value);
        this.sustain = new saisynth.Knob(this.track.sustain, 0, 1, "exponential").
            appendTo(this.el.querySelector(".sustain .knob-ctn"));
        this.sustain.on("change:value", () => this.track.sustain = this.sustain.value);
        this.release = new saisynth.Knob(this.track.release, 0, 10, "exponential").
            appendTo(this.el.querySelector(".release .knob-ctn"));
        this.release.on("change:value", () => this.track.release = this.release.value);
        
        var receiveMessage = function(mes) {
            console.log("midi message", mes.cmdString, mes);
            this.track.midiMessage(mes);
            this.keys.midiMessage(mes);
        }.bind(this);
        
        this.midiReceiver = new saisynth.MidiReceiver();
        this.midiReceiver.parent = this;
        this.midiReceiver.on("midiMessage", (e) => receiveMessage(e.detail));
        
        // creation of virtual keyboard
        this.keys = new saisynth.Keys().appendTo(this.el);
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

})();
