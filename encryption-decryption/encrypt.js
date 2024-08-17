const { Transform } = require("node:stream");
const fs = require("node:fs/promises");

class Encrypt extends Transform {
  constructor(fileSize) {
    super();
    this.fileSize = fileSize;
    this.chunkSize = 0;
  }
  _transform(chunk, encoding, callback) {
    this.chunkSize += chunk.length;
    for (let i = 0; i < chunk.length; ++i) {
      if (chunk[i] !== 255) {
        chunk[i] += 1;
      }
    }
    const perc = +((+this.chunkSize / this.fileSize) * 100).toFixed(0, 10);
    console.log("Encrypting... %d%", perc);
    if (perc === 100) console.log("Done.");
    this.push(chunk);
    callback();
  }
}

(async () => {
  const readFileHandle = await fs.open("read.txt", "r");
  const writeFileHandle = await fs.open("write.txt", "w");

  const { size } = await readFileHandle.stat();

  const encrypt = new Encrypt(size);

  const readStream = readFileHandle.createReadStream();
  const writeStream = writeFileHandle.createWriteStream();

  readStream.pipe(encrypt).pipe(writeStream);
})();
