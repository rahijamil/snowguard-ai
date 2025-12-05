// ===============================================
// API CLIENT & TYPE DEFINITIONS
// ===============================================

// ===== lib/types/index.ts =====
export interface User {
  id: number;
  email: string;
  name: string;
  preferences?: AccessibilityPreferences;
  createdAt?: string;
}

export interface AccessibilityPreferences {
  fontSize: "small" | "medium" | "large" | "xlarge";
  highContrast: boolean;
  ttsEnabled: boolean;
  voiceCommands: boolean;
}

export interface AuthResponse {
  token: string;
  userId: number;
  email: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface Hazard {
  type:
    | "SNOW"
    | "ICE"
    | "RAIN"
    | "FOG"
    | "WIND"
    | "LOW_VISIBILITY"
    | "EXTREME_COLD";
  severity: number; // 0-100
  description: string;
}

export interface HazardResponse {
  location: {
    lat: number;
    lon: number;
  };
  hazardSummary: Hazard[];
  timestamp: string;
  warning?: string;
}

export interface RouteRequest {
  fromLat: number;
  fromLon: number;
  toLat: number;
  toLon: number;
  pref?: "safe" | "fast" | "short";
}

export interface RouteResponse {
  path: Array<{ lat: number; lon: number }>;
  distanceMeters: number;
  durationSeconds: number;
  riskScore: number; // 0-100
  hazardHotspots: Array<{
    lat: number;
    lon: number;
    severity: number;
    hazardType: string;
  }>;
  recommendation: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatRequest {
  user_id?: number;
  message: string;
  context?: {
    location?: { lat: number; lon: number };
    hazards?: Hazard[];
    route?: {
      distanceMeters?: number;
      riskScore?: number;
    };
    preferences?: {
      concise?: boolean;
      tts?: boolean;
    };
  };
}

export interface ChatResponse {
  reply: string;
  confidence?: number;
  suggestions?: string[];
  warnings?: string[];
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface ChatHistoryItem {
  id: number;
  prompt: string;
  response: string;
  created_at: string;
  model_used: string;
  tokens_used?: number;
  metadata?: {
    confidence?: number;
    warnings?: string[];
    suggestions?: string[];
    provider?: string;
    [key: string]: any;
  };
}

export interface ChatHistoryResponse {
  user_id: number;
  total_count: number;
  count: number;
  limit: number;
  offset: number;
  chats: ChatHistoryItem[];
}
