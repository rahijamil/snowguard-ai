// ===== lib/utils/formatters.ts =====
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export function formatRiskScore(score: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (score <= 30) {
    return {
      label: "Low Risk",
      color: "text-green-600",
      bgColor: "bg-green-100",
    };
  } else if (score <= 60) {
    return {
      label: "Moderate Risk",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    };
  } else if (score <= 80) {
    return {
      label: "High Risk",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    };
  } else {
    return {
      label: "Extreme Risk",
      color: "text-red-600",
      bgColor: "bg-red-100",
    };
  }
}

export function formatSeverity(severity: number): {
  label: string;
  color: string;
} {
  if (severity <= 30) {
    return { label: "Minor", color: "text-green-600" };
  } else if (severity <= 60) {
    return { label: "Moderate", color: "text-yellow-600" };
  } else if (severity <= 80) {
    return { label: "Severe", color: "text-orange-600" };
  } else {
    return { label: "Extreme", color: "text-red-600" };
  }
}

export function formatHazardType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}
