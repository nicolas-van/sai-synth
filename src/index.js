
import * as widget from 'widgetjs';
import * as saisynth from './saisynth';
import './less/style.less';

widget.ready(function() {
  console.log("inited");
  var synth = new saisynth.SaiSynth();
  synth.appendTo(document.body);
});
