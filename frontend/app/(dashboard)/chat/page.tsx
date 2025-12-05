// ===== app/(dashboard)/chat/page.tsx - UPDATED =====
"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@/lib/hooks/use-chat";
import { useLocation } from "@/lib/hooks/use-location";
import { useHazards } from "@/lib/hooks/use-hazards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatPage() {
  const { messages, loading, sendMessage } = useChat();
  const { location } = useLocation();
  const { hazards } = useHazards();
  const [input, setInput] = useState("");
  const [lastResponse, setLastResponse] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const context = {
      location: location ? { lat: location.lat, lon: location.lon } : undefined,
      hazards: hazards?.hazardSummary || undefined,
      preferences: { concise: true },
    };

    try {
      const response = await sendMessage(input, context);
      setLastResponse(response);
      setInput("");
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-indigo-500" />
          AI Safety Assistant
        </h1>
        <p className="text-gray-600 mt-1">
          Ask me anything about winter safety and current conditions
        </p>
      </div>

      {/* Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Chat */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversation
              </span>
              {lastResponse?.confidence && (
                <Badge variant="secondary" className="text-xs">
                  Confidence: {Math.round(lastResponse.confidence * 100)}%
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Messages */}
            <div className="h-[500px] overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center">
                  <div>
                    <Bot className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Start a conversation</p>
                    <p className="text-sm text-gray-500">
                      Ask me about weather conditions, safety tips, or route
                      planning
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                          <Bot className="h-5 w-5 text-indigo-600" />
                        </div>
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg p-4",
                        message.role === "user"
                          ? "bg-sky-500 text-white"
                          : "bg-white border border-gray-200"
                      )}
                    >
                      {message.role === "user" ? (
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                      ) : (
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              // Customize markdown rendering
                              p: ({ children }) => (
                                <p className="mb-2 last:mb-0">{children}</p>
                              ),
                              ul: ({ children }) => (
                                <ul className="mb-2 ml-4 list-disc">
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="mb-2 ml-4 list-decimal">
                                  {children}
                                </ol>
                              ),
                              li: ({ children }) => (
                                <li className="mb-1">{children}</li>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-semibold">
                                  {children}
                                </strong>
                              ),
                              em: ({ children }) => (
                                <em className="italic">{children}</em>
                              ),
                              code: ({ children }) => (
                                <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                                  {children}
                                </code>
                              ),
                              h1: ({ children }) => (
                                <h1 className="text-lg font-bold mb-2">
                                  {children}
                                </h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className="text-base font-bold mb-2">
                                  {children}
                                </h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="text-sm font-bold mb-1">
                                  {children}
                                </h3>
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      )}
                      <p
                        className={cn(
                          "text-xs mt-2",
                          message.role === "user"
                            ? "text-sky-100"
                            : "text-gray-500"
                        )}
                      >
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-sky-600" />
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
              {loading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-indigo-600" />
                    </div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                      <span className="text-sm text-gray-600">Thinking...</span>
                    </div>
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
                placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                className="min-h-[60px]"
                disabled={loading}
              />
              <Button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-6"
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
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Response Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Confidence */}
                {lastResponse.confidence !== undefined && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Confidence</span>
                      <span className="text-xs font-semibold">
                        {Math.round(lastResponse.confidence * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full transition-all"
                        style={{ width: `${lastResponse.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {lastResponse.warnings && lastResponse.warnings.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      Warnings
                    </p>
                    <div className="space-y-1">
                      {lastResponse.warnings.map(
                        (warning: string, idx: number) => (
                          <Alert
                            key={idx}
                            variant="destructive"
                            className="py-2"
                          >
                            <AlertDescription className="text-xs">
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
                      <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                        <Lightbulb className="h-3 w-3 text-yellow-500" />
                        Suggestions
                      </p>
                      <div className="space-y-1">
                        {lastResponse.suggestions
                          .slice(0, 3)
                          .map((suggestion: string, idx: number) => (
                            <div
                              key={idx}
                              className="text-xs p-2 bg-yellow-50 border border-yellow-200 rounded"
                            >
                              {suggestion}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                {/* Metadata */}
                {lastResponse.metadata && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">
                      Model: {lastResponse.metadata.model || "Unknown"}
                    </p>
                    {lastResponse.metadata.tokens_used && (
                      <p className="text-xs text-gray-500">
                        Tokens: {lastResponse.metadata.tokens_used}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Questions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full text-left justify-start h-auto py-2 px-3 text-xs"
                  onClick={() => handleSuggestion(question)}
                  disabled={loading}
                >
                  {question}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Context Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {location ? (
                <Badge variant="secondary" className="text-xs">
                  📍 {location.lat.toFixed(2)}, {location.lon.toFixed(2)}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  📍 Location not available
                </Badge>
              )}
              {hazards?.hazardSummary && hazards.hazardSummary.length > 0 ? (
                <Badge variant="secondary" className="text-xs">
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
