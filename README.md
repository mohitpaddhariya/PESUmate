# PESUmate

A Chrome extension that adds bulk slide downloading and an AI-powered study assistant to [PESU Academy](https://www.pesuacademy.com/Academy/). Merge all PDFs into one file, zip all PPTX files, or download individually. Plus, chat directly with your course slides using the **PESUmate AI** powered by Google Gemini.

## Features

- **PESUmate tab** — appears alongside your course unit tabs
- **✨ PESUmate AI Chat** — Select slides and chat with an AI study assistant that understands your course material.
  - **Inline Focus Mode**: View loaded PDFs and PPTXs right inside the sidebar with a draggable split view.
  - **Fullscreen Study Mode**: Go fullscreen for an immersive side-by-side layout — slides on the left, resizable chat drawer on the right.
  - **Auto-scroll to Source**: During streaming, the AI automatically scrolls to the referenced slide page and shows clickable source pills.
  - **Add Slides Anytime**: Open a centered modal picker to add more slides to context mid-conversation.
  - **Chat History**: Your conversations are saved locally so you can resume them later.
- **PDF merge** — all PDF slides combined into a single file via pdf-lib
- **PPTX ZIP** — PowerPoint files bundled into one ZIP via JSZip
- **Individual downloads** — click any file to download it separately
- **Auto-detect** — panel updates automatically when you switch unit tabs

## Installation

### From source (developer mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/mohitpaddhariya/PESUmate.git
   ```
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the `PESUmate` folder
5. The extension icon appears in your toolbar

### Prerequisites

- Google Chrome (or any Chromium-based browser)
- A valid PESU Academy student account
- A free [Google Gemini API Key](https://aistudio.google.com/apikey) for the AI chat features.

## Usage

1. Log in to [PESU Academy](https://www.pesuacademy.com/Academy/)
2. **Retrieve API Key:** Click the PESUmate extension icon in your toolbar, and paste your Gemini API key.
3. Navigate to **My Courses → [Your Subject] → Course Units**
4. Click the **PESUmate** tab that appears at the end of the unit tabs.
5. Check the slides you want to study, then click **Chat with Selected** to open the AI sidebar.
6. Click the **Slides** button to open inline preview, or **⛶** to enter fullscreen study mode.
7. In fullscreen, use the right-side chat drawer — resize it, collapse it, or click **+ Slides** to add more slides.
8. Source pills appear during AI responses — click them to jump to the referenced page.
9. Access past sessions anytime using the **History** button.
10. Or click **Merge & Download** to download slides directly.

## Project structure

The extension has been modularized into the `src/` directory:

```
PESUmate/
├── manifest.json       # Chrome extension manifest (MV3)
├── src/
│   ├── pages/          # HTML pages (popup.html)
│   ├── scripts/        # JavaScript logic
│   │   ├── background.js # Service worker for API calls & storage
│   │   ├── bridge.js     # Manages isolated/main world communication
│   │   ├── chat.js       # AI chat UI and streaming logic
│   │   ├── content.js    # Downloads UI and logic
│   │   ├── popup.js      # Extension popup logic
│   │   └── prompt.js     # System prompt for the AI
│   └── styles/         # CSS styles
│       ├── chat.css      # Chat interface styling
│       └── panel.css     # Download panel styling
├── lib/                # External libraries (pdf-lib, jszip)
├── icons/              # Extension icons
├── LICENSE             # MIT License
└── docs/               # Documentation
```

## Tech stack

- **Manifest V3** — Chrome extension platform
- **Google Gemini API** — For the AI chat assistant.
- **pdf-lib** & **JSZip** — Client-side PDF merging & ZIP creation

## Privacy

PESUmate runs entirely in your browser and communicates only with `pesuacademy.com` and the secure `generativelanguage.googleapis.com` endpoint for AI inferences using the API key you provide. Chat history is saved entirely locally on your machine via Chrome Storage.

## License

This project is licensed under the [MIT License](LICENSE). See [CONTRIBUTING](docs/CONTRIBUTING.md) to get involved.

## Author

**Mohit Paddhariya**

## Acknowledgments

- [pdf-lib](https://pdf-lib.js.org/) by Andrew Dillon
- [JSZip](https://stuk.github.io/jszip/) by Stuart Knightley
- [@jvmr/pptx-to-html](https://github.com/meshesha/pptxjs) by jvmr (used for slide previews)
