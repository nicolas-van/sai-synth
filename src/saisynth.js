
import * as widget from 'widgetjs';
import _ from 'lodash'
import tenv from './tenv';
import { Knob, Keys, ButtonSelect } from './synth-components';
import * as sai from 'sai-experiment';

export class SaiSynth extends widget.Widget {
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
                <span class="lfo-type"></span>
                <div class="lfo-freq knob-label">
                    <div class="knob-ctn"></div>
                    <label>LFO F.</label>
                </div>
                <div class="lfo-gain knob-label">
                    <div class="knob-ctn"></div>
                    <label>LFO Amount</label>
                </div>
                <span class="lfo-osc-state"></span>
                <span class="lfo-filter-state"></span>
            </div>
            <div class="filter">
                <span class="filter-type">
                </span>
                <div class="filter-detune knob-label">
                    <div class="knob-ctn"></div>
                    <label>Filter Detune</label>
                </div>
                <div class="filter-q knob-label">
                    <div class="knob-ctn"></div>
                    <label>Filter Q</label>
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
        
        // osc1
        this.osc1Gain = new Knob(this.track.osc1Gain, 0, 0.25, "exponential")
          .appendTo(this.el.querySelector(".osc1-gain .knob-ctn"));
        this.osc1Gain.on("change:value", () => this.track.osc1Gain = this.osc1Gain.value);
        this.osc1Type = new ButtonSelect([["sine", sineHtml], 
            ["square", squareHtml],
            ["triangle", triangleHtml],
            ["sawtooth", sawHtml],
            ["noise", noiseHtml]]).appendTo(this.el.querySelector(".osc1-type"));
        this.osc1Type.value = this.track.osc1Type;
        this.osc1Type.on("change:value", () => this.track.osc1Type = this.osc1Type.value);
        
        // osc2
        this.osc2Gain = new Knob(this.track.osc2Gain, 0, 0.25, "exponential")
          .appendTo(this.el.querySelector(".osc2-gain .knob-ctn"));
        this.osc2Gain.on("change:value", () => this.track.osc2Gain = this.osc2Gain.value);
        this.osc2Type = new ButtonSelect([["sine", sineHtml], 
            ["square", squareHtml],
            ["triangle", triangleHtml],
            ["sawtooth", sawHtml],
            ["noise", noiseHtml]]).appendTo(this.el.querySelector(".osc2-type"));
        this.osc2Type.value = this.track.osc2Type;
        this.osc2Type.on("change:value", () => this.track.osc2Type = this.osc2Type.value);
        
        // envelope
        this.attack = new Knob(this.track.attack, 0.01, 10, "exponential")
          .appendTo(this.el.querySelector(".attack .knob-ctn"));
        this.attack.on("change:value", () => this.track.attack = this.attack.value);
        this.decay = new Knob(this.track.decay, 0.01, 10, "exponential")
          .appendTo(this.el.querySelector(".decay .knob-ctn"));
        this.decay.on("change:value", () => this.track.decay = this.decay.value);
        this.sustain = new Knob(this.track.sustain, 0, 1, "exponential")
          .appendTo(this.el.querySelector(".sustain .knob-ctn"));
        this.sustain.on("change:value", () => this.track.sustain = this.sustain.value);
        this.release = new Knob(this.track.release, 0.01, 10, "exponential")
          .appendTo(this.el.querySelector(".release .knob-ctn"));
        this.release.on("change:value", () => this.track.release = this.release.value);
        
        // lfo
        this.lfoType = new ButtonSelect([["sine", sineHtml], 
            ["square", squareHtml],
            ["triangle", triangleHtml],
            ["sawtooth", sawHtml]]).appendTo(this.el.querySelector(".lfo-type"));
        this.lfoType.value = this.track.lfoType;
        this.lfoType.on("change:value", () => this.track.lfoType = this.lfoType.value);
        this.lfoFrequency = new Knob(this.track.lfoFrequency, 0.10, 20, "exponential")
          .appendTo(this.el.querySelector(".lfo-freq .knob-ctn"));
        this.lfoFrequency.on("change:value", () => this.track.lfoFrequency = this.lfoFrequency.value);
        this.lfoGain = new Knob(this.track.lfoGain, 0, 400, "exponential")
          .appendTo(this.el.querySelector(".lfo-gain .knob-ctn"));
        this.lfoGain.on("change:value", () => this.track.lfoGain = this.lfoGain.value);
        this.lfoOscState = new ButtonSelect([["on", "on"], 
            ["off", "off"]]).appendTo(this.el.querySelector(".lfo-osc-state"));
        this.lfoOscState.value = this.track.lfoOsc1Gain === 1 ? "on" : "off";
        this.lfoOscState.on("change:value", function() {
            this.track.lfoOsc1Gain = this.lfoOscState.value === "on" ? 1 : 0;
            this.track.lfoOsc2Gain = this.lfoOscState.value === "on" ? 1 : 0;
        }.bind(this));
        this.lfoFilterState = new ButtonSelect([["on", "on"], 
            ["off", "off"]]).appendTo(this.el.querySelector(".lfo-filter-state"));
        this.lfoFilterState.value = this.track.lfoFilterGain === 1 ? "on" : "off";
        this.lfoFilterState.on("change:value", function() {
            this.track.lfoFilterGain = this.lfoFilterState.value === "on" ? 1 : 0;
        }.bind(this));
        
