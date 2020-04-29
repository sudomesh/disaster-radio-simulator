
var xtend = require('xtend');

function Radio(opts) {

  /* 
   Airtime calculations based on the LoRa airtime calculator:
   https://docs.google.com/spreadsheets/d/1voGAtQAjC1qBmaVuP1ApNKs1ekgUjavHuVQIXyYSvNc/edit
 */

  // all distances in meters
  this.opts = xtend({
    range: 3000, // how far can we send
    rangeDelta: [0.0, 0.2], // variation in range over time
    snr: 1, // signal to noise ratio
    snrDelta: [0.0, 2.0], // variation in snr over time
    spreadingFactor: 9, // LoRa spreading factor
    explicitHeader: true, // whether to include the low-level LoRa header
    lowDROptimize: false, // intended to correct for clock drift at SF11 and SF12
    codingRate: 5, // (interpret as "4/codingRate"), error correction. higher values add more overhead
    preambleSymbols: 8, 
    bandwidth: 125, // in kHz
    
  }, opts || {});

  this.opts.explicitHeader = (this.opts.explicitHeader) ? 1 : 0;
  this.opts.lowDROptimize = (this.opts.lowDROptimize) ? 1 : 0;

  this.timePerSymbol = (Math.pow(2, this.opts.spreadingFactor) / (this.opts.bandwidth * 1000)) * 1000;
  this.timePreamble = (this.opts.preambleSymbols + 4.25) * this.timePerSymbol;

  // get the number of symbols in a payload
  this.getSymbolCount = function(payload) {
    var len = Buffer.from(payload, 'utf8').length;
    return 8 + (Math.max(Math.ceil((8 * len - 4 * this.opts.spreadingFactor + 28 + 16 - 20 * (1 - this.opts.explicitHeader)) / (4 * (this.opts.spreadingFactor - 2 * this.opts.lowDROptimize))) * this.opts.codingRate, 0));
  }

  this.getPayloadTime = function(payload) {
    return this.getSymbolCount(payload) * this.timePerSymbol;
  }

  this.getPacketTime = function(payload) {
    return this.getPayloadTime(payload) + this.timePreamble;
  }

  this.toString = function() {
    return 'range: ' + this.opts.range + ' | ' + 'snr: ' + this.opts.snr;
  }

}


module.exports = Radio;
