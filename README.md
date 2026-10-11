# Sonorous

**A simple conversation companion for people with hearing impairment.**

Sonorous uses browser speech recognition to display nearby speech as large readable captions. It also lets the user type a reply to show on screen or optionally speak aloud through the phone speaker.

## Features
- Live captions in supported browsers
- English (India), Hindi, Kannada, Telugu, Tamil, Malayalam and English (US) language choices
- Large, adjustable captions with hold/resume and clear controls
- Type a reply and show it in large text
- Optional text-to-speech for replies
- Responsive, installable progressive web app with a small offline shell

## Run it
This is a static web app with no build step and no app server. Publish the repository root using GitHub Pages (Settings → Pages → Deploy from a branch → main → /(root)). Open the published HTTPS URL on a supported browser and grant microphone permission after tapping **Start captions**.

## Important limitations and privacy
- Browser support for live speech recognition varies. This prototype works only where the browser exposes the Web Speech Recognition API.
- Some browsers may send audio to an online recognition service. Check the browser/service provider's privacy terms before use; do not use this prototype for confidential conversations.
- Accuracy can be poor with overlapping speakers, background noise, accents or unsupported languages. Verify names, numbers, medical, financial and other important information.
- The app does not replace hearing aids, professional support, or other accessibility tools.
- The app requires the page to remain open while listening. Background listening is not guaranteed.
- The offline shell can load cached files, but live speech recognition may still need a network connection.

## Testing checklist
1. Open the HTTPS page in Android Chrome.
2. Tap Start captions and grant microphone permission.
3. Test one speaker at a time in a quiet room, then at normal conversation distance.
4. Try each language your family uses.
5. Test hold/resume, larger text, clear text, show reply and speak reply.
6. Test in background noise and note mistakes; do not rely on captions for critical details.

## Technology
HTML, CSS and JavaScript. No framework, database, account, or API key.
