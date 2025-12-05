import Navbar from "@/components/shared/navbar";
import Sidebar from "@/components/shared/sidebar";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-gray-50">
  //       <div className="text-center">
  //         <Loader2 className="h-8 w-8 animate-spin text-sky-500 mx-auto mb-4" />
  //         <p className="text-gray-600">Loading...</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 ml-64">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
