// ===============================================
// ACCESSIBLE CHAT PAGE - WITH USER PREFERENCES
// ===============================================

// ===== app/(dashboard)/chat/page.tsx =====
"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@/lib/hooks/use-chat";
import { useLocation } from "@/lib/hooks/use-location";
import { useHazards } from "@/lib/hooks/use-hazards";
import { useAuthStore } from "@/lib/store/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MessageSquare,
  Send,
  Loader2,
  Sparkles,
  User,
  Bot,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  Volume2,
  Mic,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAuth } from "@/lib/hooks/use-auth";
import { chatApi } from "@/lib/api/chat";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatMessage } from "@/lib/types";

// TTS Button Component
function TTSButton({ text, className }: { text: string; className?: string }) {
  const [speaking, setSpeaking] = useState(false);
  const { preferences } = useAuthStore();

  const handleSpeak = () => {
    if (!preferences.ttsEnabled) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  if (!preferences.ttsEnabled) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-8 w-8", className)}
      onClick={handleSpeak}
      title={speaking ? "Stop speaking" : "Read aloud"}
    >
      {speaking ? (
        <VolumeX className="h-4 w-4 text-indigo-600" />
      ) : (
        <Volume2 className="h-4 w-4 text-gray-500" />
      )}
    </Button>
  );
}

