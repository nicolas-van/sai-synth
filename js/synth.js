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
            <div>Play using a MIDI keyboard</div>
        `);
        
        this.audioCtx = new AudioContext();
        var instrument = {
            oscillators: [
                {
                    type: "sine",
                    gain: 1,
                    freqOsc: {
                        type: "sine",
                        amount: 0,
                        frequency: 10,
                    },
                },
            ],
            filters: [
                {
                    type: "highpass",
                    frequency: 0,
                    gain: 0,
                    q: 1000,
                },
            ],
            attack: 0.05,
            decay: 0.05,
            sustainLevel: 0.5,
            sustainTime: 0.2,
            release: 0.1,
            gain: 0.2,

            noise: 0,
            delay: 0,
            delayTime: 0.3,
            panAmount: 0,
            panFrequency: 2,
        };
        this.track = new sai.Track(this.audioCtx, instrument);
        this.track.output.connect(this.audioCtx.destination);
        
        console.log("trying to get midi access");
        window.navigator.requestMIDIAccess().then(function(midiAccess) {
            var inputs = midiAccess.inputs.values();
            var n = 0;
            for (var input = inputs.next(); input && ! input.done; input = inputs.next()) {
                input.value.onmidimessage = receiveMessage;
                n++;
            }
            console.log("listening on " + n + " MIDI inputs");
        }.bind(this));
        
        var notes = {};
        
        var press = function(note) {
            if (notes[note]) {
                note.end();
            }
            notes[note] = this.track.playNote(note, null, false);
        }.bind(this);
        
        var release = function(note) {
            if (notes[note]) {
                notes[note].end();
                notes[note] = undefined;
            }
        }.bind(this);
        
        var receiveMessage = function(message) {
            console.log(message);
            var data = message.data;
            var info = {
                cmd: data[0] >> 4,
                channel: data[0] & 0xf,
                type: data[0] & 0xf0,
                note: data[1],
                velocity: data[2],
            };
            
            if (info.type === 144) {
                press(info.note);
            } else if (info.type === 128) {
                release(info.note);
            }
        }.bind(this);
        
        this.keys = new saisynth.Keys().appendTo(this.el);
        
        this.keys.on({
            "notePressed": function(e) {
                press(e.detail);
            }.bind(this),
            "noteReleased": function(e) {
                release(e.detail);
            }.bind(this),
        });
    }
};

})();
