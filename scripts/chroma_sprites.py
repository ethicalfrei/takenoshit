#!/usr/bin/env python3
"""Chroma-key magenta JPEG sprites to cropped transparent PNGs."""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path("/workspace")
SRC = ROOT / "artifacts" / "imagine_images"
OUT = ROOT / "public" / "sprites"
FATAL = ROOT / "public" / "fatalities"
WALK = ROOT / "public" / "walks"
VID = ROOT / "artifacts" / "imagine_videos"
OUT.mkdir(parents=True, exist_ok=True)
FATAL.mkdir(parents=True, exist_ok=True)
WALK.mkdir(parents=True, exist_ok=True)

SPRITES: list[tuple[str, str, int]] = [
    ("ac34dab1-93d8-4258-ac13-ebbcf6d65087.jpg", "player-idle.png", 18),
    ("83156960-ad9b-40a7-b0bd-84a7f14b7470.jpg", "player-punch.png", 18),
    ("95b3a763-d2c4-4d53-892e-9fb1b5e530d2.jpg", "player-dodge.png", 18),
    ("2ae4a5c3-6467-481d-b6b8-481ba5755fa0.jpg", "player-duck.png", 18),
    ("4f641c9e-9df3-458b-af27-3f2d364969b9.jpg", "player-grab.png", 18),
    ("f723728b-6ea4-49ab-9f4a-a950fe8ad3c8.jpg", "roommate-idle.png", 18),
    ("52d5accc-3911-4e7e-9fe4-4c7dba22fb06.jpg", "roommate-attack.png", 18),
    ("fdeb3434-486b-4059-b9ac-4f0b427c113c.jpg", "roommate-hurt.png", 18),
    ("09cfdff0-3e21-4b8a-bf2a-15120dcc0dab.jpg", "leaf-idle.png", 18),
    ("690fc1f9-53b6-46ca-af85-eb1c144f6dd2.jpg", "leaf-attack.png", 18),
    ("0f563ae8-5bb9-4ef3-b188-d744fcd8dff9.jpg", "leaf-hurt.png", 18),
    ("83045d3e-f223-4411-8147-b61666c9e154.jpg", "baker-idle.png", 18),
    ("45397e5e-183b-40ee-ad29-8f04c6c6b010.jpg", "baker-attack.png", 18),
    ("d5e41597-82a3-4307-80fb-b737755cd113.jpg", "baker-stun.png", 18),
    ("0562251b-997e-4d8e-a409-ab5bca11cd93.jpg", "barista-idle.png", 18),
    ("12a7240e-0579-4ab2-8cd2-fb1d445181ca.jpg", "barista-attack.png", 18),
    ("69b00480-7366-4b0a-9819-f46cda656ddb.jpg", "barista-hurt.png", 18),
    ("2d0279c6-229e-498a-9182-35d0a1ed1866.jpg", "manager-idle.png", 18),
    ("1b1f8791-e265-4253-9fce-da9540b9cfd5.jpg", "manager-attack.png", 18),
    ("e16107e0-ec73-4215-bad5-6727758f119c.jpg", "gym-idle.png", 18),
    ("bfeb8c0c-0ea8-41ba-acd7-d669b1601e5e.jpg", "gym-attack.png", 18),
    ("bc816c04-f772-47c2-8574-bbcec0a698ec.jpg", "gym-hurt.png", 18),
    ("fa22b590-ab0e-4286-bac0-20274579eca9.jpg", "boss-idle.png", 18),
    ("fbbb6074-e8c8-421c-aaef-b2283fb1b00d.jpg", "boss-attack.png", 18),
    ("4670933d-f788-4963-8a80-80102a4c9d6a.jpg", "boss-stun.png", 18),
    ("b56a74b7-35f2-4bc0-ba8b-e9d2c72b61b6.jpg", "proj-pizza.png", 22),
    ("9eaca4a1-e7b8-45b3-a2f1-e30123239127.jpg", "proj-beer.png", 22),
    ("c8219836-6506-401c-adaf-3a9827586eab.jpg", "proj-paper.png", 22),
    ("43574f04-ca3f-4b32-a130-9f15dea43818.jpg", "proj-stapler.png", 22),
    ("f05f6907-04e8-4a07-b306-402037492600.jpg", "proj-leaf.png", 22),
    ("26ee37b5-af4d-40c5-80e1-b6f34b8901f4.jpg", "proj-cup.png", 22),
    ("01bd967b-767f-4e15-a922-9cd920766167.jpg", "proj-plate.png", 22),
    ("5195eb59-6a6f-4173-bdaf-8d350fa69722.jpg", "fx-impact.png", 22),
]

