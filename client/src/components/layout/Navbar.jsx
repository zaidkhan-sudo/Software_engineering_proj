import React from 'react';
import { Landmark, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import NotificationBell from './NotificationBell';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Brand & Context */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-md bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600">
          <Landmark className="w-4 h-4" />
        </div>
        <div>
          <span className="text-sm font-semibold text-slate-900 block leading-tight">
            Municipal Grievance System
          </span>
          <span className="text-xs text-slate-500 block">
            {user?.role === 'admin'
              ? 'Administration Console'
              : user?.role === 'officer'
              ? `Departmental Desk ${user?.department?.name ? `(${user.department.name})` : ''}`
              : 'Citizen Redressal Portal'}
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-4">
        {/* Real-time Notification Bell Popover */}
        <NotificationBell />

        <div className="h-5 w-px bg-slate-200 hidden sm:block" />

        {/* User Badge & Profile */}
        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-slate-800 leading-tight">
              {user?.name || 'Authorized User'}
            </div>
            <div className="text-xs text-slate-500 capitalize">
              {user?.role || 'Citizen'}
            </div>
          </div>

          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <UserIcon className="w-4 h-4" />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            iconLeft={LogOut}
            className="text-slate-600 hover:text-rose-600"
          >
            <span className="hidden md:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
