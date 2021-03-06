
import * as widget from 'widgetjs';
import tenv from './tenv';
import _ from 'lodash';
import * as sai from 'sai-experiment';
import $ from 'jquery';

const Snap = require(`imports-loader?this=>window,fix=>module.exports=0!snapsvg/dist/snap.svg.js`);

export class Knob extends widget.Widget {
    get className() { return "knob"; }
    constructor(defaultValue, min, max, mode) {
        super();
        this.el.innerHTML = tenv.renderString(`
            <svg width="100%" height="100%" viewBox="0 0 10 10" preserveAspectRatio="none"></svg>
        `);
        this._s = Snap(this.el.querySelector('svg'));
        var c = this._s.circle(5, 5, 4.3).attr({
            "stroke": "#2A9FD6",
            "strokeWidth": 0.5,
        });
        var l = this._s.line(5, 1.7, 5, 5).attr({
            "stroke": "#2A9FD6",
            "strokeWidth": 0.5,
            "strokeLinecap": "round",
        });
        this._svgKnob = this._s.group(c, l);
        
        this._value = defaultValue === undefined ? 0 : defaultValue;
        this._defaultValue = defaultValue === undefined ? 0 : defaultValue;
        this._min = min === undefined ? 0 : min;
        this._max = max === undefined ? 1 : max;
        this._mode = mode === undefined ? "normal" : mode;
        this._updatingIValue = false;
        this._updatingValue = false;
        this.on({
            "change:value": this._valueChange,
            "change:iValue": this._iValueChange,
            "dom:mousedown": this._mouseDown,
            "dom:dblclick": () => this.value = this.defaultValue,
        });
        this.value = this._value;
        
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
        this._max = val;
        this.trigger("change:max");
        this.value = this.value;
    }
    get mode() {
        return this._mode;
    }
    set mode(val) {
        this._mode = val;
        this.trigger("change:mode");
        this.value = this.value;
    }
    _valueChange() {
        if (this._updatingIValue)
            return;
        this._updatingValue = true;
        this.iValue = (this.value - this.min) / (this.max - this.min);
        this._updatingValue = false;
    }
    get iValue() {
        return this.__iValue;
    }
    set iValue(val) {
        this.__iValue = Math.min(Math.max(val, 0), 1);
        this.trigger("change:iValue");
    }
    _iValueChange() {
        var degrees = (this.iValue * (135 * 2)) - 135;
        this._svgKnob.transform('rotate(' + degrees + ', 5, 5)');
        //this.el.querySelector(".knob-circle").style.transform = "rotate(" + degrees + "deg)";
        if (this._updatingValue)
            return;
        this._updatingIValue = true;
        var val = this.iValue;
        if (this.mode === "exponential")
            val = Math.pow(val, 2);
        this.value = (val * (this.max - this.min)) + this.min;
        this._updatingIValue = false;
    }
    _mouseDown(e) {
        var mult = 0.005;
        var iValue = this.iValue;
        var initialX = e.screenX;
        var initialY = e.screenY;
        var moveCallback = function(e) {
            this.iValue = iValue + ((e.screenX - initialX) * mult) + ((initialY - e.screenY) * mult);
        }.bind(this);
        var upCallback = (e) => {
            window.removeEventListener("mousemove", moveCallback);
            window.removeEventListener("mouseup", upCallback);
        };
        window.addEventListener("mousemove", moveCallback);
        window.addEventListener("mouseup", upCallback);
    }
}

var hasTouch = function() {
    return 'ontouchstart' in window;
};