// Voice Input Component
function VoiceInput({
  onTranscript,
  disabled,
}: {
  onTranscript: (text: string) => void;
  disabled: boolean;
}) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { preferences } = useAuthStore();

  useEffect(() => {
    if (!preferences.voiceCommands || !("webkitSpeechRecognition" in window)) {
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();

    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = false;
    recognitionInstance.lang = "en-US";

    recognitionInstance.onstart = () => setListening(true);
    recognitionInstance.onend = () => setListening(false);
    recognitionInstance.onerror = () => setListening(false);

    recognitionInstance.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
    };

    recognitionRef.current = recognitionInstance;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [preferences.voiceCommands, onTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (listening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  if (!preferences.voiceCommands) return null;

  return (
    <Button
      variant={listening ? "default" : "outline"}
      size="icon"
      onClick={toggleListening}
      disabled={disabled}
      className={cn(listening && "animate-pulse")}
      title={listening ? "Stop listening" : "Start voice input"}
    >
      <Mic className="h-5 w-5" />
    </Button>
  );
}

// Message Bubble Component
function MessageBubble({ message }: { message: ChatMessage }) {
  const { preferences } = useAuthStore();

  // Font size classes based on preferences
  const fontSizeClass = {
    small: "text-sm",
    medium: "text-base",
    large: "text-lg",
    xlarge: "text-xl",
  }[preferences.fontSize || "medium"];

  return (
    <div
      className={cn(
        "flex gap-3",
        message.role === "user" ? "justify-end" : "justify-start"
      )}
    >
      {message.role === "assistant" && (
        <div className="flex-shrink-0">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              preferences.highContrast ? "bg-black text-white" : "bg-indigo-100"
            )}
          >
            <Bot
              className={cn(
                "h-5 w-5",
                preferences.highContrast ? "text-white" : "text-indigo-600"
              )}
            />
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 max-w-[80%]">
        <div
          className={cn(
            "rounded-lg p-4 flex-1",
            message.role === "user"
              ? preferences.highContrast
                ? "bg-black text-white border-2 border-white"
                : "bg-sky-500 text-white"
              : preferences.highContrast
              ? "bg-white border-2 border-black"
              : "bg-white border border-gray-200"
          )}
        >
          <p className={cn("whitespace-pre-wrap", fontSizeClass)}>
            {message.content}
          </p>
          <p
            className={cn(
              "text-xs mt-2",
              message.role === "user"
                ? preferences.highContrast
                  ? "text-gray-300"
                  : "text-sky-100"
                : "text-gray-500"
            )}
          >
            {new Date(message.timestamp).toLocaleTimeString()}
          </p>
        </div>

        {message.role === "assistant" && <TTSButton text={message.content} />}
      </div>

      {message.role === "user" && (
        <div className="flex-shrink-0">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              preferences.highContrast ? "bg-black text-white" : "bg-sky-100"
            )}
          >
            <User
              className={cn(
                "h-5 w-5",
                preferences.highContrast ? "text-white" : "text-sky-600"
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Main Chat Page Component
export default function ChatPage() {
  const { user } = useAuth();
  const { preferences } = useAuthStore();
  const { messages, loading, sendMessage } = useChat();
  const { location } = useLocation();
  const { hazards } = useHazards();
  const [input, setInput] = useState("");
  const [lastResponse, setLastResponse] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);

  // Font size classes based on preferences
  const fontSizeClass = {
    small: "text-sm",
    medium: "text-base",
    large: "text-lg",
    xlarge: "text-xl",
  }[preferences.fontSize || "medium"];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load chat history on mount
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!user?.id || hasLoadedHistory) return;

      try {
        setLoadingHistory(true);
        const response = await chatApi.getChatHistory(user.id, 50);

        if (response.chats && response.chats.length > 0) {
          const useChatStore = (await import("@/lib/store/chat-store"))
            .useChatStore;
          const { clearMessages, addMessage } = useChatStore.getState();

          clearMessages();

          response.chats.reverse().forEach((chat: any) => {
            addMessage({
              role: "user",
              content: chat.prompt,
              timestamp: chat.created_at,
            });

            addMessage({
              role: "assistant",
              content: chat.response,
              timestamp: chat.created_at,
            });
          });
        }

        setHasLoadedHistory(true);
      } catch (error) {
        console.error("Failed to load chat history:", error);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadChatHistory();
  }, [user?.id, hasLoadedHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const context = {
      location: location ? { lat: location.lat, lon: location.lon } : undefined,
      hazards: hazards?.hazardSummary || undefined,
      preferences: {
        concise:
          preferences.fontSize === "small" || preferences.fontSize === "medium",
        tts: preferences.ttsEnabled,
      },
    };

    try {
      const response = await sendMessage(input, context);
      setLastResponse(response);
      setInput("");

      // Auto-speak response if TTS is enabled
      if (preferences.ttsEnabled && response) {
        const utterance = new SpeechSynthesisUtterance(
          messages[messages.length - 1]?.content || ""
        );
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceTranscript = (transcript: string) => {
    setInput(transcript);
    // Auto-send if voice commands are enabled
    setTimeout(() => {
      handleSend();
    }, 500);
  };

  const suggestedQuestions = [
    "Is it safe to go outside right now?",
    "What should I wear for these conditions?",
    "How can I prevent slips on ice?",
    "Should I delay my travel plans?",
  ];

  const handleSuggestion = (question: string) => {
    setInput(question);
  };

  return (
    <div className={cn("space-y-6", preferences.highContrast && "bg-white")}>
      {/* Header */}
      <div>
        <h1
          className={cn(
            "text-3xl font-bold flex items-center gap-2",
            fontSizeClass,
            preferences.highContrast ? "text-black" : "text-gray-900"
          )}
        >
          <Sparkles
            className={cn(
              "h-8 w-8",
              preferences.highContrast ? "text-black" : "text-indigo-500"
            )}
          />
          AI Safety Assistant
        </h1>
        <p
          className={cn(
            "mt-1",
            preferences.highContrast ? "text-black" : "text-gray-600"
          )}
        >
          Ask me anything about winter safety and current conditions
        </p>
      </div>

      {/* Accessibility Status Bar */}
      {(preferences.ttsEnabled || preferences.voiceCommands) && (
        <Alert
          className={cn(
            preferences.highContrast &&
              "bg-yellow-400 border-2 border-black text-black"
          )}
        >
          <AlertDescription className="flex items-center gap-2">
            {preferences.ttsEnabled && (
              <Badge variant="secondary">
                <Volume2 className="h-3 w-3 mr-1" />
                TTS Enabled
              </Badge>
            )}
            {preferences.voiceCommands && (
              <Badge variant="secondary">
                <Mic className="h-3 w-3 mr-1" />
                Voice Input Enabled
              </Badge>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Chat */}
        <Card
          className={cn(
            "lg:col-span-3",
            preferences.highContrast && "border-2 border-black"
          )}
        >
          <CardHeader>
            <CardTitle
              className={cn(
                "flex items-center justify-between",
                preferences.highContrast && "text-black"
              )}
            >
              <span className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversation
              </span>
              {lastResponse?.confidence && (
                <Badge
                  variant={preferences.highContrast ? "default" : "secondary"}
                  className="text-xs"
                >
                  Confidence: {Math.round(lastResponse.confidence * 100)}%
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Messages */}
            <div
              className={cn(
                "h-[500px] overflow-y-auto space-y-4 p-4 rounded-lg",
                preferences.highContrast
                  ? "bg-white border-2 border-black"
                  : "bg-gray-50"
              )}
            >
              {loadingHistory ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-3/4" />
                  <Skeleton className="h-20 w-3/4 ml-auto" />
                  <Skeleton className="h-20 w-3/4" />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center">
                  <div>
                    <Bot
                      className={cn(
                        "h-16 w-16 mx-auto mb-4",
                        preferences.highContrast
                          ? "text-black"
                          : "text-gray-300"
                      )}
                    />
                    <p
                      className={cn(
                        "mb-2",
                        fontSizeClass,
                        preferences.highContrast
                          ? "text-black font-bold"
                          : "text-gray-600"
                      )}
                    >
                      Start a conversation
                    </p>
                    <p
                      className={cn(
                        "text-sm",
                        preferences.highContrast
                          ? "text-black"
                          : "text-gray-500"
                      )}
                    >
                      Ask me about weather conditions, safety tips, or route
                      planning
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <MessageBubble key={index} message={message} />
                ))
              )}
              {loading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        preferences.highContrast ? "bg-black" : "bg-indigo-100"
                      )}
                    >
                      <Bot
                        className={cn(
                          "h-5 w-5",
                          preferences.highContrast
                            ? "text-white"
                            : "text-indigo-600"
                        )}
                      />
                    </div>
                  </div>
                  <div
                    className={cn(
                      "rounded-lg p-4",
                      preferences.highContrast
                        ? "bg-white border-2 border-black"
                        : "bg-white border border-gray-200"
                    )}
                  >
                    <Loader2
                      className={cn(
                        "h-5 w-5 animate-spin",
                        preferences.highContrast
                          ? "text-black"
                          : "text-indigo-600"
                      )}
                    />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message... (Press Enter to send)"
                className={cn(
                  "min-h-[60px]",
                  fontSizeClass,
                  preferences.highContrast &&
                    "border-2 border-black bg-white text-black placeholder:text-gray-700"
                )}
                disabled={loading}
                aria-label="Message input"
              />

              {/* Voice Input Button */}
              {preferences.voiceCommands && (
                <VoiceInput
                  onTranscript={handleVoiceTranscript}
                  disabled={loading}
                />
              )}

              {/* Send Button */}
              <Button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className={cn(
                  "px-6",
                  preferences.highContrast &&
                    "bg-black text-white hover:bg-gray-800 border-2 border-black"
                )}
                aria-label="Send message"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Response Details */}
          {lastResponse && (
            <Card
              className={cn(
                preferences.highContrast && "border-2 border-black"
              )}
            >
              <CardHeader>
                <CardTitle
                  className={cn(
                    "text-sm flex items-center gap-2",
                    preferences.highContrast && "text-black"
                  )}
                >
                  <TrendingUp className="h-4 w-4" />
                  Response Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Confidence */}
                {lastResponse.confidence !== undefined && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={cn(
                          "text-xs",
                          preferences.highContrast
                            ? "text-black font-bold"
                            : "text-gray-600"
                        )}
                      >
                        Confidence
                      </span>
                      <span className="text-xs font-semibold">
                        {Math.round(lastResponse.confidence * 100)}%
                      </span>
                    </div>
                    <div
                      className={cn(
                        "w-full rounded-full h-2",
                        preferences.highContrast ? "bg-gray-300" : "bg-gray-200"
                      )}
                    >
                      <div
                        className={cn(
                          "h-2 rounded-full transition-all",
                          preferences.highContrast
                            ? "bg-black"
                            : "bg-indigo-500"
                        )}
                        style={{ width: `${lastResponse.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {lastResponse.warnings && lastResponse.warnings.length > 0 && (
                  <div>
                    <p
                      className={cn(
                        "text-xs font-semibold mb-2 flex items-center gap-1",
                        preferences.highContrast
                          ? "text-black"
                          : "text-gray-700"
                      )}
                    >
                      <AlertTriangle
                        className={cn(
                          "h-3 w-3",
                          preferences.highContrast
                            ? "text-black"
                            : "text-red-500"
                        )}
                      />
                      Warnings
                    </p>
                    <div className="space-y-1">
                      {lastResponse.warnings.map(
                        (warning: string, idx: number) => (
                          <Alert
                            key={idx}
                            variant="destructive"
                            className={cn(
                              "py-2",
                              preferences.highContrast &&
                                "bg-red-100 border-2 border-black"
                            )}
                          >
                            <AlertDescription
                              className={cn("text-xs", fontSizeClass)}
                            >
                              {warning}
                            </AlertDescription>
                          </Alert>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Suggestions */}
                {lastResponse.suggestions &&
                  lastResponse.suggestions.length > 0 && (
                    <div>
                      <p
                        className={cn(
                          "text-xs font-semibold mb-2 flex items-center gap-1",
                          preferences.highContrast
                            ? "text-black"
                            : "text-gray-700"
                        )}
                      >
                        <Lightbulb
                          className={cn(
                            "h-3 w-3",
                            preferences.highContrast
                              ? "text-black"
                              : "text-yellow-500"
                          )}
                        />
                        Suggestions
                      </p>
                      <div className="space-y-1">
                        {lastResponse.suggestions
                          .slice(0, 3)
                          .map((suggestion: string, idx: number) => (
                            <div
                              key={idx}
                              className={cn(
                                "text-xs p-2 rounded",
                                fontSizeClass,
                                preferences.highContrast
                                  ? "bg-yellow-200 border-2 border-black text-black"
                                  : "bg-yellow-50 border border-yellow-200"
                              )}
                            >
                              {suggestion}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          )}

          {/* Quick Questions */}
          <Card
            className={cn(preferences.highContrast && "border-2 border-black")}
          >
            <CardHeader>
              <CardTitle
                className={cn(
                  "text-sm",
                  preferences.highContrast && "text-black"
                )}
              >
                Quick Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant={preferences.highContrast ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "w-full text-left justify-start h-auto py-2 px-3",
                    fontSizeClass,
                    preferences.highContrast &&
                      "bg-black text-white hover:bg-gray-800 border-2 border-black"
                  )}
                  onClick={() => handleSuggestion(question)}
                  disabled={loading}
                >
                  {question}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Context Info */}
          <Card
            className={cn(preferences.highContrast && "border-2 border-black")}
          >
            <CardHeader>
              <CardTitle
                className={cn(
                  "text-sm",
                  preferences.highContrast && "text-black"
                )}
              >
                Context
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {location ? (
                <Badge
                  variant={preferences.highContrast ? "default" : "secondary"}
                  className={cn(
                    "text-xs",
                    preferences.highContrast && "bg-black text-white"
                  )}
                >
                  📍 {location.lat.toFixed(2)}, {location.lon.toFixed(2)}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  📍 Location not available
                </Badge>
              )}
              {hazards?.hazardSummary && hazards.hazardSummary.length > 0 ? (
                <Badge
                  variant={preferences.highContrast ? "default" : "secondary"}
                  className={cn(
                    "text-xs",
                    preferences.highContrast && "bg-black text-white"
                  )}
                >
                  ⚠️ {hazards.hazardSummary.length} hazards detected
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  ✅ No hazards detected
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
