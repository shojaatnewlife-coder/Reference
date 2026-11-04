// Copies the website files into one folder and builds the built-in product list.
// Usage: node tools/build-dist.mjs <output-folder>
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.resolve(process.argv[2] || "dist");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const f of ["index.html", "settings.js", "products.json"]) fs.copyFileSync(path.join(root, f), path.join(out, f));
for (const d of ["img", "fonts"]) fs.cpSync(path.join(root, d), path.join(out, d), { recursive: true });

// Check products.json so a typo is caught here, not by customers.
let data;
try { data = JSON.parse(fs.readFileSync(path.join(root, "products.json"), "utf8")); }
catch (e) { console.error("products.json has a mistake (a comma or quote): " + e.message); process.exit(1); }
if (!Array.isArray(data.products) || !data.products.length) { console.error("products.json: no products"); process.exit(1); }
for (const p of data.products) {
  for (const k of ["id", "name", "image"]) if (!p[k]) { console.error(`products.json: "${k}" is empty in ${JSON.stringify(p.name || p.id)}`); process.exit(1); }
  if (!fs.existsSync(path.join(root, p.image))) { console.error(`Image not found: ${p.image} (for ${p.name})`); process.exit(1); }
}
fs.writeFileSync(path.join(out, "products-builtin.js"), "window.REF_BUILTIN = " + JSON.stringify(data, null, 1) + ";\n");
fs.writeFileSync(path.join(out, ".nojekyll"), "");
console.log(`OK: ${data.products.length} products -> ${out}`);
