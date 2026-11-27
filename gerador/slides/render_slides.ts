// Gera os slides do carrossel do Garimpo do Vinho em PNG, a partir de um JSON (lista de slides).
// uso: deno run -A gerador/slides/render_slides.ts <slides.json> <pasta_saida>
import { svgFor, ensureWasm, toPng } from "./render.ts";
const here = new URL(".", import.meta.url).pathname;
const [inp, out] = Deno.args;
const slides = JSON.parse(await Deno.readTextFile(inp));
await ensureWasm(async () => await Deno.readFile(here + "wasm/index_bg.wasm"));
const fonts: Uint8Array[] = [];
for (const f of Deno.readDirSync(here + "fonts")) fonts.push(await Deno.readFile(here + "fonts/" + f.name));
await Deno.mkdir(out, { recursive: true });
for (let i = 0; i < slides.length; i++) {
  const png = toPng(svgFor(slides[i], i + 1, slides.length), fonts);
  await Deno.writeFile(`${out}/${i + 1}.png`, png);
  console.log("slide", i + 1, png.length);
}
