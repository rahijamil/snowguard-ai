// ===== app/(dashboard)/map/page.tsx =====
"use client";

import { useEffect, useState } from "react";
import { useLocation } from "@/lib/hooks/use-location";
import { useHazards } from "@/lib/hooks/use-hazards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MapPin,
  Layers,
  Navigation,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import map to avoid SSR issues with Leaflet
const MapContainer = dynamic(() => import("@/components/map/map-container"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
      <p className="text-gray-600">Loading map...</p>
    </div>
  ),
});

export default function MapPage() {
  const {
    location,
    loading: locationLoading,
    error: locationError,
    refetch,
  } = useLocation();
  const { hazards, fetchHazards, loading: hazardsLoading } = useHazards();
  const [showHazards, setShowHazards] = useState(true);

  useEffect(() => {
    if (location) {
      fetchHazards(location.lat, location.lon, 10); // 10km radius
    }
  }, [location, fetchHazards]);

  const handleRefresh = () => {
    if (location) {
      fetchHazards(location.lat, location.lon, 10);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Interactive Map</h1>
        <p className="text-gray-600 mt-1">
          View hazards using OpenStreetMap - Free and open source!
        </p>
      </div>

      {/* Location Error */}
      {locationError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{locationError}</AlertDescription>
        </Alert>
      )}

      {/* Info Banner */}
      <Alert>
        <MapPin className="h-4 w-4" />
        <AlertDescription>
          <strong>Using OpenStreetMap:</strong> Free and open-source maps. No
          credit card or API key required!
        </AlertDescription>
      </Alert>

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
                  <div className="w-6 h-6 rounded-full bg-green-500 border-2 border-white shadow flex items-center justify-center text-white text-xs font-bold">
                    25
                  </div>
                  <span className="text-sm">Low (0-30)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-yellow-500 border-2 border-white shadow flex items-center justify-center text-white text-xs font-bold">
                    50
                  </div>
                  <span className="text-sm">Moderate (31-60)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-orange-500 border-2 border-white shadow flex items-center justify-center text-white text-xs font-bold">
                    75
                  </div>
                  <span className="text-sm">High (61-80)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-white shadow flex items-center justify-center text-white text-xs font-bold">
                    95
                  </div>
                  <span className="text-sm">Extreme (81+)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Map Info */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-gray-600">
            <strong>Map Provider:</strong> OpenStreetMap
            <br />
            <strong>Routing:</strong> OpenRouteService (configured in backend)
            <br />
            <strong>Cost:</strong> Free and open source - No credit card
            required!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
