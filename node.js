
var xtend = require('xtend');

function node(opts) {

  /* 
   Airtime calculations based on the LoRa airtime calculator:
   https://docs.google.com/spreadsheets/d/1voGAtQAjC1qBmaVuP1ApNKs1ekgUjavHuVQIXyYSvNc/edit
 */


  // all distances in meters
  this.opts = xtend({
    x: 0,
    y: 0,
    txRange: 3000, // how far can we send
    txRangeDelta: 0.2, // amount of randomized change in range
    rxMultiplier: 1, // multiplied by txRange of transmitting node when receiving
    rxMultiplierDelta: 0.2, // amount of randomized change in the rx multiplier
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
}


module.exports = node;
