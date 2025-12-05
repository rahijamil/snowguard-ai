// ===== lib/hooks/use-location.ts =====
"use client";

import { useState, useEffect, useCallback } from "react";

interface Location {
  lat: number;
  lon: number;
  accuracy: number;
}

export function useLocation() {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const success = (position: GeolocationPosition) => {
      setLocation({
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
      setLoading(false);
    };

    const errorCallback = (error: GeolocationPositionError) => {
      let errorMessage = "Failed to get location";

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage =
            "Location permission denied. Please enable location access.";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location information unavailable.";
          break;
        case error.TIMEOUT:
          errorMessage = "Location request timed out.";
          break;
      }

      setError(errorMessage);
      setLoading(false);
    };

    navigator.geolocation.getCurrentPosition(success, errorCallback, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000, // Cache for 1 minute
    });
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return {
    location,
    error,
    loading,
    refetch: requestLocation,
  };
}
