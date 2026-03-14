'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Users, Briefcase, FileText, Receipt, Settings, Gauge, Layout, X } from 'lucide-react';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Gauge },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/brokers', label: 'Brokers', icon: Briefcase },
  { href: '/challans', label: 'Challans', icon: FileText },
  { href: '/invoices', label: 'Invoices', icon: Receipt },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/templates', label: 'Templates', icon: Layout },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`
        fixed md:static inset-y-0 left-0 z-30
        w-64 bg-slate-900 text-white h-screen flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}
    >
      <div className="p-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">KJ ERP</h1>
        <button
          onClick={onClose}
          className="md:hidden text-gray-400 hover:text-white p-1"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 px-3 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
