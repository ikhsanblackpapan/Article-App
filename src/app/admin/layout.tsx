"use client";
import SidebarAdmin from "@/components/SidebarAdmin";
import SidebarToggle from "@/components/SidebarToggle";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarAdmin
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header/Navbar */}
        <header className="bg-white shadow-sm sticky top-0 z-20">
          <div className="flex items-center h-16 px-4">
            {!isSidebarOpen && (
              <SidebarToggle
                onClick={() => setIsSidebarOpen(true)}
                // className="md:hidden"
              />
            )}
            <div className="ml-auto">{/* Navbar content */}</div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 bg-white md:bg-transparent md:mt-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
