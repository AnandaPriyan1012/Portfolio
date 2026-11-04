import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const configuration = JSON.parse(readFileSync("vercel.json", "utf8"));
const [assetRule, filesystem, notFound] = configuration.routes;
const immutable = "public, max-age=31536000, immutable";
const revalidate = "public, max-age=0, must-revalidate";
const matchesAsset = (path) => new RegExp(assetRule.src, "i").test(path);

test("hashed asset headers continue to the unchanged filesystem and genuine 404", () => {
  assert.equal(configuration.routes.length, 3);
  assert.equal(assetRule.headers["Cache-Control"], immutable);
  assert.equal(assetRule.continue, true);
  assert.equal(assetRule.dest, undefined);
  assert.equal(assetRule.status, undefined);
  assert.deepEqual(filesystem, { handle: "filesystem" });
  assert.equal(notFound.src, "/.*");
  assert.equal(notFound.dest, "/404.html");
  assert.equal(notFound.status, 404);
  // A missing hash-shaped URL first matches the asset rule, then reaches 404.
  // The final response must overwrite that candidate's immutable directive.
  assert.equal(matchesAsset("/assets/not-present-AbCd1234.js"), true);
  assert.equal(notFound.headers["Cache-Control"], revalidate);
  assert.equal(configuration.headers, undefined);
  assert.equal(configuration.rewrites, undefined);
});

test("only this build's reserved hashed JS, CSS and font namespace is eligible", () => {
  assert.equal(existsSync("public/assets"), false,
    "Reserve /assets for Vite output; mutable public files must not resemble build hashes");
  const assets = readdirSync("dist/assets");
  assert.ok(assets.some((name) => name.endsWith(".js")));
  assert.ok(assets.some((name) => name.endsWith(".css")));
  assert.ok(assets.some((name) => name.endsWith(".woff2")));
  for (const name of assets) {
    assert.equal(matchesAsset(`/assets/${name}`), true, `Current build asset: ${name}`);
  }
  for (const path of [
    "/", "/index.html", "/work", "/work/index.html", "/studio", "/about",
    "/projects/cirs", "/404.html", "/missing-page", "/projects/missing",
    "/docs/hero-ui-comparison.html", "/media/teded-auditions-web.mp4",
    "/media/ap-signature.png", "/fonts/pixelify-sans/PixelifySans-variable.ttf",
    "/fonts/pixelify-sans/OFL.txt", "/assets/app.js", "/assets/app.css",
    "/assets/index-AbCd1234.html", "/assets/index-AbCd1234.js.map",
    "/media/index-AbCd1234.js", "/assets/nested/index-AbCd1234.js",
    "/assets/../index-AbCd1234.js",
  ]) assert.equal(matchesAsset(path), false, `Must retain existing policy: ${path}`);
});

test("all physical page entries and the private-comparison exclusion survive the build", () => {
  for (const path of [
    "index.html", "work/index.html", "studio/index.html", "about/index.html",
    "projects/cirs/index.html", "projects/community/index.html",
    "projects/accuflow/index.html", "projects/creative/index.html",
    "projects/airkart/index.html", "404.html",
  ]) {
    const html = readFileSync(resolve("dist", path), "utf8");
    assert.match(html, /<div id="root"><\/div>/);
    assert.match(html, /src="\/assets\/[^"/]+\.js"/);
  }
  assert.equal(existsSync("dist/docs/hero-ui-comparison.html"), false);
  assert.match(readFileSync(".vercelignore", "utf8"), /^docs\/$/m);
});
