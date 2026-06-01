import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Check, Calendar, CheckSquare, MessageSquare, AlertCircle } from 'lucide-react';
import type { Profile, AppNotification } from '../types';
import { MockDatabase } from '../services/db';
import { Avatar } from './Avatar';

interface HeaderProps {
  currentTab: string;
  currentUser: Profile;
  onTabChange: (tab: string) => void;
  activeChannelName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  currentUser,
  onTabChange,
  activeChannelName
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadNotifs = () => {
      setNotifications(MockDatabase.getNotifications(currentUser.id));
    };

    loadNotifs();

    // S'abonner aux notifications
    const handleNotifUpdate = () => {
      setNotifications(MockDatabase.getNotifications(currentUser.id));
    };

    window.addEventListener('slock_update_notifications', handleNotifUpdate);

    // Clic en dehors pour fermer les popovers
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('slock_update_notifications', handleNotifUpdate);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [currentUser]);

  // Rechercher en temps réel
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const results = MockDatabase.searchGlobal(searchQuery);
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery]);

  const handleSearchResultClick = (result: any) => {
    setShowSearchResults(false);
    setSearchQuery('');
    
    // Rediriger selon le type
    if (result.type === 'profile') {
      onTabChange('directory');
    } else if (result.type === 'project' || result.type === 'task') {
      onTabChange('projects');
    } else if (result.type === 'meeting') {
      onTabChange('meetings');
    } else if (result.type === 'message') {
      onTabChange('messages');
    }
  };

  const handleNotifClick = (notif: AppNotification) => {
    // Marquer comme lu
    const all = localStorage.getItem('slock_notifications');
    if (all) {
      const parsed: AppNotification[] = JSON.parse(all);
      const target = parsed.find(n => n.id === notif.id);
      if (target) {
        target.is_read = true;
        localStorage.setItem('slock_notifications', JSON.stringify(parsed));
        window.dispatchEvent(new CustomEvent('slock_update_notifications'));
      }
    }
    
    // Fermer et rediriger
    setShowNotifications(false);
    
    if (notif.link_to === '#projects') {
      onTabChange('projects');
    } else if (notif.link_to === '#messages') {
      onTabChange('messages');
    } else if (notif.link_to === '#meetings') {
      onTabChange('meetings');
    }
  };

  const markAllAsRead = () => {
    const all = localStorage.getItem('slock_notifications');
    if (all) {
      const parsed: AppNotification[] = JSON.parse(all);
      parsed.forEach(n => {
        if (n.user_id === currentUser.id) n.is_read = true;
      });
      localStorage.setItem('slock_notifications', JSON.stringify(parsed));
      window.dispatchEvent(new CustomEvent('slock_update_notifications'));
    }
  };

  const getPageTitle = () => {
    if (activeChannelName) {
      return `# ${activeChannelName}`;
    }
    switch (currentTab) {
      case 'dashboard': return 'Accueil';
      case 'messages': return 'Messages Directs';
      case 'groups': return 'Groupes de Travail';
      case 'projects': return 'Pilotage de Projets';
      case 'meetings': return 'Réunions & Procès-Verbaux';
      case 'directory': return 'Annuaire Hospitalier';
      case 'admin': return 'Administration Rôles';
      default: return 'Slock';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'task_assign':
      case 'task_due':
      case 'task_overdue':
        return <CheckSquare size={14} style={{ color: 'var(--color-warning)' }} />;
      case 'meeting_invite':
      case 'minutes_validated':
        return <Calendar size={14} style={{ color: 'var(--color-primary)' }} />;
      case 'mention':
      case 'message':
        return <MessageSquare size={14} style={{ color: 'var(--color-success)' }} />;
      default:
        return <AlertCircle size={14} style={{ color: 'var(--color-info)' }} />;
    }
  };

  return (
    <header className="app-header">
      {/* Title */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--color-text-main)' }}>
          {getPageTitle()}
        </h2>
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 500, marginTop: '2px' }}>
          Service : {currentUser.department_id === 'dep_cardio' ? 'Cardiologie' : currentUser.department_id === 'dep_urgences' ? 'Urgences' : currentUser.department_id === 'dep_tech' ? 'Services Techniques' : 'Administration'}
        </span>
      </div>

      {/* Global Search */}
      <div className="header-search" ref={searchRef}>
        <Search size={14} className="header-search-icon" />
        <input 
          type="text" 
          placeholder="Rechercher dossiers, tâches, messages..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery.trim().length >= 2 && setShowSearchResults(true)}
        />

        {/* Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div 
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-lg)',
              marginTop: '6px',
              padding: '6px',
              zIndex: 100,
              maxHeight: '300px',
              overflowY: 'auto'
            }}
          >
            {searchResults.map((res, i) => (
              <div 
                key={i}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12.5px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  transition: 'background-color 0.15s'
                }}
                className="search-result-item"
                onClick={() => handleSearchResultClick(res)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{res.title}</span>
                  <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', padding: '1px 5px', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.05)', color: 'var(--color-text-muted)' }}>
                    {res.type}
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{res.subtitle}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Header Actions */}
      <div className="header-actions">
        {/* Notifications Hub */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button className="header-btn" onClick={() => setShowNotifications(!showNotifications)}>
            <Bell size={18} />
            {unreadCount > 0 && <span className="header-btn-badge" />}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div 
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(0,0,0,0.1)',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-lg)',
                marginTop: '10px',
                width: '320px',
                zIndex: 100,
                padding: '12px 0',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px 8px 16px', borderBottom: '1px solid rgba(0,0,0,0.05)', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1D1D1F' }}>Centre d'alertes</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Check size={12} /> Tout marquer lu
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                    Aucune alerte pour le moment
                  </div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id}
                      style={{
                        padding: '10px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: '10px',
                        backgroundColor: n.is_read ? 'transparent' : 'var(--color-primary-light)',
                        transition: 'background-color 0.15s',
                        borderBottom: '1px solid rgba(0,0,0,0.02)'
                      }}
                      onClick={() => handleNotifClick(n)}
                    >
                      <div style={{ marginTop: '2px' }}>{getNotifIcon(n.type)}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                        <span style={{ fontSize: '12px', fontWeight: n.is_read ? 500 : 700, color: 'var(--color-text-main)' }}>{n.title}</span>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>{n.content}</span>
                        <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          {new Date(n.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Current user mini identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div 
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '11.5px',
              overflow: 'hidden'
            }}
          >
            <Avatar avatarUrl={currentUser.avatar_url} fallbackText={currentUser.first_name[0]} size="100%" fontSize="11.5px" />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-main)' }}>
            {currentUser.first_name}
          </span>
        </div>
      </div>
    </header>
  );
};
