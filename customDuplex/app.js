const { Duplex } = require("node:stream");
const fs = require("node:fs");

class DuplexStream extends Duplex {
  constructor({
    readableHighWaterMark,
    writableHighWaterMark,
    readFileName,
    writeFileName,
  }) {
    super({ writableHighWaterMark, readableHighWaterMark });
    this.readFileName = readFileName;
    this.writeFileName = writeFileName;

    this.readFd = null;
    this.writeFd = null;

    this.chunks = [];
    this.chunkSize = 0;
  }

  _construct(callback) {
    fs.open(this.readFileName, "r", (err, readFd) => {
      if (err) return callback(err);
      this.readFd = readFd;
      fs.open(this.writeFileName, "w", (err, writeFd) => {
        if (err) return callback(err);
        this.writeFd = writeFd;
        callback();
      });
    });
  }

  _write(chunk, encoding, callback) {
    this.chunks.push(chunk);
    this.chunkSize += chunk.length;

    if (this.chunkSize >= this.writableHighWaterMark) {
      fs.write(this.writeFd, Buffer.concat(this.chunks), (err) => {
        if (err) return callback(err);
        this.chunks = [];
        this.chunkSize = 0;
        callback();
      });
    } else {
      callback();
    }
  }

  _final(callback) {
    if (this.chunkSize > 0) {
      fs.write(this.writeFd, Buffer.concat(this.chunks), (err) => {
        if (err) return callback(err);
        this.chunks = [];
        this.chunkSize = 0;
        callback();
      });
    } else {
      callback();
    }
  }

  _read(size) {
    const buff = Buffer.alloc(size);
    fs.read(this.readFd, buff, 0, size, null, (err, bytesRead) => {
      if (err) return this.destroy(err);
      this.push(bytesRead > 0 ? buff.subarray(0, bytesRead) : null);
    });
  }

  _destroy(error, callback) {
    callback(error);
  }
}

const duplex = new DuplexStream({
  readFileName: "read.txt",
  writeFileName: "write.txt",
});

duplex.on("data", (chunk) => {
  duplex.end(chunk);
});

// duplex.on("drain", () => {
//   duplex.resume();
// });
