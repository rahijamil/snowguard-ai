// ===== app/(dashboard)/settings/page.tsx =====
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { usersApi } from "@/lib/api/users";
import { useAuthStore } from "@/lib/store/auth-store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  User,
  Palette,
  Volume2,
  Type,
  Bell,
  Shield,
  CheckCircle2,
  Loader2,
  AlertCircle,
  LogOut,
  Trash2,
  Download,
} from "lucide-react";
import type { AccessibilityPreferences } from "@/lib/types";
import { formatDate } from "date-fns";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { preferences, updatePreferences } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [localPrefs, setLocalPrefs] =
    useState<AccessibilityPreferences>(preferences);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    setSaveSuccess(false);
    setError(null);

    try {
      await usersApi.updatePreferences(user.id, localPrefs);
      updatePreferences(localPrefs);
      setSaveSuccess(true);

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = JSON.stringify(localPrefs) !== JSON.stringify(preferences);

  const handleExportData = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        id: user?.id,
        email: user?.email,
        name: user?.name,
      },
      preferences: localPrefs,
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `snowguard-data-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-gray-600 mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Success Alert */}
      {saveSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Settings saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>Your account details and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input value={user?.name || ""} disabled className="mt-1" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled className="mt-1" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Active
            </Badge>
            <span className="text-sm text-gray-600">
              Account created on{" "}
              {user?.createdAt
                ? formatDate(new Date(user.createdAt), "MMM dd, yyyy")
                : "N/A"}
            </span>
          </div>
          <Separator />
          <div className="flex gap-2">
            <Button variant="outline" disabled>
              Edit Profile
            </Button>
            <Button variant="outline" disabled>
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Accessibility Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Accessibility Preferences
          </CardTitle>
          <CardDescription>
            Customize your visual and interaction experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Font Size */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Font Size
            </Label>
            <Select
              value={localPrefs.fontSize}
              onValueChange={(value: any) =>
                setLocalPrefs({ ...localPrefs, fontSize: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium (Default)</SelectItem>
                <SelectItem value="large">Large</SelectItem>
                <SelectItem value="xlarge">Extra Large</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600">
              Adjust text size throughout the application for better readability
            </p>
          </div>

          <Separator />

          {/* High Contrast */}
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                High Contrast Mode
              </Label>
              <p className="text-sm text-gray-600">
                Increase color contrast for improved visibility
              </p>
            </div>
            <Switch
              checked={localPrefs.highContrast}
              onCheckedChange={(checked) =>
                setLocalPrefs({ ...localPrefs, highContrast: checked })
              }
            />
          </div>

          <Separator />

          {/* Text-to-Speech */}
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <Label className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Text-to-Speech
              </Label>
              <p className="text-sm text-gray-600">
                Enable audio reading of text content for accessibility
              </p>
            </div>
            <Switch
              checked={localPrefs.ttsEnabled}
              onCheckedChange={(checked) =>
                setLocalPrefs({ ...localPrefs, ttsEnabled: checked })
              }
            />
          </div>

          <Separator />

          {/* Voice Commands */}
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <Label className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                Voice Commands
              </Label>
              <p className="text-sm text-gray-600">
                Control the application using voice input
              </p>
            </div>
            <Switch
              checked={localPrefs.voiceCommands}
              onCheckedChange={(checked) =>
                setLocalPrefs({ ...localPrefs, voiceCommands: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Configure how you receive alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <Label>Hazard Alerts</Label>
              <p className="text-sm text-gray-600">
                Get notified about severe weather conditions
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <Label>Route Updates</Label>
              <p className="text-sm text-gray-600">
                Receive updates about your saved routes
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <Label>AI Assistant Tips</Label>
              <p className="text-sm text-gray-600">
                Get helpful safety tips from the AI assistant
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Security
          </CardTitle>
          <CardDescription>
            Manage your data and security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <Label>Save Chat History</Label>
              <p className="text-sm text-gray-600">
                Store your conversations with the AI assistant
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <Label>Location History</Label>
              <p className="text-sm text-gray-600">
                Save your location data for personalized recommendations
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Data Management</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleExportData}
              >
                <Download className="h-4 w-4 mr-2" />
                Download My Data
              </Button>
              <Button variant="outline" className="flex-1" disabled>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </div>

          <Separator />

          <Button variant="destructive" className="w-full" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* Save Button - Sticky Footer */}
      {hasChanges && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-6 rounded-t-lg shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <p className="text-sm text-gray-600">You have unsaved changes</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setLocalPrefs(preferences)}
                disabled={loading}
              >
                Reset
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
