# MetaShield - Photo Privacy Prep Tool

MetaShield is a modern, client-side web application designed to help users protect their privacy by removing sensitive metadata (EXIF, GPS, Device Info) from their photos before sharing them online.

This app is built by [Teda.dev](https://teda.dev), the AI app builder for everyday problems. It runs entirely in the browser using WebAssembly and JavaScript technologies, ensuring that user photos are never uploaded to a server.

## Features

-   **Drag & Drop Interface**: Seamlessly load JPEG images.
-   **Instant Metadata Parsing**: View detailed EXIF data including Camera Model, Exposure settings, and Software versions.
-   **GPS Visualization**: If your photo contains location data, see it instantly on an interactive map.
-   **Privacy Risk Advisor**: An AI-powered feature (using WebLLM) that analyzes the metadata text to explain potential privacy risks associated with the image.
-   **One-Click Cleaning**: Strip all metadata and download a clean copy of your image instantly.
-   **Zero Server Upload**: All processing happens on your device.

## Tech Stack

-   **Frontend**: HTML5, Tailwind CSS, jQuery
-   **EXIF Processing**: Piexifjs
-   **Mapping**: Leaflet + OpenStreetMap
-   **AI Integration**: WebLLM (Qwen2.5-1.5B) via WebGPU

## Setup

1.  Open `index.html` in a modern web browser.
2.  Navigate to the App via the "Launch App" button.
3.  Drag and drop a JPEG file to begin.

No build step required. Just serve the files locally.