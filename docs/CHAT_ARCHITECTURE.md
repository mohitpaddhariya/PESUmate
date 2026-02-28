# PESUmate AI Chat Architecture

This document details the internal architecture and data flow of the PESUmate AI Chat feature (`v2.0.0`), mapping out the interaction between the injected UI, file extractors, Chrome APIs, and the Gemini AI server.

## Execution Environments

Because PESUmate injects highly interactive UI elements directly into the `pesuacademy.com` webpage, the extension spans multiple execution contexts to balance UX and security:

1. **MAIN World (`chat.js`, `content.js`)**: Runs directly in the context of the webpage. This allows seamless manipulation of the DOM, capturing user clicks, and rendering the chat overlay and native slide previews.
2. **ISOLATED World (`bridge.js`)**: A Chrome Extension content script running in a protected scope. It cannot be tampered with by the host webpage but has access to Chrome Extension APIs (like `chrome.runtime.sendMessage`).
3. **Service Worker (`background.js`)**: The background process that handles secure requests such as reading API keys from `chrome.storage.sync` and managing local chat history.

## Full Workflow Diagram

Below is the sequence diagram illustrating the lifecycle of a chat session, from slide selection to the streaming AI response.

```mermaid
sequenceDiagram
    autonumber
    
    actor User
    participant Main as MAIN (chat.js)
    participant Extract as Extractor (pdf.js / JSZip)
    participant Bridge as ISOLATED (bridge.js)
    participant SW as Worker (background.js)
    participant Gemini as Google Gemini API

    User->>Main: Selects slides & clicks "Chat with Selected"
    Main->>Main: openChat(selectedItems)
    
    Note over Main,Extract: 1. Context Extraction Runtime
    activate Main
    Main->>Extract: Pass ArrayBuffers for each selected file
    activate Extract
    Extract-->>Main: Return extracted text chunks
    deactivate Extract
    Main->>Main: Compile text into `slideContext` global variable
    Main-->>User: Renders Chat UI & Preview Panel
    
    Note over User,Main: 2. Chat Interaction
    User->>Main: Types prompt & clicks Send
    Main->>Main: Append User message to UI
    
    Note over Main,SW: 3. Secure Credential Bridge
    Main->>Bridge: window.postMessage({ type: 'GET_API_KEY' })
    activate Bridge
    Bridge->>SW: chrome.runtime.sendMessage(...)
    activate SW
    SW->>SW: Read chrome.storage.sync
    SW-->>Bridge: Return API Key
    deactivate SW
    Bridge-->>Main: postMessage (API Key)
    deactivate Bridge
    
    Note over Main,Gemini: 4. AI Streaming (Server-Sent Events)
    Main->>Gemini: fetch(.../streamGenerateContent?alt=sse)
    activate Gemini
    
    loop Real-time SSE Chunks
        Gemini-->>Main: data: {"candidates": [{...}]}
        Main->>Main: Parse JSON, append text, render Markdown
        Main-->>User: Live typing updates in UI
    end
    deactivate Gemini
    
    Note over Main,SW: 5. Post-Stream Actions
    Main->>Main: autoHighlightReferencedSlide(fullText)
    Main->>Bridge: window.postMessage({ type: 'SAVE_CHAT_HISTORY' })
    activate Bridge
    Bridge->>SW: Save to chrome.storage.local
    deactivate Bridge
    deactivate Main

```

## Key Mechanisms

### Context Handling (`slideContext`)
When the chat is launched, `chat.js` loops through the selected items and immediately processes their raw file buffers into plain text using `pdf.js` for PDFs and `JSZip` for PPTX files (unzipping XML slides). 

This text is accumulated into a single global string variable, `slideContext`. Every time a request is made to the Gemini API, this `slideContext` is heavily prepended to the *very first* user message to ground the AI's understanding, alongside the `PESUMATE_SYSTEM_PROMPT`.

### The Security Bridge (`bridge.js`)
Scripts executing in the `MAIN` browser world do not have access to sensitive `chrome.*` APIs. To securely fetch the user's Gemini API key (stored via the extension's popup in `chrome.storage.sync`), `chat.js` broadcasts an event to the `window` object. `bridge.js` listens to this event, securely proxies the request to the extension's `background.js`, and posts the secret key back down. 

### Server-Sent Events (SSE) Processing
To achieve incredibly fast AI response times, the extension uses `fetch` with the `?alt=sse` query parameter directly from the `MAIN` World. 
A `TextDecoder` stream reader captures chunks of raw bytes as they arrive from Google's servers. The script searches for `data: ` prefixes, parses the JSON payload, and continuously rebuilds the Markdown UI bubble in real time.

### Chat History Management
Conversations are saved to `chrome.storage.local` indexed by the specific course unit (e.g., `chat_Unit 1`). This allows players to hop between different course units and resume contextual conversations exactly where they left off. The saving triggers autonomously after every completed stream generation.