BGS = [
    ("814958e9-793e-4665-aff2-4be845cc3351.jpg", "bg-apartment.jpg"),
    ("f63cd2cf-4a54-4e5d-abd9-fc16ecf2b778.jpg", "bg-leaf.jpg"),
    ("90f3f514-d49e-4a51-ab75-80dfb70e78e4.jpg", "bg-bakery.jpg"),
    ("909971c0-af3b-4eeb-a8fc-1965b99ccb91.jpg", "bg-coffee.jpg"),
    ("ff855459-267a-4e6f-8d0f-3d3775c9f5db.jpg", "bg-office.jpg"),
    ("0427e9bd-9fc6-455f-b4ae-0f360cb2ee2a.jpg", "bg-gym.jpg"),
    ("9c45d881-fa2f-40b6-aa04-92a19519dee2.jpg", "bg-corner.jpg"),
]

WALKS = [
    ("e2a29591-f385-4045-9880-63304abe4be3.jpg", "walk-roommate.jpg"),
    ("270084f5-5534-483b-ab2f-f2cab3b8aa48.jpg", "walk-leaf.jpg"),
    ("e7a9dcae-ca2c-4445-9ba0-ef9a8c4f4d67.jpg", "walk-baker.jpg"),
    ("e7a9dcae-ca2c-4445-9ba0-ef9a8c4f4d67.jpg", "walk-barista.jpg"),
    ("bf4b43a5-37f8-45a8-a7e2-9b0c4a477138.jpg", "walk-manager.jpg"),
    ("32e60f86-7fb5-4d72-b3b3-7860473d1e70.jpg", "walk-gym.jpg"),
    ("61137075-6356-42dc-8e86-b047d8dce7d6.jpg", "walk-boss.jpg"),
]

FSTILLS = [
    ("a796aa04-30e4-485c-8be2-f6faa639dccf.jpg", "roommate.jpg"),
    ("b7fa981d-c588-4b66-bdf9-1e48eab1b001.jpg", "leaf.jpg"),
    ("27045ff6-ea37-4d85-bfed-1c0a98fde5cd.jpg", "baker.jpg"),
    ("c02a245f-e775-4ab4-a40e-78fff5338131.jpg", "barista.jpg"),
    ("249124aa-b769-43be-8605-24c333c63a86.jpg", "manager.jpg"),
    ("897630ba-8cba-4759-9160-0245f242c84d.jpg", "gym.jpg"),
    ("9df75e36-7faa-4617-9603-d5c21313e85d.jpg", "boss.jpg"),
]

FVIDS = [
    ("ac25e8e1-20ae-46ec-a856-f40e68302672.mp4", "roommate.mp4"),
    ("5c9a7e4d-3766-4a6c-935f-a4275bb3baad.mp4", "leaf.mp4"),
    ("6d452b13-b991-4308-a599-2f3124acefd8.mp4", "baker.mp4"),
    ("089498bf-c8c2-44d9-b876-31df88ea6c2f.mp4", "barista.mp4"),
    ("285ebf6b-f963-4b4a-b2fd-edb4941ad6cc.mp4", "manager.mp4"),
    ("a578ca67-4a3c-4f80-a2dd-2f4285a64aeb.mp4", "gym.mp4"),
    ("c63c9dcd-33b4-4cbc-9ec7-899746aefc52.mp4", "boss.mp4"),
]


def magenta_mask(arr: np.ndarray) -> np.ndarray:
    r = arr[:, :, 0].astype(np.int16)
    g = arr[:, :, 1].astype(np.int16)
    b = arr[:, :, 2].astype(np.int16)
    mag = (r + b) / 2 - g
    return (mag > 70) & (g < 110) & (r > 130) & (b > 90) & (b > g + 25)


