function parsePacket(buffer) {
  return {
    ttl: buffer[0],
    totalLength: buffer[1],
    sender: buffer.slice(2,6),
    receiver: buffer.slice(6,10),
    sequence: buffer[10],
    source: buffer.slice(11,15),
    hopCount: buffer[15],
    metric: buffer[16],
    destination: buffer.slice(17,21),
    type: buffer[21],
    typeReadable: packetTypes[String.fromCharCode(buffer[21])],
    receiverReadable: buffer.slice(6, 10).map(parseHexPair).join(''),
    destinationReadable: buffer.slice(17, 21).map(parseHexPair).join(''),
    data: buffer.slice(22)
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
