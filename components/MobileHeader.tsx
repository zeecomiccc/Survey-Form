'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Users, LogOut, ArrowLeft } from 'lucide-react';
import CompanyLogo from './CompanyLogo';

interface MobileHeaderProps {
  currentUser?: {
    name: string;
    role?: string;
  } | null;
  onLogout: () => void;
  showBackButton?: boolean;
  backButtonLabel?: string;
  backButtonHref?: string;
}

export default function MobileHeader({
  currentUser,
  onLogout,
  showBackButton = false,
  backButtonLabel = 'Back',
  backButtonHref = '/',
}: MobileHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo or Back Button */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {showBackButton && (
              <Link
                href={backButtonHref}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm md:text-base flex-shrink-0"
              >
                <ArrowLeft size={20} />
                <span className="hidden sm:inline">{backButtonLabel}</span>
                <span className="sm:hidden">Back</span>
              </Link>
            )}
            {!showBackButton && <CompanyLogo />}
          </div>

          {/* Desktop Menu */}
          {currentUser && (
            <div className="hidden md:flex items-center gap-3 lg:gap-4">
              <span className="text-gray-700 text-sm">Welcome, {currentUser.name}</span>
              {currentUser.role === 'admin' && (
                <Link
                  href="/users"
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Users size={18} />
                  Manage Users
                </Link>
              )}
              <button
                onClick={onLogout}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 text-sm"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          )}

          {/* Mobile Menu Button - Always show if user exists */}
          {currentUser && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 ml-2"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && currentUser && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4 space-y-2 animate-in slide-in-from-top duration-200">
            <div className="px-2 py-2 text-sm text-gray-700 font-medium">
              Welcome, {currentUser.name}
            </div>
            {currentUser.role === 'admin' && (
              <Link
                href="/users"
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 text-sm transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Users size={18} />
                Manage Users
              </Link>
            )}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 text-sm transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

