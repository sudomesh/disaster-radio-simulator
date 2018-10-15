function parsePacket(buffer) {
  return {
    header:buffer.slice(0,16),
    ttl: buffer[0],
    totalLength: buffer[1],
    source: buffer.slice(2,8),
    destination: buffer.slice(8,14),
    sequence: buffer[14],
    type: buffer[15],
    data: buffer.slice(16)
  };
}

module.exports = {
  parsePacket
};