export class Keys extends widget.Widget {
    get className() { return "keys"; }
    get attributes() { return {"style": "display: inline-block; position: relative; width: 640px; height: 100px;"}; }
    constructor() {
        super();
        this._firstNote = (69 - 9) - (12 * 2);
        this._keys = 49;
        this._fingers = {};
        this.el.innerHTML = `
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
            <div class="keyboad-overlay" style="position: absolute; top: 0; bottom: 0; right: 0;
                left: 0; cursor: pointer;"></div>
        `;
        this._s = Snap(this.el.querySelector('svg'));
        this.on({
            "appendedToDom": this.apply,
        });
        if (hasTouch()) {
            this.on({
                "dom:touchstart .keyboad-overlay": this.calcTouch,
                "dom:touchend .keyboad-overlay": this.calcTouch,
                "dom:touchmove .keyboad-overlay": this.calcTouch,
            });
        } else {
            this.on({
                "dom:mousedown .keyboad-overlay": this.calcMouse,
                "dom:mouseup .keyboad-overlay": this.calcMouse,
                "dom:mouseenter .keyboad-overlay": this.calcMouse,
                "dom:mouseout .keyboad-overlay": this.calcMouse,
                "dom:mousemove .keyboad-overlay": this.calcMouse,
            });
        }
    }
    get width() {
        return this.el.style.width;
    }
    set width(val) {
        this.el.style.width = val;
    }
    get height() {
        return this.el.style.height;
    }
    set height(val) {
        this.el.style.height = val;
    }
    get firstNote() {
        return this._firstNote;
    }
    set firstNote(val) {
        this._firstNote = val;
        this.apply();
    }
    get keys() {
        return this._keys;
    }
    set keys(val) {
        this._keys = val;
        this.apply();
    }
    apply() {
        if (! this.appendedToDom)
            return;
        this.el.querySelector('svg').innerHTML = "";
        var whites = new Set([0, 2, 4, 5, 7, 9, 11]);
        
        var start = this.firstNote;
        var stop = this.firstNote + this.keys;
        var nbrWhites = _.range(start, stop).reduce((c, x) => whites.has(x % 12) ? c + 1 : c, 0);
        var whiteStep = 100. / nbrWhites;
        var pos = 0;
        this._notes = {};
        this._keysList = [];
        _.range(start, stop).forEach(function(note) {
            if (whites.has(note % 12)) {
                var w = this._s.rect(pos, 0, whiteStep, 100);
                w.attr({
                    "fill": "white",
                    "stroke": "black",
                    "strokeWidth": 0.1,
                });
                this._s.prepend(w);
                w.note = note;
                w.color = "white";
                w.pcolor= "#9EDFFF";
                this._notes[note] = w;
                this._keysList.push(w);
                if (whites.has((note + 1) % 12)) {
                    pos += whiteStep;
                } else {
                    pos += whiteStep * 0.70;
                }
            } else {
                var b = this._s.rect(pos, 0, whiteStep * 0.60, 60).attr("fill", "black");
                b.note = note;
                b.color = "black";
                b.pcolor = "#007DB9";
                this._notes[note] = b;
                this._keysList.unshift(b);
                pos += whiteStep * 0.30;
            }
        }.bind(this));
    }
    findNote(x, y) {
        x = (x / $(this.el).width()) * 100;
        y = (y / $(this.el).height()) * 100;
        for (var i = 0; i < this._keysList.length; i++) {
            var k = this._keysList[i];
            if (x >= parseFloat(k.attr("x")) && x <= parseFloat(k.attr("x")) + parseFloat(k.attr("width")) &&
                y >= parseFloat(k.attr("y")) && y <= parseFloat(k.attr("y")) + parseFloat(k.attr("height")))
                return k.note;
        }
        return null;
    }
    finger(num) {
        if (! (("" + num) in this._fingers)) {
            this._fingers[num] = {current: null};
        }
        return this._fingers[num];
    }
    calcMouse(e) {
        var finger = this.finger(0);
        if ((e.type === "mouseout" || e.type === "mouseup") && finger.current !== null) {
            this._noteReleased(finger.current);
            finger.current = null;
            return;
        }
        var note = this.findNote(e.offsetX, e.offsetY);
        if (note === null)
            return;
        if (e.type === "mousedown" || (e.type === "mouseenter" && e.which === 1)) {
            this._notePressed(note);
            finger.current = note;
        } else if (e.type === "mousemove") {
            if (finger.current !== null && finger.current !== note) {
                this._noteReleased(finger.current);
                this._notePressed(note);
                finger.current = note;
            }
        }
    }
    calcTouch(e) {
        _.each(e.originalEvent.touches, _.bind(function(touch) {
            var finger = this.finger(touch.identifier);
            var top = $(this.el).offset().top;
            var left = $(this.el).offset().left;
            var x = touch.pageX - left;
            var y = touch.pageY - top;
            // TODO: fix, this variable
            // var note = this.findNote(x / pageScale, y / pageScale);
            var note = this.findNote(x, y);
            if (finger.current !== note) {
                if (finger.current !== null)
                    this._noteReleased(finger.current);
                if (note !== null)
                    this._notePressed(note);
                finger.current = note;
            }
        }, this));
        var touches = _.map(e.originalEvent.touches, function(touch) {
            return "" + touch.identifier;
        });
        _.each(this._fingers, _.bind(function(finger, id) {
            if (! _.contains(touches, id) && finger.current !== null) {
                this._noteReleased(finger.current);
                finger.current = null;
            }
        }, this));
    }
    _notePressed(note) {
        var mes = new sai.MidiMessage();
        mes.cmd = sai.MidiMessage.commands.noteOn;
        mes.note = note;
        mes.velocity = 127;
        this.trigger("midiMessage", mes);
    }
    _noteReleased(note) {
        var mes = new sai.MidiMessage();
        mes.cmd = sai.MidiMessage.commands.noteOff;
        mes.note = note;
        this.trigger("midiMessage", mes);
    }
    midiMessage(mes) {
        var note = this._notes[mes.note];
        if (! note)
            return;
        if (mes.cmd === sai.MidiMessage.commands.noteOn) {
            note.attr("fill", note.pcolor);
        } else if (mes.cmd === sai.MidiMessage.commands.noteOff) {
            note.attr("fill", note.color);
        }
    }
}

export class ButtonSelect extends widget.Widget {
    get tagName() { return "span"; }
    get className() { return "button-select btn-group"; }
    get attributes() { return { "role": "group" }; }
    constructor(values) {
        super();
        this._values = values;
        this.el.innerHTML = tenv.renderString(`
            {% for val in values %}
            <button type="button" class="btn btn-default" data-value="{{ val[0] }}">{{ val[1] | safe }}</button>
            {% endfor %}
        `, {values: values});
        this.value = values[0][0];
        this.on("dom:click button", (e) => this.value = e.bindedTarget.dataset.value);
    }
    get value() {
        return this._value;
    }
    set value(val) {
        this._value = val;
        this.el.querySelectorAll("button").forEach((el) => el.classList.remove("selected"));
        this.el.querySelector("button[data-value='" + val + "']").classList.add("selected");
        this.trigger("change:value");
    }
}
