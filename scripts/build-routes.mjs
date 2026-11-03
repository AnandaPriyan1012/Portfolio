import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import ts from "typescript";

// Keep route membership in the same content file as the portfolio.
const source = await readFile("src/content.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { projects } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
);
const template = await readFile("dist/index.html", "utf8");
const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
for (const project of projects) {
  if (!/^[a-z0-9-]+$/.test(project.id))
    throw new Error("Invalid project route");
  const directory = join("dist", "projects", project.id);
  await mkdir(directory, { recursive: true });
  const page = template.replace(
    /<title>[\s\S]*?<\/title>/,
    `<title>${escapeHtml(project.title)} — Ananda Priyan</title>`,
  );
  await writeFile(join(directory, "index.html"), page);
}
console.log(`Created ${projects.length} static project entry points.`);

// Netlify serves this file with a genuine HTTP 404 for unknown paths.
const notFound = template.replace(
  /<title>[\s\S]*?<\/title>/,
  "<title>404 — Ananda Priyan</title>",
);
await writeFile(join("dist", "404.html"), notFound);
console.log("Created the branded 404 entry point.");
