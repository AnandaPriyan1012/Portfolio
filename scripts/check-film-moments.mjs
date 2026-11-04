import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";

const manifest = JSON.parse(await readFile("docs/film-moments-manifest.json", "utf8"));
const data = JSON.parse(await readFile("src/film-moments-data.json", "utf8"));
const approved = JSON.parse(await readFile("docs/approved-native-films.json", "utf8"));
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
let count = 0, total = 0;
for (const record of manifest.films) {
  const original = approved.records.find((film) => film.id === record.id).video;
  assert.equal(record.source.sha256, original.sha256);
  const sourceBytes = await readFile("public" + record.source.url);
  assert.equal(sha(sourceBytes), original.sha256, `Original ${record.id}`);
  const indexed = data.find((film) => film.id === record.id);
  assert.equal(indexed.source, original.url);
  assert.equal(indexed.duration, original.durationSeconds);
  assert.equal(record.frames.length, 3);
  for (const [index, frame] of record.frames.entries()) {
    assert.ok(frame.seconds > 0 && frame.seconds < original.durationSeconds);
    assert.equal(frame.sourcePTSTimeSeconds, frame.seconds);
    assert.equal(frame.sourcePTS * Number(frame.sourceTimeBase.split("/")[0]) / Number(frame.sourceTimeBase.split("/")[1]), frame.seconds);
    assert.deepEqual(indexed.frames[index], { seconds: frame.seconds, image: frame.proposedUrl, alt: frame.alt });
    const bytes = await readFile("public" + frame.proposedUrl);
    assert.equal(bytes.length, frame.bytes);
    assert.equal(sha(bytes), frame.sha256);
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
    assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
    count++; total += bytes.length;
  }
}
assert.equal(count, 9);
assert.equal((await readdir("public/media/film-moments")).length, count);
assert.equal(total, manifest.totalBytes);
console.log(JSON.stringify({ originals: "exact approved hashes", frames: count, bytes: total, timestamps: "source PTS verified", status: "passed" }));
