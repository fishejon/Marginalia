import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface SpeechToTextButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
  label?: string;
}

export const SpeechToTextButton: React.FC<SpeechToTextButtonProps> = ({
  onTranscript,
  className = '',
  label = 'Dictate'
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const toggleRecording = () => {
    if (!isSupported) {
      alert('Speech recognition is not supported in this browser. Please type directly.');
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        onTranscript(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsRecording(false);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggleRecording}
      title={isRecording ? 'Stop dictation' : 'Speak your thoughts'}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border transition-colors ${
        isRecording
          ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
          : 'bg-[#F7F4EE] text-stone-700 border-stone-300 hover:bg-[#EFECE4]'
      } ${className}`}
    >
      {isRecording ? (
        <>
          <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping mr-0.5" />
          <MicOff className="w-3.5 h-3.5 text-rose-600" />
          <span>Recording...</span>
        </>
      ) : (
        <>
          <Mic className="w-3.5 h-3.5 text-stone-600" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};
