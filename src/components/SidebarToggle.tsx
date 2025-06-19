"use client";
import { Menu } from "lucide-react";

export default function SidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none z-50"
      aria-label="Toggle Sidebar"
    >
      <Menu className="h-6 w-6" />
    </button>
  );
}
