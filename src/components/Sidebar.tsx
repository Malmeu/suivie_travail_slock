import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, MessageSquare, Users, Briefcase, 
  Calendar, Contact, Settings, Plus, Hash, Lock, ChevronDown, LogOut
} from 'lucide-react';
import type { Profile, Group, Channel } from '../types';
import { MockDatabase } from '../services/db';
import { Avatar } from './Avatar';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  currentUser: Profile;
  onUserChange: (user: Profile) => void;
  activeChannel: Channel | null;
  onChannelChange: (channel: Channel | null) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  currentUser,
  onUserChange,
  activeChannel,
  onChannelChange
}) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Charger les données initiales et s'abonner aux mises à jour
  useEffect(() => {
    const loadData = () => {
      setProfiles(MockDatabase.getProfiles());
      setGroups(MockDatabase.getGroups());
      setChannels(MockDatabase.getChannels());
      setUnreadCount(MockDatabase.getNotifications(currentUser.id).filter(n => !n.is_read).length);
    };

    loadData();

    // S'abonner aux notifications, groupes, canaux et messages
    const handleGroupsUpdate = () => setGroups(MockDatabase.getGroups());
    const handleChannelsUpdate = () => setChannels(MockDatabase.getChannels());
    const handleNotifUpdate = () => {
      setUnreadCount(MockDatabase.getNotifications(currentUser.id).filter(n => !n.is_read).length);
    };

    window.addEventListener('slock_update_groups', handleGroupsUpdate);
    window.addEventListener('slock_update_channels', handleChannelsUpdate);
    window.addEventListener('slock_update_notifications', handleNotifUpdate);

    return () => {
      window.removeEventListener('slock_update_groups', handleGroupsUpdate);
      window.removeEventListener('slock_update_channels', handleChannelsUpdate);
      window.removeEventListener('slock_update_notifications', handleNotifUpdate);
    };
  }, [currentUser]);

  const selectUser = (user: Profile) => {
    onUserChange(user);
    setShowUserSwitcher(false);
    // Rafraîchir les notifications pour le nouvel utilisateur
    setUnreadCount(MockDatabase.getNotifications(user.id).filter(n => !n.is_read).length);
  };

  const getRoleBadgeLabel = (role: string) => {
    switch(role) {
      case 'admin': return 'Admin';
      case 'director': return 'Direction';
      case 'project_manager': return 'Chef Projet';
      case 'service_head': return 'Chef Service';
      case 'collaborator': return 'Agent';
      case 'architecte': return 'Architecte';
      case 'dev_web': return 'Dev Web';
      case 'designer_3d': return 'Designer 3D';
      case 'genie_civil': return 'Génie Civil';
      case 'directeur_technique': return 'Dir. Tech.';
      case 'logistique': return 'Logistique';
      default: return 'Observateur';
    }
  };

  const handleChannelClick = (chan: Channel) => {
    onChannelChange(chan);
    onTabChange('messages');
  };

  return (
    <aside className="sidebar">
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">S</div>
        <div className="sidebar-title">Slock Hospitalier</div>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-group-title">Menu Principal</div>
        
        <div 
          className={`sidebar-item ${currentTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => { onTabChange('dashboard'); onChannelChange(null); }}
        >
          <LayoutDashboard size={16} />
          <span>Tableau de bord</span>
        </div>

        <div 
          className={`sidebar-item ${currentTab === 'messages' && !activeChannel ? 'active' : ''}`}
          onClick={() => { onTabChange('messages'); onChannelChange(null); }}
        >
          <MessageSquare size={16} />
          <span>Messagerie</span>
        </div>

        <div 
          className={`sidebar-item ${currentTab === 'groups' ? 'active' : ''}`}
          onClick={() => { onTabChange('groups'); onChannelChange(null); }}
        >
          <Users size={16} />
          <span>Groupes de travail</span>
        </div>

        <div 
          className={`sidebar-item ${currentTab === 'projects' ? 'active' : ''}`}
          onClick={() => { onTabChange('projects'); onChannelChange(null); }}
        >
          <Briefcase size={16} />
          <span>Suivi de projets</span>
        </div>

        <div 
          className={`sidebar-item ${currentTab === 'meetings' ? 'active' : ''}`}
          onClick={() => { onTabChange('meetings'); onChannelChange(null); }}
        >
          <Calendar size={16} />
          <span>Réunions & PV</span>
        </div>

        <div 
          className={`sidebar-item ${currentTab === 'directory' ? 'active' : ''}`}
          onClick={() => { onTabChange('directory'); onChannelChange(null); }}
        >
          <Contact size={16} />
          <span>Annuaire</span>
        </div>

        {currentUser.role === 'admin' && (
          <div 
            className={`sidebar-item ${currentTab === 'admin' ? 'active' : ''}`}
            onClick={() => { onTabChange('admin'); onChannelChange(null); }}
          >
            <Settings size={16} />
            <span>Administration</span>
          </div>
        )}

        {/* Channels Section */}
        <div className="sidebar-group-title">Canaux récents</div>
        {channels.map(chan => {
          const isChanActive = activeChannel?.id === chan.id;
          return (
            <div 
              key={chan.id}
              className={`sidebar-item ${isChanActive ? 'active' : ''}`}
              style={{ paddingLeft: '20px' }}
              onClick={() => handleChannelClick(chan)}
            >
              {chan.is_private ? <Lock size={13} style={{ opacity: 0.7 }} /> : <Hash size={13} style={{ opacity: 0.7 }} />}
              <span>{chan.name}</span>
            </div>
          );
        })}
      </nav>

      {/* Sidebar Footer with Role/User Switcher */}
      <div className="sidebar-footer" style={{ position: 'relative' }}>
        <div 
          className="user-profile-widget" 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            padding: '8px 10px',
            borderRadius: '12px',
            backgroundColor: showUserSwitcher ? 'rgba(0,0,0,0.06)' : 'transparent',
            width: '100%',
            transition: 'background-color 0.2s'
          }}
          onClick={() => setShowUserSwitcher(!showUserSwitcher)}
        >
          <div 
            className="user-avatar"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#007AFF',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '12px',
              boxShadow: '0 2px 5px rgba(0, 122, 255, 0.2)',
              overflow: 'hidden'
            }}
          >
            <Avatar avatarUrl={currentUser.avatar_url} fallbackText={currentUser.first_name[0]} size="100%" fontSize="12px" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#1D1D1F', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser.first_name} {currentUser.last_name}
            </span>
            <span style={{ fontSize: '10px', color: '#86868B', fontWeight: 500 }}>
              {getRoleBadgeLabel(currentUser.role)}
            </span>
          </div>
          <ChevronDown size={14} style={{ color: '#86868B' }} />
        </div>

        {/* User Switcher Dropdown (Apple-style absolute menu) */}
        {showUserSwitcher && (
          <div 
            className="user-switcher-dropdown"
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '0',
              right: '0',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '16px',
              boxShadow: '0 -10px 30px rgba(0,0,0,0.08), 0 5px 15px rgba(0,0,0,0.05)',
              padding: '8px',
              marginBottom: '10px',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#86868B', padding: '6px 10px', borderBottom: '1px solid rgba(0,0,0,0.05)', marginBottom: '4px' }}>
              Changer de Profil (Test)
            </div>
            
            {profiles.map(u => (
              <div 
                key={u.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 8px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '11.5px',
                  fontWeight: u.id === currentUser.id ? 600 : 500,
                  backgroundColor: u.id === currentUser.id ? 'var(--color-primary-light)' : 'transparent',
                  color: u.id === currentUser.id ? 'var(--color-primary)' : '#1D1D1F',
                  transition: 'background-color 0.15s'
                }}
                className="switcher-item"
                onClick={() => selectUser(u)}
              >
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#007AFF', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, overflow: 'hidden' }}>
                  <Avatar avatarUrl={u.avatar_url} fallbackText={u.first_name[0]} size="100%" fontSize="9px" />
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.first_name} {u.last_name}</div>
                  <div style={{ fontSize: '8.5px', opacity: 0.8 }}>{getRoleBadgeLabel(u.role)} • {u.status_message}</div>
                </div>
              </div>
            ))}
            <div style={{ height: '1px', backgroundColor: 'rgba(0,0,0,0.06)', margin: '4px 0' }}></div>
            <button 
              onClick={() => {
                MockDatabase.logout();
                setShowUserSwitcher(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '11.5px',
                fontWeight: 600,
                border: 'none',
                width: '100%',
                backgroundColor: 'rgba(255, 59, 48, 0.08)',
                color: 'var(--color-danger)',
                transition: 'background-color 0.15s',
                textAlign: 'left'
              }}
              className="logout-btn"
            >
              <LogOut size={12} />
              <span>Se déconnecter</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
