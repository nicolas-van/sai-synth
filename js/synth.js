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
                <div class="knob-label osc1-gain">
                    <div class="knob-ctn"></div>
                    <label>Gain</label>
                </div>
            </div>
        `);
        
        this.audioCtx = new AudioContext();
        this.track = new sai.Track(this.audioCtx);
        this.track.output.connect(this.audioCtx.destination);
        
        this.osc1Gain = new saisynth.Knob();
        this.osc1Gain.appendTo(this.el.querySelector(".osc1-gain .knob-ctn"));
        
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
