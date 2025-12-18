// ===== app/(dashboard)/dashboard/page.tsx (UPDATED) =====
"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { useDashboard } from "@/lib/hooks/use-dashboard";
import { useLocation } from "@/lib/hooks/use-location";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  MapPin,
  Cloud,
  Wind,
  Snowflake,
  Navigation,
  MessageSquare,
  History,
  RefreshCw,
  Sparkles,
  Bell,
} from "lucide-react";
import { formatSeverity, formatHazardType } from "@/lib/utils/formatters";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();
  const {
    location,
    loading: locationLoading,
    error: locationError,
  } = useLocation();
  const { data, loading, error, fetchDashboard, refresh } = useDashboard();

  // Fetch dashboard data when location is available
  useEffect(() => {
    if (location) {
      fetchDashboard(location.lat, location.lon, 5.0);
    }
  }, [location, fetchDashboard]);

  const handleRefresh = () => {
    if (location) {
      refresh(location.lat, location.lon, 5.0);
    }
  };

  // Extract data from aggregated response
  const hazards = data?.hazards;
  const aiSuggestion = data?.aiSuggestions;
  const lastUpdate = data?.timestamp ? new Date(data.timestamp) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {data?.userName || user?.name || "User"}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here&apos;s your winter safety overview
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={loading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Errors */}
      {locationError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{locationError}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {data?.error && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{data.error}</AlertDescription>
        </Alert>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/map">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <MapPin className="h-8 w-8 text-sky-500 mb-2" />
              <h3 className="font-semibold">View Map</h3>
              <p className="text-sm text-gray-600">See hazards nearby</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/chat">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <MessageSquare className="h-8 w-8 text-indigo-500 mb-2" />
              <h3 className="font-semibold">AI Assistant</h3>
              <p className="text-sm text-gray-600">Get safety advice</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/map?action=route">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <Navigation className="h-8 w-8 text-green-500 mb-2" />
              <h3 className="font-semibold">Plan Route</h3>
              <p className="text-sm text-gray-600">Find safe paths</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/history">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <History className="h-8 w-8 text-orange-500 mb-2" />
              <h3 className="font-semibold">History</h3>
              <p className="text-sm text-gray-600">View past data</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* AI Suggestion (if available) */}
      {aiSuggestion && (
        <Card className="border-indigo-200 bg-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-900">
              <Sparkles className="h-5 w-5" />
              AI Safety Suggestion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-indigo-800">{aiSuggestion}</p>
          </CardContent>
        </Card>
      )}

      {/* Current Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Current Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          {locationLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : location ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Latitude:</span>
                <span className="font-mono">{location.lat.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Longitude:</span>
                <span className="font-mono">{location.lon.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Accuracy:</span>
                <span>{Math.round(location.accuracy)}m</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Location unavailable</p>
          )}
        </CardContent>
      </Card>

      {/* Active Hazards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Active Hazards
          </CardTitle>
          <CardDescription>
            {lastUpdate && `Last updated: ${lastUpdate.toLocaleTimeString()}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : hazards?.hazardSummary && hazards.hazardSummary.length > 0 ? (
            <div className="space-y-3">
              {hazards.hazardSummary.map((hazard, index) => {
                const { label, color } = formatSeverity(hazard.severity);
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      {hazard.type === "SNOW" && (
                        <Snowflake className="h-5 w-5 text-blue-500" />
                      )}
                      {hazard.type === "ICE" && (
                        <Snowflake className="h-5 w-5 text-cyan-500" />
                      )}
                      {hazard.type === "WIND" && (
                        <Wind className="h-5 w-5 text-gray-500" />
                      )}
                      {hazard.type === "FOG" && (
                        <Cloud className="h-5 w-5 text-gray-400" />
                      )}
                      <div>
                        <p className="font-semibold">
                          {formatHazardType(hazard.type)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {hazard.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-700">
                        {hazard.severity}
                      </span>
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
            <div className="text-center py-8 text-gray-500">
              <Cloud className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No active hazards detected</p>
            </div>
          )}

          {hazards?.warning && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{hazards.warning}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Notifications (if available from future notification-service) */}
      {data?.notifications && data.notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.notifications.map((notification: any, index: number) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="text-xs text-gray-600">
                    {notification.message}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
