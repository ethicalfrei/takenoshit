# ART_HANDOFF — videolock1

## Identity source of truth
- ONLY public/refs/*.jpg (stills cut from CURRENT public/fatalities/*.mp4 on main).
- Do NOT redo fatality videos (locked).
- Image-to-image from those refs only. Same people. No new faces. No prose character sheets.

## Hero lock (player)
All of: hero-01.jpg … hero-06.jpg
- Middle-aged balding man, round glasses, thinning brown hair, white shirt + red necktie, khaki pants, brown shoes.
- Walk: 3/4–side view, angry slouched baggy stride, 8 frames player-walk-0.png … player-walk-7.png
  (Locked design. TRUE alternating left/right foot forward (up-stage/left leg leads on L frames via facing-left + flop). Some frames have funny angry muttering gestures — fist shake / open-hand point. Canvas 1800×1680, person h≈1480, feet≈28px bottom.)
- Fight: camera BEHIND him (rear view), punches INTO the boss UPWARD/high (like Little Mac jabs to taller opponents), never side-swipes. More dramatic poses.
  - player-idle.png
  - player-punch.png (dramatic high jab)
  - player-punch2.png (dramatic high cross)
  - player-punch3.png (big dramatic uppercut)
  - player-slap.png (really obvious dramatic open-hand slap for female opponents)
  - player-duck.png (deep dramatic crouch) player-dodge.png (exaggerated lean) player-grab.png
- Same man as hero stills in every frame.

## Bosses (overwrite sprites)
- roommate, leaf, baker, barista, manager, hr, gym, boss, cops
- idle + attack + hurt/stun as needed
- Same canvas keying as player (magenta, 1800×1680, height ~1480, feet 28px).

## Covers
- og.jpg 1200x630
- desktop-cover.jpg 1792x1008 (locked wide banner)
- cover.jpg 1080x1920
- x-banner.jpg 1200x264

## Generated this pass (complete)
- Covers: og.jpg 1200x630, x-banner.jpg 1200x264, cover.jpg 1080x1920 (dark, title TAKE NO SHIT, hero locked from refs).
- Desktop cover: desktop-cover.jpg 1792x1008 locked wide banner/wallpaper (hero exact from refs, gritty comic, fists up, title TAKE NO SHIT, dark no magenta/pink). og.jpg refreshed from it.
- Player: all walk-0..7 (TRUE alternating L/R feet for real walk cycle + angry muttering gestures on some frames) + idle + dramatic punch/punch2/punch3 (UP high like Mac) + dramatic slap (open hand) + dramatic duck/dodge/grab — magenta keyed, 1800×1680 canvas, height 1480, feet 28px bottom, rear fight view.
- Bosses: all roommate/leaf/baker/barista/manager/hr/gym/boss/cops idle+attack+hurt/stun — keyed same canvas.
- assets.ts V already "v=videolock1"
- ART_HANDOFF.md updated
- Ready for commit + push

## Status
Binaries ready in sandbox and delivered via Drive zip (see chat). Push pending or use the zip.