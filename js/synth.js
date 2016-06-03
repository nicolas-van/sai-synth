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
        this.track = new sai.Track(this.audioCtx);
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
        
        var receiveMessage = function(message) {
            var mes = new sai.MidiMessage(message.data);
            console.log("midi message", mes.cmdString, mes);
            
            this.track.midiMessage(mes);
        }.bind(this);
        
        this.keys = new saisynth.Keys().appendTo(this.el);
        
        this.keys.on({
            "notePressed": function(e) {
                var mes = new sai.MidiMessage();
                mes.cmd = sai.MidiMessage.commands.noteOn;
                mes.note = e.detail;
                this.track.midiMessage(mes);
            }.bind(this),
            "noteReleased": function(e) {
                var mes = new sai.MidiMessage();
                mes.cmd = sai.MidiMessage.commands.noteOff;
                mes.note = e.detail;
                this.track.midiMessage(mes);
            }.bind(this),
        });
    }
};

})();
