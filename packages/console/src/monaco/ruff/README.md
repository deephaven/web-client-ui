This file was generated from the ruff source. https://github.com/astral-sh/ruff

Clone their repo and follow their contributing setup https://docs.astral.sh/ruff/contributing/#prerequisites

Then in the ruff repo, run `wasm-pack build ./crates/ruff_wasm --target web --out-dir ../../build/ruff_wasm` to build the wasm module. Then copy the generated files from `build/ruff_wasm` here except for the `package.json` and `.gitignore` files.
