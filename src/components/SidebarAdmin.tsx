'use client';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, FileText, Tag, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [userData, setUserData] = useState({ initial: '', username: '', role: '' });
  const [loading, setLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setUserData({
      initial: localStorage.getItem('username')?.charAt(0).toUpperCase() || '',
      username: localStorage.getItem('username') || '',
      role: localStorage.getItem('role') || ''
    });
  }, []);

  const handleLogout = () => {
    setLogoutLoading(true);
    setTimeout(() => {
      localStorage.clear();
      router.push('/login');
      setLogoutLoading(false);
    }, 400); // animasi 400ms
  };

  const navItems = [
    { href: '/admin/articles', label: 'Artikel', icon: <FileText className="h-5 w-5" /> },
    { href: '/admin/categories', label: 'Kategori', icon: <Tag className="h-5 w-5" /> },
  ];

  // Navigasi dengan animasi loading
  const handleNav = (href: string) => {
    if (pathname.startsWith(href)) return;
    setLoading(true);
    setTimeout(() => {
      router.push(href);
      setLoading(false);
      onClose();
    }, 400);
  };

  const isAnyLoading = loading || logoutLoading;

  return (
    <>
      {/* Overlay untuk mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={onClose} />
      )}

      {/* Loading Overlay saat navigasi atau logout */}
      {isAnyLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        </div>
      )}

      <div
        id="admin-sidebar"
        className={cn(
          'fixed inset-y-0 left-0 w-64 bg-gray-800 text-white z-40',
          'transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Toggle Button di dalam sidebar */}
        <button
          onClick={onClose}
          className="absolute left-4 top-4 p-1 rounded-md text-gray-300 hover:text-white hover:bg-gray-700"
          aria-label="Close Sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="flex items-center justify-center h-16 border-b border-gray-700">
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => handleNav(item.href)}
              className={cn(
                'w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition',
                pathname.startsWith(item.href)
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              )}
              style={{ textAlign: 'left' }}
              disabled={isAnyLoading}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center text-white">
                {userData.initial}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{userData.username}</p>
                <p className="text-xs text-gray-300">{userData.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1 rounded-md hover:bg-gray-700"
              title="Logout"
              disabled={isAnyLoading}
            >
              {logoutLoading ? (
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <LogOut className="h-5 w-5 text-gray-300 hover:text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}