import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/appStore';
import { Users } from 'lucide-react';
interface ActiveUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  online_at: string;
}

export const ActiveUsersDropdown: React.FC = () => {
  const { user } = useAppStore();
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const usersMap = new Map<string, ActiveUser>();
        
        Object.keys(state).forEach((key) => {
          state[key].forEach((presence: any) => {
            if (presence.user) {
              usersMap.set(presence.user.id, presence.user);
            }
          });
        });
        
        setActiveUsers(Array.from(usersMap.values()));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user: {
              id: user.id,
              email: user.email,
              full_name: user.full_name,
              role: user.role,
              online_at: new Date().toISOString(),
            }
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative group"
        title="Active Users"
      >
        <Users className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
        {activeUsers.length > 0 && (
          <span className="absolute top-1 right-0 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-white dark:border-[#0B151B]"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#0B151B] border border-slate-200 dark:border-slate-800 rounded-md shadow-lg z-50 overflow-hidden flex flex-col">
            <div className="p-3 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50 dark:bg-[#131d22]">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Currently Active ({activeUsers.length})
              </div>
            </div>
            <div className="overflow-y-auto max-h-[300px]">
              {activeUsers.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-slate-500 font-medium">
                  No other users online
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {activeUsers.map((u) => (
                    <div key={u.id} className="p-3 flex items-center space-x-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate">
                          {u.full_name || u.email}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize truncate font-medium">
                          {u.role?.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
