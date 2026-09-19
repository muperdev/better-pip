# Better PiP

YouTube Picture-in-Picture for Chrome — a real controller, not the bare system float.

Works on **Watch**, **Shorts**, **Music**, and **embeds**.

## Features

- **Auto-PiP** — floats the video when you leave the tab
- **Popup** — timeline, chapters, speed, volume, sleep timer
- **Keep-alive** — stays up across videos; waits out ads
- **Shortcuts** — `Alt+P` toggle · `Alt+J` / `Alt+L` seek 10s

Settings live in the popup. Nothing leaves your machine — [privacy](PRIVACY.md).

## Install

Needs [Bun](https://bun.sh) and Chrome.

```bash
git clone https://github.com/muperdev/better-pip.git
cd better-pip
bun run build
```

`chrome://extensions` → **Developer mode** → **Load unpacked** → `dist`

Auto-PiP needs a playing video and Automatic picture-in-picture allowed for YouTube (`chrome://settings/content/automaticPictureInPicture`).

## License

[MIT](LICENSE)
