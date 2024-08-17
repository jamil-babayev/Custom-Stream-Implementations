const { Writable } = require("node:stream");
const fs = require("node:fs");

class FileWriteStream extends Writable {
  constructor({ highWaterMark, fileName }) {
    super({ highWaterMark });
    this.fileName = fileName;

    this.fd = null;
    this.chunks = [];
    this.chunkSize = 0;

    this.writesCount = 0;
  }

  _construct(callback) {
    fs.open(this.fileName, "w", (err, fd) => {
      if (err) {
        // callback with an error argument indicates the error
        return callback(err);
      }
      this.fd = fd;
      // callback without an argument indicates we are good to go
      callback();
    });
  }

  _write(chunk, encoding, callback) {
    // do our write operation
    this.chunks.push(chunk);
    this.chunkSize += chunk.length;
    // call the callback function, emits "drain" event
    if (this.chunkSize >= this.highWaterMark) {
      fs.write(this.fd, Buffer.concat(this.chunks), (err) => {
        if (err) {
          return callback(err);
        }
        this.chunks = [];
        this.chunkSize = 0;
        ++this.writesCount;
        callback();
      });
    } else {
      callback();
    }
  }

  _final(callback) {
    console.log("final invoked");
    if (this.chunkSize > 0)
      fs.write(this.fd, Buffer.concat(this.chunks), (err) => {
        if (err) return callback(err);
        this.chunks = [];
        this.chunkSize = 0;
        ++this.writesCount;
        callback();
      });
    else callback();
  }

  // is invoked after execution done with _final method
  _destroy(error, callback) {
    console.log("destroy invoked");
    if (this.fd)
      fs.close(this.fd, (err) => {
        if (err) return callback(err || error);
      });
    else callback(error);
  }
}

const stream = new FileWriteStream({
  highWaterMark: 16384,
  fileName: "dest.txt",
});

stream.write("Hi! ");
stream.end("this is the last write");

stream.on("finish", () => {
  console.log('"finish" event because end() method invoked');
});

stream.on("drain", () => {
  console.log("Buffer is emptied, we are safe to write.");
});

stream.on("close", () => {
	console.log("Stream is closed");
})