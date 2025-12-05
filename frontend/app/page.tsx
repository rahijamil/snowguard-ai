// ===== app/page.tsx =====
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Snowflake,
  MapPin,
  MessageSquare,
  Route,
  Shield,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  Navigation,
  Bot,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Snowflake className="h-8 w-8 text-sky-500" />
              <span className="text-xl font-bold text-gray-900">
                SnowGuard AI
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-sky-500 hover:bg-sky-600">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-200">
            <Sparkles className="h-3 w-3 mr-1" />
            AI-Powered Winter Safety
          </Badge>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
            Navigate Winter
            <br />
            <span className="text-sky-500">Safely & Confidently</span>
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Real-time hazard detection, AI-powered safety guidance, and
            accessible route planning to keep you safe during winter conditions.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-sky-500 hover:bg-sky-600 text-lg px-8"
              >
                Start Free Trial
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Preview */}
        <div className="mt-20 max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-sky-500 to-blue-600 p-8 text-white">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8" />
                <div>
                  <h3 className="text-xl font-semibold">
                    Winter Safety Dashboard
                  </h3>
                  <p className="text-sky-100">
                    Real-time hazard monitoring and AI guidance
                  </p>
                </div>
              </div>
            </div>
            <div className="p-8 bg-gray-50">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      Current Hazards
                    </span>
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">3 Active</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      Route Safety
                    </span>
                    <Route className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">85% Safe</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      AI Assistance
                    </span>
                    <Bot className="h-4 w-4 text-sky-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">24/7</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything You Need for Winter Safety
          </h2>
          <p className="text-xl text-gray-600">
            Powered by AI, designed for accessibility
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="border-2 hover:border-sky-300 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 bg-sky-100 rounded-lg flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-sky-600" />
              </div>
              <CardTitle>Real-Time Hazard Detection</CardTitle>
              <CardDescription>
                Instant alerts for snow, ice, fog, and other winter hazards in
                your area
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-sky-300 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Route className="h-6 w-6 text-indigo-600" />
              </div>
              <CardTitle>Safe Route Planning</CardTitle>
              <CardDescription>
                AI-optimized routes that avoid hazardous areas and prioritize
                your safety
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-sky-300 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>AI Safety Assistant</CardTitle>
              <CardDescription>
                24/7 intelligent guidance for winter navigation and emergency
                situations
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-sky-300 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Interactive Maps</CardTitle>
              <CardDescription>
                Visual hazard overlays with detailed severity levels and
                recommendations
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-sky-300 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>Accessibility First</CardTitle>
              <CardDescription>
                Built-in support for screen readers, voice commands, and
                customizable UI
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-sky-300 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <Navigation className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle>Location Tracking</CardTitle>
              <CardDescription>
                Real-time position updates with privacy controls and offline
                support
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Stay Safe This Winter?
          </h2>
          <p className="text-xl text-sky-100 mb-8">
            Join thousands of users who trust SnowGuard AI for winter navigation
          </p>
          <Link href="/register">
            <Button
              size="lg"
              className="bg-white text-sky-600 hover:bg-gray-100 text-lg px-8"
            >
              Get Started Free
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Snowflake className="h-6 w-6 text-sky-500" />
              <span className="font-semibold text-gray-900">SnowGuard AI</span>
            </div>
            <p className="text-sm text-gray-600">
              © 2025 SnowGuard AI. Built for hackathon by Rahi Jamil.
            </p>
            <div className="flex gap-4">
              <Link
                href="/login"
                className="text-sm text-gray-600 hover:text-sky-500"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-sm text-gray-600 hover:text-sky-500"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
