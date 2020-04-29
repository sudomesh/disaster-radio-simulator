function parsePacket(buffer) {
  return {
    ttl: buffer[0],
    totalLength: buffer[1],
    source: buffer.slice(2,8),
    destination: buffer.slice(8,14),
    sequence: buffer[14],
    type: buffer[15],
    typeReadable: packetTypes[String.fromCharCode(buffer[15])],
    nextHop: buffer.slice(16, 22),
    nextHopReadable: buffer.slice(16, 22).map(parseHexPair).join(''),
    data: buffer.slice(16)
  };
}

function parseHexPair(twoHalves) {
  let firstHalf = twoHalves >> 4;
  let secondHalf = twoHalves & parseInt(1111, 2);
  return firstHalf.toString(16) + secondHalf.toString(16);
}

const packetTypes = {
  'h': 'hello',
  'r': 'routing',
  'c': 'chat'
};

module.exports = {
  parsePacket,
  parseHexPair
};
