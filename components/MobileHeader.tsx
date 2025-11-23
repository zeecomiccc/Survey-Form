'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Users, LogOut, ArrowLeft, FileText, User, ChevronDown, Shield } from 'lucide-react';
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

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

          {/* Desktop Menu - User Dropdown */}
          {currentUser && (
            <div className="hidden md:flex items-center">
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden lg:inline">{currentUser.name}</span>
                  </div>
                  <ChevronDown size={16} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{currentUser.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {currentUser.role === 'admin' ? 'Administrator' : 'User'}
                      </p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User size={18} className="text-gray-500" />
                        Profile Settings
                      </Link>
                      
                      {currentUser.role === 'admin' && (
                        <>
                          <div className="border-t border-gray-100 my-1"></div>
                          <div className="px-4 py-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</p>
                          </div>
                          <Link
                            href="/users"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Users size={18} className="text-gray-500" />
                            Manage Users
                          </Link>
                          <Link
                            href="/templates"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <FileText size={18} className="text-gray-500" />
                            Templates
                          </Link>
                        </>
                      )}
                      
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={18} />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4 space-y-1 animate-in slide-in-from-top duration-200">
            {/* User Info Card */}
            <div className="px-3 py-3 bg-gray-50 rounded-lg mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{currentUser.name}</p>
                  <p className="text-xs text-gray-500">
                    {currentUser.role === 'admin' ? (
                      <span className="flex items-center gap-1">
                        <Shield size={12} />
                        Administrator
                      </span>
                    ) : (
                      'User'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <Link
              href="/profile"
              className="flex items-center gap-3 text-gray-700 hover:text-gray-900 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <User size={18} className="text-gray-500" />
              Profile Settings
            </Link>
            
            {currentUser.role === 'admin' && (
              <>
                <div className="px-3 py-1.5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin Tools</p>
                </div>
                <Link
                  href="/users"
                  className="flex items-center gap-3 text-gray-700 hover:text-gray-900 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Users size={18} className="text-gray-500" />
                  Manage Users
                </Link>
                <Link
                  href="/templates"
                  className="flex items-center gap-3 text-gray-700 hover:text-gray-900 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <FileText size={18} className="text-gray-500" />
                  Templates
                </Link>
              </>
            )}
            
            <div className="border-t border-gray-200 my-1"></div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-3 text-red-600 hover:bg-red-50 px-3 py-2.5 rounded-lg text-sm transition-colors"
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