        // filter
        this.filterType = new ButtonSelect([["highpass", highpassHtml],
            ["lowpass", lowpassHtml], 
            ["bandpass", bandpassHtml],
            ["notch", notchHtml]]).appendTo(this.el.querySelector(".filter-type"));
        this.filterType.value = this.track.filterType;
        this.filterType.on("change:value", () => this.track.filterType = this.filterType.value);
        this.filterDetune = new Knob(this.track.filterDetune, -10000, 10000, "normal")
          .appendTo(this.el.querySelector(".filter-detune .knob-ctn"));
        this.filterDetune.on("change:value", () => this.track.filterDetune = this.filterDetune.value);
        this.filterQ = new Knob(this.track.filterQ, 1, 100, "exponential")
          .appendTo(this.el.querySelector(".filter-q .knob-ctn"));
        this.filterQ.on("change:value", () => this.track.filterQ = this.filterQ.value);
        
        // gain
        this.gain = new Knob(this.track.gain, 0, 8, "exponential")
          .appendTo(this.el.querySelector(".gain .knob-ctn"));
        this.gain.on("change:value", () => this.track.gain = this.gain.value);
        
        var receiveMessage = function(mes) {
            console.log("midi message", mes.cmdString, mes);
            this.track.midiMessage(mes);
            this.keys.midiMessage(mes);
        }.bind(this);
        
        this.midiReceiver = new MidiReceiver();
        this.midiReceiver.parent = this;
        this.midiReceiver.on("midiMessage", (e) => receiveMessage(e.detail));
        
        // creation of virtual keyboard
        this.keys = new Keys().appendTo(this.el.querySelector(".keys-container"));
        this.keys.width = "100%";
        this.keys.height = "100%";
        this.keys.firstNote = 69 - 9 - 12;
        this.keys.keys = 25;
        this.keys.on("midiMessage", (e) => receiveMessage(e.detail));
    }
};

export class MidiReceiver extends widget.EventDispatcher {
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

var sineHtml = `
<svg width="24px" height="16px" viewBox="0 0 15 10" preserveAspectRatio="none"
    style="margin-top: 2px; margin-bottom: -3px;">
    <path d="M 1 5 C 1 0, 7.5 0, 7.5 5 S 14 10, 14 5" fill="none" stroke="#bbbbbb" style="stroke-width: 2;"></path>
</svg>
`;

var squareHtml = `
<svg width="24px" height="16px" viewBox="0 0 15 10" preserveAspectRatio="none"
    style="margin-top: 2px; margin-bottom: -3px;">
    <path d="M 1 1 L 7.5 1 L 7.5 9 L 14 9" fill="none" stroke="#bbbbbb" style="stroke-width: 2;"></path>
</svg>
`;

var triangleHtml = `
<svg width="24px" height="16px" viewBox="0 0 15 10" preserveAspectRatio="none"
    style="margin-top: 2px; margin-bottom: -3px;">
    <path d="M 1 9 L 7.5 1 L 14 9" fill="none" stroke="#bbbbbb" style="stroke-width: 2;"></path>
</svg>`;

var sawHtml = `
<svg width="24px" height="16px" viewBox="0 0 15 10" preserveAspectRatio="none"
    style="margin-top: 2px; margin-bottom: -3px;">
    <path d="M 1 9 L 14 1 L 14 9" fill="none" stroke="#bbbbbb" style="stroke-width: 2;"></path>
</svg>
`;

var noiseHtml = `
<svg width="24px" height="16px" viewBox="0 0 10 10" preserveAspectRatio="none"
    style="margin-top: 2px; margin-bottom: -3px;">
    <path d="M 1 5 L 2 3 L 2 7 L 3 4 L 3 6 L 4 2 L 4 8 L 5 1 L 5 9 L 6 2 L 6 8 L 7 4 L 7 6 L 8 3 L 8 7 L 9 5"
        fill="none" stroke="#bbbbbb" style="stroke-width: 0.4;"></path>
</svg>
`;

var highpassHtml = `
<svg width="24px" height="16px" viewBox="0 0 15 10" preserveAspectRatio="none"
    style="margin-top: 2px; margin-bottom: -3px;">
    <path d="M 1 9 L 4 9 C 5 9, 7.5 6, 7.5 5 S 10 1, 11 1 L 14 1" fill="none" stroke="#bbbbbb" style="stroke-width: 2;"></path>
</svg>
`;

var lowpassHtml = `
<svg width="24px" height="16px" viewBox="0 0 15 10" preserveAspectRatio="none"
    style="margin-top: 2px; margin-bottom: -3px;">
    <path d="M 1 1 L 4 1 C 5 1, 7.5 4, 7.5 5 S 10 9, 11 9 L 14 9" fill="none" stroke="#bbbbbb" style="stroke-width: 2;"></path>
</svg>
`;

var bandpassHtml = `
<svg width="24px" height="16px" viewBox="0 0 15 10" preserveAspectRatio="none"
    style="margin-top: 2px; margin-bottom: -3px;">
    <path d="M 1 9 L 4 9 C 5 9, 6.5 1, 7.5 1 S 10 9, 11 9 L 14 9" fill="none" stroke="#bbbbbb" style="stroke-width: 2;"></path>
</svg>
`;

var notchHtml = `
<svg width="24px" height="16px" viewBox="0 0 15 10" preserveAspectRatio="none"
    style="margin-top: 2px; margin-bottom: -3px;">
    <path d="M 1 1 L 4 1 C 5 1, 6.5 9, 7.5 9 S 10 1, 11 1 L 14 1" fill="none" stroke="#bbbbbb" style="stroke-width: 2;"></path>
</svg>
`;
