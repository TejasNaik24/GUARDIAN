# Voice Mode - Integration Guide

## Quick Start

The new modular voice system is built with a state machine architecture and provides cross-browser support.

### 1. Wrap your app with SpeechProvider

```tsx
import { SpeechProvider } from '@/components/speech/SpeechProvider';

export default function ChatPage() {
  return (
    <SpeechProvider>
      {/* Your chat UI */}
    </SpeechProvider>
  );
}
```

### 2. Add Voice Components

```tsx
import VoiceToggle from '@/components/speech/VoiceToggle';
import MicControl from '@/components/speech/MicControl';
import ListeningIndicator from '@/components/speech/ListeningIndicator';
import SpeechToast from '@/components/speech/SpeechToast';

// In your chat UI:
<div>
  {/* Top right corner */}
  <VoiceToggle />
  
  {/* Center of screen when in voice mode */}
  <MicControl />
  <ListeningIndicator />
  
  {/* Error toasts */}
  <SpeechToast />
</div>
```

### 3. Handle Voice Input

```tsx
import { useSpeech } from '@/hooks/useSpeech';

function YourChatComponent() {
  const { finalTranscript, state, speak } = useSpeech();
  
  // Send message when transcript is finalized
  useEffect(() => {
    if (finalTranscript && state === 'processing') {
      sendMessage(finalTranscript);
    }
  }, [finalTranscript, state]);
  
  // Speak LLM response
  const handleResponse = async (response: string) => {
    await speak(response);
  };
}
```

## State Machine

States flow as follows:

1. **idle** - Default text mode
2. **ready** - Voice mode active, waiting for user
3. **listening** - Microphone unmuted, recording speech
4. **processing** - Sending transcript to LLM
5. **speaking** - Playing TTS response
6. **error** - Permission denied or other error

## Browser Compatibility

### Chrome/Edge
- ✅ Web Speech API (STT)
- ✅ SpeechSynthesis (TTS)
- ⚠️ Requires user gesture for audio

### Safari
- ❌ No Web Speech API → uses MediaRecorder fallback
- ✅ SpeechSynthesis (TTS)
- ℹ️ Requires `/api/speech/recognize` backend endpoint

## Testing Microphone Access

### Chrome
1. Click site settings icon (left of URL)
2. Allow Microphone
3. Refresh page

### Safari
1. Safari → Preferences → Websites → Microphone
2. Allow for localhost
3. macOS System Settings → Privacy & Security → Microphone → Enable Safari

## File Structure

```
frontend/
├── components/speech/
│   ├── SpeechProvider.tsx    # Context & state machine
│   ├── VoiceToggle.tsx        # Text/Voice toggle
│   ├── MicControl.tsx         # Mic button
│   ├── ListeningIndicator.tsx # Live transcript
│   └── SpeechToast.tsx        # Error toasts
├── hooks/
│   └── useSpeech.ts           # Hook to use context
└── lib/speech/
    ├── tts.ts                 # TTS helpers
    └── sttFallback.ts         # MediaRecorder for Safari
```

## Example Integration

See the implementation plan for a complete integration example with the existing chat system.

## Known Limitations

- Safari requires backend STT endpoint (MediaRecorder → server transcription)
- Chrome autoplay policy requires toggle click before TTS works
- Mobile browsers may have additional restrictions
