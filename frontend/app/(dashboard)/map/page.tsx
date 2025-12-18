// ===== app/(dashboard)/map/page.tsx =====
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocation } from "@/lib/hooks/use-location";
import { useHazards } from "@/lib/hooks/use-hazards";
import { useRoutes } from "@/lib/hooks/use-routes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Layers,
  Navigation,
  AlertTriangle,
  RefreshCw,
  X,
  Loader2,
  Route as RouteIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import {
  formatDistance,
  formatDuration,
  formatRiskScore,
} from "@/lib/utils/formatters";

// Dynamically import map to avoid SSR issues
const MapContainer = dynamic(() => import("@/components/map/map-container"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
      <p className="text-gray-600">Loading map...</p>
    </div>
  ),
});

export default function MapPage() {
  const searchParams = useSearchParams();
  const action = searchParams.get("action");

  const {
    location,
    loading: locationLoading,
    error: locationError,
    refetch,
  } = useLocation();

  const { hazards, fetchHazards, loading: hazardsLoading } = useHazards();
  const {
    route,
    loading: routeLoading,
    calculateRoute,
    clearRoute,
  } = useRoutes();

  const [showHazards, setShowHazards] = useState(true);
  const [showRoutePanel, setShowRoutePanel] = useState(action === "route");

  // Route form state
  const [fromAddress, setFromAddress] = useState(
    location ? "Current Location" : ""
  );
  const [toAddress, setToAddress] = useState("");
  const [fromCoords, setFromCoords] = useState<{
    lat: number;
    lon: number;
  } | null>(location ? { lat: location.lat, lon: location.lon } : null);
  const [toCoords, setToCoords] = useState<{ lat: number; lon: number } | null>(
    null
  );
  const [routePreference, setRoutePreference] = useState<
    "safe" | "fast" | "short"
  >("safe");

  useEffect(() => {
    if (location) {
      fetchHazards(location.lat, location.lon, 10);
    }
  }, [location, fetchHazards]);

  const handleRefresh = () => {
    if (location) {
      fetchHazards(location.lat, location.lon, 10);
    }
  };

  const handleCalculateRoute = async () => {
    if (!fromCoords || !toCoords) {
      alert("Please enter both start and end locations");
      return;
    }

    try {
      await calculateRoute({
        fromLat: fromCoords.lat,
        fromLon: fromCoords.lon,
        toLat: toCoords.lat,
        toLon: toCoords.lon,
        pref: routePreference,
      });
    } catch (error: any) {
      console.error("Route calculation failed:", error);
    }
  };

  const handleClearRoute = () => {
    clearRoute();
    setToAddress("");
    setToCoords(null);
  };

  // Simple geocoding simulation (in production, use a geocoding API)
  const handleFromAddressSubmit = () => {
    if (fromAddress.toLowerCase().includes("current")) {
      if (location) {
        setFromCoords({ lat: location.lat, lon: location.lon });
      }
    } else {
      // Parse coordinates if entered directly (format: lat,lon)
      const coords = fromAddress.split(",").map((c) => parseFloat(c.trim()));
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        setFromCoords({ lat: coords[0], lon: coords[1] });
      } else {
        alert(
          "Please enter coordinates in format: latitude,longitude (e.g., 43.65,-79.38)"
        );
      }
    }
  };

  const handleToAddressSubmit = () => {
    const coords = toAddress.split(",").map((c) => parseFloat(c.trim()));
    if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
      setToCoords({ lat: coords[0], lon: coords[1] });
    } else {
      alert(
        "Please enter coordinates in format: latitude,longitude (e.g., 43.66,-79.37)"
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Interactive Map</h1>
          <p className="text-gray-600 mt-1">
            View hazards and plan safe routes using OpenStreetMap
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showRoutePanel ? "default" : "outline"}
            onClick={() => setShowRoutePanel(!showRoutePanel)}
          >
            <RouteIcon className="h-4 w-4 mr-2" />
            {showRoutePanel ? "Hide" : "Show"} Route Planner
          </Button>
        </div>
      </div>

      {/* Location Error */}
      {locationError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{locationError}</AlertDescription>
        </Alert>
      )}

      {/* Route Planning Panel */}
      {showRoutePanel && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Route Planner
              </span>
              {route && (
                <Button variant="ghost" size="sm" onClick={handleClearRoute}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Route
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* From Location */}
            <div className="space-y-2">
              <Label>From</Label>
              <div className="flex gap-2">
                <Input
                  value={fromAddress}
                  onChange={(e) => setFromAddress(e.target.value)}
                  placeholder="Current Location or coordinates (lat,lon)"
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleFromAddressSubmit()
                  }
                />
                <Button onClick={handleFromAddressSubmit} variant="outline">
                  Set
                </Button>
              </div>
              {fromCoords && (
                <p className="text-sm text-gray-600">
                  📍 {fromCoords.lat.toFixed(4)}, {fromCoords.lon.toFixed(4)}
                </p>
              )}
            </div>

            {/* To Location */}
            <div className="space-y-2">
              <Label>To</Label>
              <div className="flex gap-2">
                <Input
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  placeholder="Enter destination coordinates (lat,lon)"
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleToAddressSubmit()
                  }
                />
                <Button onClick={handleToAddressSubmit} variant="outline">
                  Set
                </Button>
              </div>
              {toCoords && (
                <p className="text-sm text-gray-600">
                  📍 {toCoords.lat.toFixed(4)}, {toCoords.lon.toFixed(4)}
                </p>
              )}
            </div>

            {/* Route Preference */}
            <div className="space-y-2">
              <Label>Route Preference</Label>
              <Select
                value={routePreference}
                onValueChange={(v: any) => setRoutePreference(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="safe">
                    Safest Route (Recommended)
                  </SelectItem>
                  <SelectItem value="fast">Fastest Route</SelectItem>
                  <SelectItem value="short">Shortest Route</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Calculate Button */}
            <Button
              onClick={handleCalculateRoute}
              disabled={!fromCoords || !toCoords || routeLoading}
              className="w-full"
            >
              {routeLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Navigation className="mr-2 h-4 w-4" />
                  Calculate Safe Route
                </>
              )}
            </Button>

            {/* Route Results */}
            {route && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Route Summary</h3>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Distance</p>
                      <p className="text-lg font-semibold">
                        {formatDistance(route.distanceMeters)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="text-lg font-semibold">
                        {formatDuration(route.durationSeconds)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Risk Level</p>
                      <Badge
                        variant={
                          route.riskScore > 60 ? "destructive" : "secondary"
                        }
                      >
                        {formatRiskScore(route.riskScore).label}
                      </Badge>
                    </div>
                  </div>

                  {route.recommendation && (
                    <Alert>
                      <AlertDescription>
                        {route.recommendation}
                      </AlertDescription>
                    </Alert>
                  )}

                  {route.hazardHotspots && route.hazardHotspots.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">
                        Hazard Hotspots ({route.hazardHotspots.length})
                      </p>
                      <div className="space-y-2">
                        {route.hazardHotspots
                          .slice(0, 3)
                          .map((hotspot, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between text-sm"
                            >
                              <span>
                                {hotspot.hazardType.replace("_", " ")}
                              </span>
                              <Badge variant="destructive">
                                Severity: {hotspot.severity}
                              </Badge>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Map Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Map Controls
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={hazardsLoading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${
                    hazardsLoading ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </Button>
              <Button
                variant={showHazards ? "default" : "outline"}
                size="sm"
                onClick={() => setShowHazards(!showHazards)}
              >
                {showHazards ? "Hide" : "Show"} Hazards
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {locationLoading ? (
            <div className="h-[600px] bg-gray-200 animate-pulse rounded-lg" />
          ) : location ? (
            <MapContainer
              center={[location.lon, location.lat]}
              hazards={showHazards ? hazards : null}
              route={route}
              zoom={13}
            />
          ) : (
            <div className="h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Enable location to view map
                </p>
                <Button onClick={refetch}>
                  <MapPin className="h-4 w-4 mr-2" />
                  Enable Location
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      {showHazards &&
        hazards?.hazardSummary &&
        hazards.hazardSummary.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Hazard Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-500 border-2 border-white shadow" />
                  <span className="text-sm">Low (0-30)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-yellow-500 border-2 border-white shadow" />
                  <span className="text-sm">Moderate (31-60)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-orange-500 border-2 border-white shadow" />
                  <span className="text-sm">High (61-80)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-white shadow" />
                  <span className="text-sm">Extreme (81+)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
