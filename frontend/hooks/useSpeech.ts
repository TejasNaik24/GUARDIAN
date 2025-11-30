/**
 * Custom hook to use Speech functionality
 * Re-exports the context hook with a cleaner name
 */

export { useSpeechContext as useSpeech } from '@/components/speech/SpeechProvider';
export type { SpeechState, SpeechError, SpeechErrorType } from '@/components/speech/SpeechProvider';
