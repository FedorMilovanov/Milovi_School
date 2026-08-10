# Canon homepage gateway — final owner-selected master

**Asset served by site:** `/public/images/canon-sucre/canon-gateway-hero.webp`  
**Owner source:** `mona-lisa-1_b_Create_a_single_cont.png`, supplied 2026-08-10  
**Source dimensions:** 1916×821 (≈21:9)  
**Production WebP:** 1916×821, quality-preserving q86 export, 77,970 bytes  
**Production SHA-256:** `a954f979338ba59328cf2d92ea4e848265ce17054b5b6b807ff45fe9a8afd5fc`

The repository connector cannot safely transport this binary in one write, so the production bytes are stored losslessly as seven Base64 source chunks under `assets/canon-gateway-hero/`. `scripts/materialize_canon_gateway_asset.mjs` reconstructs the normal WebP before dev/build and refuses to continue unless byte length and SHA-256 exactly match the accepted derivative. This is a transport representation only; the browser receives the ordinary WebP above.

## Art-direction contract

- This exact panoramic composition is the visual authority for the homepage Canon gateway. Do not regenerate or substitute another composition during integration.
- Use the image as one continuous plane; typography remains a separate site layer in the deliberately dark left-side negative space.
- Do not split the image into cards, thumbnails, panels or per-dessert crops.
- Desktop may crop only surplus top/bottom atmosphere to fit the low banner; the complete pastry lineup on the right must remain readable.
- Mobile must preserve the full panoramic composition with `contain` rather than cutting individual pastry forms. Natural black space around the panorama is preferable to destructive cropping.
- Do not replace this asset with a single-dessert master unless the owner explicitly changes the direction.

## Exact-SHA review before merge

Confirm in generated browser screenshots that desktop keeps the banner low and the full pastry line readable, the left copy does not collide with desserts, mobile shows the full panorama above copy, no five-panel treatment returns, and no horizontal overflow/layout shift appears.
