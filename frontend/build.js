import esbuild from 'esbuild-wasm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function build() {
  console.log("Bundling React application into dist/bundle.js...");

  if (!fs.existsSync(path.join(__dirname, 'dist'))) {
    fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
  }

  const result = await esbuild.build({
    entryPoints: [path.join(__dirname, 'src', 'main.jsx')],
    bundle: true,
    outfile: path.join(__dirname, 'dist', 'bundle.js'),
    loader: {
      '.js': 'jsx',
      '.jsx': 'jsx',
      '.css': 'css',
      '.svg': 'dataurl',
      '.png': 'dataurl'
    },
    define: {
      'process.env.NODE_ENV': '"development"',
      'global': 'window'
    },
    sourcemap: true,
    minify: false
  });

  console.log("✅ Bundle completed successfully! Size:", fs.statSync(path.join(__dirname, 'dist', 'bundle.js')).size, "bytes");
  esbuild.stop();
}

build().catch(err => {
  console.error("Build failed:", err);
  process.exit(1);
});
