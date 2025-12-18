// ===== components/map/map-container.tsx (UPDATED) =====
"use client";

import {
  MapContainer as LeafletMapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import { Icon, divIcon } from "leaflet";
import type { HazardResponse, RouteResponse } from "@/lib/types";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons
if (typeof window !== "undefined") {
  delete (Icon.Default.prototype as any)._getIconUrl;
  Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

interface MapContainerProps {
  center: [number, number]; // [lng, lat]
  zoom?: number;
  hazards?: HazardResponse | null;
  route?: RouteResponse | null;
}

function ChangeView({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  map.setView([center[1], center[0]], zoom);
  return null;
}

export default function MapContainerReactLeaflet({
  center,
  zoom = 13,
  hazards,
  route,
}: MapContainerProps) {
  const getUserIcon = () => {
    return divIcon({
      className: "user-location-marker",
      html: `
        <div style="
          width: 24px;
          height: 24px;
          background-color: #0EA5E9;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  const getHazardIcon = (severity: number) => {
    const color = getHazardColor(severity);
    return divIcon({
      className: "hazard-marker",
      html: `
        <div style="
          width: 32px;
          height: 32px;
          background-color: ${color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          color: white;
        ">${severity}</div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16],
    });
  };

  const getHazardColor = (severity: number): string => {
    if (severity <= 30) return "#10B981";
    if (severity <= 60) return "#F59E0B";
    if (severity <= 80) return "#F97316";
    return "#EF4444";
  };

  const getSeverityLabel = (severity: number): string => {
    if (severity <= 30) return "LOW";
    if (severity <= 60) return "MODERATE";
    if (severity <= 80) return "HIGH";
    return "EXTREME";
  };

  const formatHazardType = (type: string): string => {
    return type
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Convert route path to Leaflet format [lat, lon]
  const routePath =
    route?.path?.map((point) => [point.lat, point.lon] as [number, number]) ||
    [];

  // Get route color based on risk score
  const getRouteColor = (riskScore?: number): string => {
    if (!riskScore) return "#3B82F6"; // Blue default
    if (riskScore <= 30) return "#10B981"; // Green
    if (riskScore <= 60) return "#F59E0B"; // Yellow
    if (riskScore <= 80) return "#F97316"; // Orange
    return "#EF4444"; // Red
  };

  return (
    <LeafletMapContainer
      center={[center[1], center[0]]}
      zoom={zoom}
      className="w-full h-[600px] rounded-lg z-0"
      style={{ height: "600px", width: "100%" }}
    >
      <ChangeView center={center} zoom={zoom} />

      {/* OpenStreetMap Tiles - FREE! */}
      <TileLayer
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      {/* Route Polyline */}
      {route && routePath.length > 0 && (
        <Polyline
          positions={routePath}
          pathOptions={{
            color: getRouteColor(route.riskScore),
            weight: 5,
            opacity: 0.7,
          }}
        />
      )}

      {/* Route Start Marker */}
      {route && route.path && route.path.length > 0 && (
        <Marker
          position={[route.path[0].lat, route.path[0].lon]}
          icon={divIcon({
            className: "route-start-marker",
            html: `<div style="
              width: 32px;
              height: 32px;
              background-color: #10B981;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              color: white;
            ">🏁</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          })}
        >
          <Popup>
            <b>Start</b>
          </Popup>
        </Marker>
      )}

      {/* Route End Marker */}
      {route && route.path && route.path.length > 0 && (
        <Marker
          position={[
            route.path[route.path.length - 1].lat,
            route.path[route.path.length - 1].lon,
          ]}
          icon={divIcon({
            className: "route-end-marker",
            html: `<div style="
              width: 32px;
              height: 32px;
              background-color: #EF4444;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              color: white;
            ">🎯</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          })}
        >
          <Popup>
            <b>Destination</b>
          </Popup>
        </Marker>
      )}

      {/* User Location Marker */}
      {!route && (
        <Marker position={[center[1], center[0]]} icon={getUserIcon()}>
          <Popup>
            <b>Your Location</b>
          </Popup>
        </Marker>
      )}

      {/* Hazard Markers */}
      {hazards?.hazardSummary?.map((hazard, index) => (
        <Marker
          key={index}
          position={[hazards.location.lat, hazards.location.lon]}
          icon={getHazardIcon(hazard.severity)}
        >
          <Popup>
            <div style={{ padding: "8px", minWidth: "200px" }}>
              <h3
                style={{
                  margin: "0 0 8px 0",
                  fontWeight: 600,
                  fontSize: "16px",
                }}
              >
                {formatHazardType(hazard.type)}
              </h3>
              <p
                style={{ margin: "0 0 8px 0", color: "#666", fontSize: "14px" }}
              >
                {hazard.description}
              </p>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span style={{ fontWeight: 600, fontSize: "18px" }}>
                  {hazard.severity}
                </span>
                <span
                  style={{
                    backgroundColor: getHazardColor(hazard.severity),
                    color: "white",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  {getSeverityLabel(hazard.severity)}
                </span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Route Hazard Hotspots */}
      {route?.hazardHotspots?.map((hotspot, index) => (
        <Marker
          key={`hotspot-${index}`}
          position={[hotspot.lat, hotspot.lon]}
          icon={divIcon({
            className: "hotspot-marker",
            html: `<div style="
              width: 24px;
              height: 24px;
              background-color: #DC2626;
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              animation: pulse 2s infinite;
            "></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })}
        >
          <Popup>
            <div style={{ padding: "4px" }}>
              <b>Hazard Hotspot</b>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px" }}>
                {hotspot.hazardType}: {hotspot.severity}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </LeafletMapContainer>
  );
}