def flood_from_corners(key: np.ndarray) -> np.ndarray:
    h, w = key.shape
    vis = np.zeros_like(key, dtype=bool)
    stack = [
        (0, 0),
        (0, w - 1),
        (h - 1, 0),
        (h - 1, w - 1),
        (0, w // 2),
        (h - 1, w // 2),
        (h // 2, 0),
        (h // 2, w - 1),
    ]
    while stack:
        y, x = stack.pop()
        if y < 0 or y >= h or x < 0 or x >= w or vis[y, x] or not key[y, x]:
            continue
        vis[y, x] = True
        stack.extend(((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)))
    return vis


def dilate(mask: np.ndarray, n: int = 2) -> np.ndarray:
    out = mask
    for _ in range(n):
        nxt = out.copy()
        nxt[1:] |= out[:-1]
        nxt[:-1] |= out[1:]
        nxt[:, 1:] |= out[:, :-1]
        nxt[:, :-1] |= out[:, 1:]
        out = nxt
    return out


def key_out(im: Image.Image, pad: int) -> Image.Image:
    arr = np.array(im.convert("RGBA"))
    key = magenta_mask(arr)
    bg = dilate(flood_from_corners(key), 2)
    arr[:, :, 3] = np.where(bg, 0, arr[:, :, 3])
    r = arr[:, :, 0].astype(np.int16)
    g = arr[:, :, 1].astype(np.int16)
    b = arr[:, :, 2].astype(np.int16)
    edge = (arr[:, :, 3] > 0) & (((r + b) / 2 - g) > 40) & (g < 140)
    arr[:, :, 2] = np.where(edge, np.minimum(b, g + 20), b).astype(np.uint8)
    arr[:, :, 0] = np.where(edge, np.minimum(r, g + 50), r).astype(np.uint8)
    alpha = arr[:, :, 3]
    ys, xs = np.where(alpha > 10)
    if len(xs) == 0:
        return Image.fromarray(arr)
    x0, x1 = max(0, int(xs.min()) - pad), min(arr.shape[1], int(xs.max()) + pad + 1)
    y0, y1 = max(0, int(ys.min()) - pad), min(arr.shape[0], int(ys.max()) + pad + 1)
    return Image.fromarray(arr[y0:y1, x0:x1])


def process_sprite(src: Path, dst: Path, pad: int) -> None:
    cropped = key_out(Image.open(src), pad)
    cropped.save(dst)
    print(f"{dst.name:22s} {cropped.size[0]}x{cropped.size[1]}")


def split_walk(src: Path) -> None:
    im = Image.open(src).convert("RGBA")
    w, h = im.size
    cw, ch = w // 2, h // 2
    cells = [(0, 0), (1, 0), (0, 1), (1, 1)]
    for i, (cx, cy) in enumerate(cells):
        cell = im.crop((cx * cw, cy * ch, (cx + 1) * cw, (cy + 1) * ch))
        out = key_out(cell, 12)
        dst = OUT / f"player-walk-{i}.png"
        out.save(dst)
        print(f"{dst.name:22s} {out.size[0]}x{out.size[1]}")


def main() -> None:
    for fname, outname, pad in SPRITES:
        process_sprite(SRC / fname, OUT / outname, pad)
    split_walk(SRC / "ff0b8597-3aa9-47bb-b7f0-ffbe0d016a6e.jpg")
    for fname, outname in BGS:
        im = Image.open(SRC / fname).convert("RGB")
        im.save(OUT / outname, quality=88, optimize=True)
        print(f"{outname:22s} {im.size[0]}x{im.size[1]}")
    for fname, outname in WALKS:
        im = Image.open(SRC / fname).convert("RGB")
        im.save(WALK / outname, quality=88, optimize=True)
        print(f"walks/{outname:16s} {im.size[0]}x{im.size[1]}")
    import shutil

    for fname, outname in FSTILLS:
        shutil.copy(SRC / fname, FATAL / outname)
        print("still", outname)
    for fname, outname in FVIDS:
        src = VID / fname
        if src.exists():
            shutil.copy(src, FATAL / outname)
            print("vid", outname, src.stat().st_size)
        else:
            print("MISSING vid", fname)


if __name__ == "__main__":
    main()
