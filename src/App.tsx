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
