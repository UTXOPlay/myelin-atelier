# Source migration

Game sources and browser assets imported from [UTXOPlay commit b1423e6](https://github.com/UTXOPlay/UTXOPlay/tree/b1423e6). Native source files, lockfiles, and relative `include_bytes!` inputs are preserved byte-for-byte to retain Myelin application profiles. The original history remains in the source repository. Existing repository history and upstream attribution remain here.

Games: rune-foundry, lumen-weave, orbit-courier, mosslight.

## Orbit Courier Expedition (2026-10-27)

The new orbital campaign, client and native rules are original project code. Its ship atlas, planet and environment were generated with the built-in OpenAI image-generation tool for this release. Full prompts and original PNGs are retained in `assets/orbit-source/`; compressed WebP game assets are in `games/orbit-courier/web/art/`. Transparency is retained for spacecraft and planet assets. These are integrated game assets, not UI mockups. Classic Orbit Courier and its original signed-run profile remain separate and unchanged.
