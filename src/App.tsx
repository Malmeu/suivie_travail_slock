import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './views/Dashboard';
import { Chat } from './components/Chat';
import { Groups } from './views/Groups';
import { Projects } from './views/Projects';
import { Meetings } from './views/Meetings';
import { Directory } from './views/Directory';
import { Admin } from './views/Admin';
import type { Profile, Channel } from './types';
import { MockDatabase } from './services/db';
import { Auth } from './views/Auth';
import { supabase, toLocalDeptId } from './services/supabase';

function App() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [initializing, setInitializing] = useState<boolean>(true);

  // Charger l'utilisateur actuel
  useEffect(() => {
    setCurrentUser(MockDatabase.getCurrentUser());
    setInitializing(false);

    const handleUserChanged = (e: Event) => {
      const customEvent = e as CustomEvent<Profile | null>;
      setCurrentUser(customEvent.detail);
    };

    window.addEventListener('slock_user_changed', handleUserChanged);
    return () => {
      window.removeEventListener('slock_user_changed', handleUserChanged);
    };
  }, []);

  // Synchronisation en temps réel avec Supabase au démarrage (WOW factor)
  useEffect(() => {
    const syncDatabaseFromSupabase = async () => {
      try {
        if (supabase) {
          const client = supabase;
          console.log("Slock: Supabase cloud détecté. Lancement de la synchronisation en tâche de fond...");
          
          // 1. Récupérer et synchroniser les Profils hospitaliers
          const { data: remoteProfiles, error: profError } = await client
            .from('profiles')
            .select('*');

          if (!profError && remoteProfiles) {
            const mappedProfiles: Profile[] = remoteProfiles.map(p => ({
              id: p.id,
              first_name: p.first_name,
              last_name: p.last_name,
              email: p.email,
              role: p.role,
              avatar_url: p.avatar_url || `https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=100`,
              phone: p.phone || "+33 6 00 00 00 00",
              status: (p.status === 'active' ? 'available' : p.status) || 'available',
              status_message: p.status_message || 'Disponible',
              department_id: toLocalDeptId(p.department_id) || 'dep_cardio',
              created_at: p.created_at || new Date().toISOString()
            }));
            
            MockDatabase.save('profiles', mappedProfiles);
            console.log(`Slock: ${mappedProfiles.length} profils cliniques synchronisés depuis Supabase.`);
          }

          // 2. Récupérer et synchroniser les Groupes
          const { data: remoteGroups, error: grpError } = await client
            .from('groups')
            .select('*');

          if (!grpError && remoteGroups) {
            const groupsWithMembers = await Promise.all(remoteGroups.map(async (g) => {
              const { data: members, error: memErr } = await client
                .from('group_members')
                .select('profile_id')
                .eq('group_id', g.id);
              
              const memberIds = !memErr && members ? members.map(m => m.profile_id) : [];
              
              return {
                id: g.id,
                name: g.name,
                description: g.description || '',
                type: g.type,
                owner_id: g.owner_id,
                created_at: g.created_at || new Date().toISOString(),
                member_ids: memberIds
              };
            }));

            MockDatabase.save('groups', groupsWithMembers);
            console.log(`Slock: ${groupsWithMembers.length} groupes synchronisés depuis Supabase.`);
          }

          // 3. Récupérer et synchroniser les Canaux
          const { data: remoteChannels, error: chanError } = await client
            .from('channels')
            .select('*');

          if (!chanError && remoteChannels) {
            const channelsWithMembers = await Promise.all(remoteChannels.map(async (c) => {
              const { data: members, error: memErr } = await client
                .from('channel_members')
                .select('profile_id')
                .eq('channel_id', c.id);
              
              const memberIds = !memErr && members ? members.map(m => m.profile_id) : [];
              
              return {
                id: c.id,
                group_id: c.group_id || undefined,
                name: c.name,
                description: c.description || '',
                is_private: c.is_private || false,
                owner_id: c.owner_id,
                created_at: c.created_at || new Date().toISOString(),
                member_ids: memberIds
              };
            }));

            MockDatabase.save('channels', channelsWithMembers);
            console.log(`Slock: ${channelsWithMembers.length} canaux synchronisés depuis Supabase.`);
          }
        }
      } catch (err) {
        console.warn("Slock: Erreur de synchronisation Supabase au démarrage (mode local actif) :", err);
      }
    };

    syncDatabaseFromSupabase();
  }, [currentUser]);

  const handleUserChange = (user: Profile | null) => {
    MockDatabase.setCurrentUser(user);
    setCurrentUser(user);
    // Si l'utilisateur n'est pas admin et qu'on était sur l'onglet admin, le renvoyer vers l'accueil
    if (user && user.role !== 'admin' && currentTab === 'admin') {
      setCurrentTab('dashboard');
    }
  };

  const renderView = () => {
    if (!currentUser) return null;

    // Si on clique sur un canal dans la sidebar, on affiche le chat en priorité
    if (activeChannel) {
      return <Chat currentUser={currentUser} activeChannel={activeChannel} />;
    }

    switch (currentTab) {
      case 'dashboard':
        return (
          <Dashboard 
            currentUser={currentUser} 
            onTabChange={(tab) => { setCurrentTab(tab); setActiveChannel(null); }}
            onChannelChange={(chan) => setActiveChannel(chan)}
          />
        );
      case 'messages':
        return <Chat currentUser={currentUser} activeChannel={null} />;
      case 'groups':
        return <Groups currentUser={currentUser} />;
      case 'projects':
        return <Projects currentUser={currentUser} />;
      case 'meetings':
        return <Meetings currentUser={currentUser} />;
      case 'directory':
        return <Directory currentUser={currentUser} onUserChange={handleUserChange} />;
      case 'admin':
        return currentUser.role === 'admin' ? (
          <Admin currentUser={currentUser} onUserChange={handleUserChange} />
        ) : (
          <Dashboard 
            currentUser={currentUser} 
            onTabChange={(tab) => { setCurrentTab(tab); setActiveChannel(null); }}
            onChannelChange={(chan) => setActiveChannel(chan)}
          />
        );
      default:
        return (
          <Dashboard 
            currentUser={currentUser} 
            onTabChange={(tab) => { setCurrentTab(tab); setActiveChannel(null); }}
            onChannelChange={(chan) => setActiveChannel(chan)}
          />
        );
    }
  };

  if (initializing) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', backgroundColor: '#F4F6F9' }}>
        <div style={{ fontSize: '14px', color: '#86868B', fontWeight: 600 }}>Initialisation du portail clinique...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <Auth onAuthSuccess={handleUserChange} />;
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar 
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        currentUser={currentUser}
        onUserChange={handleUserChange}
        activeChannel={activeChannel}
        onChannelChange={setActiveChannel}
      />

      {/* Main Panel Content */}
      <main className="main-content">
        <Header 
          currentTab={currentTab} 
          currentUser={currentUser}
          onTabChange={(tab) => { setCurrentTab(tab); setActiveChannel(null); }}
          activeChannelName={activeChannel?.name}
        />
        
        {renderView()}
      </main>
    </div>
  );
}

export default App;
