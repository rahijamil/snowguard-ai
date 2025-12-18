// ===== app/(dashboard)/history/page.tsx =====
"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocation } from "@/lib/hooks/use-location";
import { useAuth } from "@/lib/hooks/use-auth";
import { hazardsApi } from "@/lib/api/hazards";
import { chatApi } from "@/lib/api/chat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  History,
  Download,
  Calendar,
  MapPin,
  MessageSquare,
  AlertCircle,
  Navigation as NavigationIcon,
  User,
  Bot,
  Trash2,
} from "lucide-react";
import { format, formatDate } from "date-fns";
import {
  formatHazardType,
  formatSeverity,
  formatDistance,
  formatDuration,
} from "@/lib/utils/formatters";
import { historyApi } from "@/lib/api/history";

interface HazardHistoryItem {
  id: number;
  hazardType: string;
  severity: number;
  description?: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

interface RouteHistoryItem {
  id: number;
  fromLatitude: number;
  fromLongitude: number;
  toLatitude: number;
  toLongitude: number;
  distanceMeters: number;
  durationSeconds: number;
  riskScore: number;
  createdAt: string;
}

interface ChatHistoryItem {
  id: number;
  prompt: string;
  response: string;
  created_at: string;
  model_used?: string;
  tokens_used?: number;
}

export default function HistoryPage() {
  const { location } = useLocation();
  const { user } = useAuth();

  // State for each tab
  const [hazardHistory, setHazardHistory] = useState<HazardHistoryItem[]>([]);
  const [routeHistory, setRouteHistory] = useState<RouteHistoryItem[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);

  const [hazardLoading, setHazardLoading] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState("7");
  const [activeTab, setActiveTab] = useState("hazards");

  // Load hazard history
  const loadHazardHistory = useCallback(async () => {
    if (!location) return;

    setHazardLoading(true);
    setError(null);

    try {
      const data = await hazardsApi.getHistory(
        location.lat,
        location.lon,
        5,
        parseInt(days)
      );
      setHazardHistory(data);
    } catch (error: any) {
      setError(error.message || "Failed to load hazard history");
    } finally {
      setHazardLoading(false);
    }
  }, [location, days]);

  // Load route history
  const loadRouteHistory = useCallback(async () => {
    if (!user) return;

    setRouteLoading(true);
    setError(null);

    try {
      // Call route history endpoint
      const data = await historyApi.getRouteHistory(user.id, parseInt(days));
      setRouteHistory(data);
    } catch (error: any) {
      console.error("Route history error:", error);
      // Don't show error - just show empty state
      setRouteHistory([]);
    } finally {
      setRouteLoading(false);
    }
  }, [user, days]);

  // Load chat history
  const loadChatHistory = useCallback(async () => {
    if (!user) return;

    setChatLoading(true);
    setError(null);

    try {
      const data = await chatApi.getChatHistory(user.id, 50);
      setChatHistory(data.chats || []);
    } catch (error: any) {
      console.error("Chat history error:", error);
      // Don't show error - just show empty state
      setChatHistory([]);
    } finally {
      setChatLoading(false);
    }
  }, [user]);

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === "hazards" && location) {
      loadHazardHistory();
    } else if (activeTab === "routes" && user) {
      loadRouteHistory();
    } else if (activeTab === "chats" && user) {
      loadChatHistory();
    }
  }, [
    activeTab,
    location,
    user,
    days,
    loadHazardHistory,
    loadRouteHistory,
    loadChatHistory,
  ]);

  // Export functions
  const exportHazardData = (format: "csv" | "json") => {
    if (hazardHistory.length === 0) return;

    try {
      if (format === "json") {
        const dataStr = JSON.stringify(hazardHistory, null, 2);
        downloadFile(dataStr, "application/json", "hazard-history");
      } else {
        const headers = "Date,Type,Severity,Description,Latitude,Longitude\n";
        const rows = hazardHistory
          .map((h) => {
            const desc = (h.description || "").replace(/"/g, '""');
            return `${formatDate(new Date(h.timestamp), "yyyy-MM-dd HH:mm")},"${
              h.hazardType
            }",${h.severity},"${desc}",${h.latitude},${h.longitude}`;
          })
          .join("\n");
        downloadFile(headers + rows, "text/csv", "hazard-history");
      }
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const exportRouteData = (format: "csv" | "json") => {
    if (routeHistory.length === 0) return;

    try {
      if (format === "json") {
        const dataStr = JSON.stringify(routeHistory, null, 2);
        downloadFile(dataStr, "application/json", "route-history");
      } else {
        const headers = "Date,From,To,Distance,Duration,Risk Score\n";
        const rows = routeHistory
          .map((r) => {
            const date = formatDate(new Date(r.createdAt), "yyyy-MM-dd HH:mm");
            const from = `"${r.fromLatitude.toFixed(
              4
            )}, ${r.fromLongitude.toFixed(4)}"`;
            const to = `"${r.toLatitude.toFixed(4)}, ${r.toLongitude.toFixed(
              4
            )}"`;
            return `${date},${from},${to},${r.distanceMeters},${r.durationSeconds},${r.riskScore}`;
          })
          .join("\n");
        downloadFile(headers + rows, "text/csv", "route-history");
      }
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const exportChatData = (format: "csv" | "json") => {
    if (chatHistory.length === 0) return;

    try {
      if (format === "json") {
        const dataStr = JSON.stringify(chatHistory, null, 2);
        downloadFile(dataStr, "application/json", "chat-history");
      } else {
        const headers = "Date,Prompt,Response,Model,Tokens\n";
        const rows = chatHistory
          .map((c) => {
            const date = formatDate(new Date(c.created_at), "yyyy-MM-dd HH:mm");
            const prompt = (c.prompt || "").replace(/"/g, '""');
            const response = (c.response || "").replace(/"/g, '""');
            return `${date},"${prompt}","${response}","${c.model_used || ""}",${
              c.tokens_used || 0
            }`;
          })
          .join("\n");
        downloadFile(headers + rows, "text/csv", "chat-history");
      }
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const downloadFile = (
    content: string,
    mimeType: string,
    filename: string
  ) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}-${Date.now()}.${
      mimeType.includes("json") ? "json" : "csv"
    }`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getExportFunction = () => {
    if (activeTab === "hazards") return exportHazardData;
    if (activeTab === "routes") return exportRouteData;
    return exportChatData;
  };

  const getCurrentData = () => {
    if (activeTab === "hazards") return hazardHistory;
    if (activeTab === "routes") return routeHistory;
    return chatHistory;
  };

  const isLoading = () => {
    if (activeTab === "hazards") return hazardLoading;
    if (activeTab === "routes") return routeLoading;
    return chatLoading;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <History className="h-8 w-8" />
            History
          </h1>
          <p className="text-gray-600 mt-1">
            View past hazards, routes, and conversations
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === "hazards" && (
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 24 hours</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button
            variant="outline"
            onClick={() => getExportFunction()("csv")}
            disabled={isLoading() || getCurrentData().length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => getExportFunction()("json")}
            disabled={isLoading() || getCurrentData().length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hazards">Hazard History</TabsTrigger>
          <TabsTrigger value="routes">Route History</TabsTrigger>
          <TabsTrigger value="chats">Chat History</TabsTrigger>
        </TabsList>

        {/* Hazard History Tab */}
        <TabsContent value="hazards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historical Hazard Data</CardTitle>
            </CardHeader>
            <CardContent>
              {hazardLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : hazardHistory.length > 0 ? (
                <div className="space-y-3">
                  {hazardHistory.map((hazard, index) => {
                    const { label } = formatSeverity(hazard.severity);
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <Calendar className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                            <p className="text-xs text-gray-600">
                              {formatDate(new Date(hazard.timestamp), "MMM dd")}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(new Date(hazard.timestamp), "HH:mm")}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold">
                              {formatHazardType(hazard.hazardType)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {hazard.description || "No description"}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {hazard.latitude.toFixed(4)},{" "}
                                {hazard.longitude.toFixed(4)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-700">
                            {hazard.severity}
                          </p>
                          <Badge
                            variant={
                              hazard.severity > 60 ? "destructive" : "secondary"
                            }
                          >
                            {label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No hazard history available</p>
                  <p className="text-sm mt-2">
                    Data will appear as you use the app
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Route History Tab */}
        <TabsContent value="routes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Previous Routes</CardTitle>
            </CardHeader>
            <CardContent>
              {routeLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : routeHistory.length > 0 ? (
                <div className="space-y-3">
                  {routeHistory.map((route) => {
                    const { label, color } = formatSeverity(route.riskScore);
                    return (
                      <div
                        key={route.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <Calendar className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                            <p className="text-xs text-gray-600">
                              {format(new Date(route.createdAt), "MMM dd")}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(route.createdAt), "HH:mm")}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <NavigationIcon className="h-4 w-4 text-blue-500" />
                              <p className="font-semibold">Route</p>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-3 w-3" />
                              <span>
                                From: {route.fromLatitude.toFixed(4)},{" "}
                                {route.fromLongitude.toFixed(4)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-3 w-3" />
                              <span>
                                To: {route.toLatitude.toFixed(4)},{" "}
                                {route.toLongitude.toFixed(4)}
                              </span>
                            </div>
                            <div className="flex gap-4 mt-2 text-xs text-gray-500">
                              <span>
                                📏 {formatDistance(route.distanceMeters)}
                              </span>
                              <span>
                                ⏱️ {formatDuration(route.durationSeconds)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={color}>{label}</Badge>
                          <p className="text-sm text-gray-600 mt-1">
                            Risk: {route.riskScore}/100
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <NavigationIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No route history available</p>
                  <p className="text-sm mt-2">
                    Routes you calculate will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat History Tab */}
        <TabsContent value="chats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversation History</CardTitle>
            </CardHeader>
            <CardContent>
              {chatLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : chatHistory.length > 0 ? (
                <div className="space-y-4">
                  {chatHistory.map((chat) => (
                    <div
                      key={chat.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {format(
                            new Date(chat.created_at),
                            "MMM dd, yyyy HH:mm"
                          )}
                        </span>
                        {chat.tokens_used && (
                          <Badge variant="secondary" className="text-xs">
                            {chat.tokens_used} tokens
                          </Badge>
                        )}
                      </div>

                      {/* User Message */}
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-sky-600" />
                          </div>
                        </div>
                        <div className="flex-1 bg-sky-50 rounded-lg p-3">
                          <p className="text-sm">{chat.prompt}</p>
                        </div>
                      </div>

                      {/* Assistant Response */}
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-indigo-600" />
                          </div>
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-700">
                            {chat.response}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No chat history available</p>
                  <p className="text-sm mt-2">
                    Your AI conversations will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
