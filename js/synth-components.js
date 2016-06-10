
(function() {
"use strict";

var tenv = saisynth._tenv;

saisynth.Knob = class Knob extends widget.Widget {
    get className() { return "knob"; }
    render() {
        return tenv.renderString(`
            <div class="knob-circle">
                <div class="knob-bar"></div>
            </div>
        `);
    }
    constructor(defaultValue, min, max) {
        super();
        this._value = defaultValue === undefined ? 0 : defaultValue;
        this._defaultValue = defaultValue === undefined ? 0 : defaultValue;
        this._min = min === undefined ? 0 : min;
        this._max = max === undefined ? 1 : max;
        this._updatingPercent = false;
        this._updatingValue = false;
        this.on({
            "change:value": this._valueChange,
            "change:percent": this._percentChange,
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
        this._max = max;
        this.trigger("change:max");
        this.value = this.value;
    }
    _valueChange() {
        if (this._updatingPercent)
            return;
        this._updatingValue = true;
        this.percent = (this.value - this.min) / (this.max - this.min);
        this._updatingValue = false;
    }
    get percent() {
        return this.__percent;
    }
    set percent(val) {
        this.__percent = Math.min(Math.max(val, 0), 1);
        this.trigger("change:percent");
    }
    _percentChange() {
        var degrees = (this.percent * (135 * 2)) - 135;
        this.el.querySelector(".knob-circle").style.transform = "rotate(" + degrees + "deg)";
        if (this._updatingValue)
            return;
        this._updatingPercent = true;
        this.value = (this.percent * (this.max - this.min)) + this.min;
        this._updatingPercent = false;
    }
    _mouseDown(e) {
        var mult = 0.005;
        var percent = this.percent;
        var initialX = e.screenX;
        var initialY = e.screenY;
        var moveCallback = function(e) {
            this.percent = percent + ((e.screenX - initialX) * mult) + ((initialY - e.screenY) * mult);
        }.bind(this);
        var upCallback = function(e) {
            window.removeEventListener("mousemove", moveCallback);
            window.removeEventListener("mouseup", upCallback);
        }.bind(this);
        window.addEventListener("mousemove", moveCallback);
        window.addEventListener("mouseup", upCallback);
    }
}

var hasTouch = function() {
    return 'ontouchstart' in window;
};

saisynth.Keys = class Keys extends widget.Widget {
    get className() { return "keys"; }
    constructor(options) {
        super();
        this._options = _.defaults(options, {
            width: 640,
            height: 100,
        });
        this.fingers = {};
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
    apply() {
        var width = this._options.width;
        var height = this._options.height;
        this.el.style.width = "" + width + "px";
        this.el.style.height = "" + height + "px";
        var nbrWhite = 7 * 6;
        var blackHProp = 0.6;
        var blackWProp = 0.65;
        var offset = 0;
        var firstNote = 69 - 9 - (12 * 2);

        var kwidth = width / nbrWhite;
        var kheight = height;
        var bkwidth = kwidth * blackWProp;
        var bkheight = kheight * blackHProp;
        var pos = 0;
        var note = firstNote;
        var blacks = [];
        var whites = [];
        this.notes = {};
        _.each(_.range(nbrWhite), function(i) {
            var k = $("<div></div>");
            k.css("top", 0);
            k.css("left", pos);
            k.data("left", pos);
            k.css("width", kwidth);
            k.css("height", kheight);
            k.addClass("white");
            k.data("note", note);
            if (note % 12 === (69 - 9) % 12) {
                k.append($("<span></span>").text(Math.floor(note / 12) - 1));
            }
            $(this.el).append(k);
            whites.push(k);
            this.notes[note] = k;
            note += 1;

            if (_.includes([0, 1, 3, 4, 5], (i + offset) % 7)) {
                k = $("<div></div>");
                k.css("top", 0);
                k.css("left", pos + kwidth - (bkwidth / 2));
                k.data("left", pos + kwidth - (bkwidth / 2));
                k.css("width", bkwidth);
                k.css("height", bkheight);
                k.addClass("black");
                k.data("note", note);
                $(this.el).append(k);
                blacks.push(k);
                this.notes[note] = k;
                note += 1;
            }

            pos += kwidth;
        }.bind(this));
        this.keys = [].concat(blacks).concat(whites);
        $(this.el).append($("<div></div>").addClass("keyboad-overlay"));
    }
    findNote(x, y) {
        for (var i = 0; i < this.keys.length; i++) {
            var k = this.keys[i];
            if (x >= k.data("left") && x <= k.data("left") + k.outerWidth() &&
                y >= 0 && y <= k.outerHeight())
                return k.data("note");
        }
        return null;
    }
    finger(num) {
        if (! (("" + num) in this.fingers)) {
            this.fingers[num] = {current: null};
        }
        return this.fingers[num];
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
            var note = this.findNote(x / pageScale, y / pageScale);
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
        _.each(this.fingers, _.bind(function(finger, id) {
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
        if (mes.cmd === sai.MidiMessage.commands.noteOn) {
            if (this.notes[mes.note])
                this.notes[mes.note].addClass("pressed");
        } else if (mes.cmd === sai.MidiMessage.commands.noteOff) {
            if (this.notes[mes.note])
                this.notes[mes.note].removeClass("pressed");
        }
    }
}

saisynth.ButtonSelect = class ButtonSelect extends widget.Widget {
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
        this.on("dom:click button", (e) => this.value = e.target.dataset.value);
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


})();
