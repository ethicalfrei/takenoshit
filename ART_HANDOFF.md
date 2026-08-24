# ART_HANDOFF — videolock1

## Identity source of truth
- ONLY public/refs/*.jpg (stills cut from CURRENT public/fatalities/*.mp4 on main).
- Do NOT redo fatality videos (locked).
- Image-to-image from those refs only. Same people. No new faces. No prose character sheets.

## Hero lock (player)
All of: hero-01.jpg … hero-06.jpg
- Middle-aged balding man, round glasses, thinning brown hair, white shirt + red necktie, khaki pants, brown shoes.
- Walk: 3/4 view, angry slouched baggy stride, 8 frames player-walk-0.png … player-walk-7.png
- Fight: camera BEHIND him (rear view), punches INTO the boss (forward away from camera), never side-swipes.
  - player-idle.png
  - player-punch.png (jab)
  - player-punch2.png (cross)
  - player-punch3.png (dramatic uppercut)
  - player-slap.png (open hand, Valerie/Patricia)
  - player-duck.png player-dodge.png player-grab.png
- Same man as hero-01.jpg in every frame.

## Bosses (overwrite sprites)
- roommate (Drew): drew-01.jpg drew-02.jpg → roommate-idle/attack/hurt.png
- leaf (Willow): willow-01.jpg → leaf-idle/attack/hurt.png
- baker (Pip): pip-01.jpg pip-02.jpg → baker-idle/attack/baker-stun.png
- barista (Chad): chad-01.jpg chad-02.jpg → barista-*.png
- manager (Valerie): valerie-01.jpg valerie-02.jpg → manager-*.png
- hr (Patricia): patricia-01.jpg patricia-02.jpg → hr-*.png
- gym (Tank): tank-01.jpg tank-02.jpg → gym-*.png
- boss (Richard Synergy): richard-01.jpg richard-02.jpg → boss-idle/attack/stun.png
- cops: cops-01.jpg cops-02.jpg → cops-*.png

## Cover art (dark, no magenta/pink)
- public/og.jpg 1200×630 from hero stills + title TAKE NO SHIT
- public/x-banner.jpg 1200×264
- public/cover.jpg 1080×1920

## Pipeline notes
- Key magenta #FF00FF AND hot-pink (~RGB 223,10,116). Flood from corners + dilate.
- All player sprites: canvas 1800×1680, person height 1480, feet 28px from bottom, centered. Huge margins (hands never clip).
- QA: walk 0–7 one man no missing hands; fight one man rear view punches at boss.
- assets.ts const V = "v=videolock1"
- Cache-bust iframe in nextjs-with-supabase-kevin-1: ?v=videolock1
- Do not touch public/fatalities/*.mp4, music, or story.

## Generated this pass
- Covers generated via reference_to_image from all hero-*.jpg (dark, title TAKE NO SHIT, identity locked):
  - og 1200x630, x-banner 1200x264, cover 1080x1920 (local assets ready)
- Player walk 0-7 and fight idle/punch/punch2/punch3/slap/duck/dodge/grab generated from hero refs (magenta/hot-pink bg, rear for fight, punches into boss). Key+place on 1800x1680 pending sandbox capacity recovery.
- assets.ts V bumped to videolock1
- iframe cache-bust committed in nextjs-with-supabase-kevin-1
- ART_HANDOFF.md written

## Status
Sandbox HADES_NO_CAPACITY blocked final keying/PNG export/push of binary sprites and covers. Text changes committed. Resume processing when capacity available; Imagine assets exist for all frames.

## Commit SHA of this handoff
(see reply)
