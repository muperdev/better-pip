# Better PiP

Chrome extension for YouTube Picture-in-Picture: popup controller, keyboard shortcuts, auto-PiP on tab switch, chapters, sleep timer, and Shorts / Music / embeds.

## Install from source

Needs [Bun](https://bun.sh) and Chrome.

```bash
git clone https://github.com/muperdev/better-pip.git
cd better-pip
bun run build
```

1. Open `chrome://extensions`
2. Turn on **Developer mode**
3. **Load unpacked** → select the `dist` folder

Reload the extension after each build. Auto-PiP needs the video playing, Auto-PiP enabled in the popup, and Chrome’s **Automatic picture-in-picture** allowed for `youtube.com` (`chrome://settings/content/automaticPictureInPicture`).

### Shortcuts

| Action | Default |
| --- | --- |
| Toggle PiP | `Alt+P` |
| Seek back 10s | `Alt+J` |
| Seek forward 10s | `Alt+L` |

Change them under `chrome://extensions/shortcuts`.

## Chrome Web Store

This repo is the source of truth. A store listing is a separate upload of a `dist` zip:

1. Pay the one-time [Chrome Web Store developer](https://chrome.google.com/webstore/devconsole) fee ($5)
2. `bun run build`, zip the contents of `dist` (not the folder above it)
3. Create a listing: 1280×800 screenshots, short description, [privacy policy](PRIVACY.md) URL
4. Submit for review (often 1–3 days)

Store listing privacy URL once this repo is public:

`https://github.com/muperdev/better-pip/blob/main/PRIVACY.md`

## License

[MIT](LICENSE)
