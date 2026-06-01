import React, { useState, useEffect } from 'react';
import { 
  Bell, Calendar, CheckSquare, MessageSquare, AlertTriangle, 
  ArrowRight, Shield, Award, ClipboardCheck, ArrowUpRight
} from 'lucide-react';
import type { Profile, Task, Meeting, MeetingDecision, AppNotification } from '../types';
import { MockDatabase } from '../services/db';

interface DashboardProps {
  currentUser: Profile;
  onTabChange: (tab: string) => void;
  onChannelChange: (chan: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  onTabChange,
  onChannelChange
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [decisions, setDecisions] = useState<MeetingDecision[]>([]);
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [urgentAlerts, setUrgentAlerts] = useState<any[]>([]);

  useEffect(() => {
    const loadDashboardData = () => {
      setTasks(MockDatabase.getTasks());
      setMeetings(MockDatabase.getMeetings());
      setDecisions(MockDatabase.getDecisions().slice(0, 4)); // top 4 decisions
      setNotifs(MockDatabase.getNotifications(currentUser.id).filter(n => !n.is_read));
      
      // Compter les messages non lus simulés
      const allMsgs = MockDatabase.getMessages();
      const unread = allMsgs.filter(m => m.sender_id !== currentUser.id && (!m.read_by || !m.read_by.includes(currentUser.id)));
      setUnreadMsgCount(unread.length);

      // Récupérer les alertes urgentes
      const urgents = allMsgs.filter(m => m.type === 'urgent');
      setUrgentAlerts(urgents);
    };

    loadDashboardData();

    // S'abonner aux mises à jour
    const handleTasksUpdate = () => setTasks(MockDatabase.getTasks());
    const handleMeetingsUpdate = () => setMeetings(MockDatabase.getMeetings());
    const handleNotifUpdate = () => setNotifs(MockDatabase.getNotifications(currentUser.id).filter(n => !n.is_read));
    const handleMessagesUpdate = () => {
      const allMsgs = MockDatabase.getMessages();
      const urgents = allMsgs.filter(m => m.type === 'urgent');
      setUrgentAlerts(urgents);
      const unread = allMsgs.filter(m => m.sender_id !== currentUser.id && (!m.read_by || !m.read_by.includes(currentUser.id)));
      setUnreadMsgCount(unread.length);
    };

    window.addEventListener('slock_update_tasks', handleTasksUpdate);
    window.addEventListener('slock_update_meetings', handleMeetingsUpdate);
    window.addEventListener('slock_update_notifications', handleNotifUpdate);
    window.addEventListener('slock_update_messages', handleMessagesUpdate);

    return () => {
      window.removeEventListener('slock_update_tasks', handleTasksUpdate);
      window.removeEventListener('slock_update_meetings', handleMeetingsUpdate);
      window.removeEventListener('slock_update_notifications', handleNotifUpdate);
      window.removeEventListener('slock_update_messages', handleMessagesUpdate);
    };
  }, [currentUser]);

  // Filtrer les tâches de l'utilisateur actuel
  const myTasks = tasks.filter(t => t.assigned_to === currentUser.id && t.status !== 'done');
  
  // Tâches en retard
  const overdueTasks = myTasks.filter(t => {
    if (!t.due_date) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    return new Date(t.due_date) < today;
  });

  // Réunions à venir
  const upcomingMeetings = meetings.filter(m => {
    const today = new Date();
    today.setHours(0,0,0,0);
    return new Date(m.date) >= today;
  });

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'director': return 'Directeur';
      case 'project_manager': return 'Chef de Projet';
      case 'service_head': return 'Chef de Service';
      case 'architecte': return 'Architecte';
      case 'dev_web': return 'Développeur Web';
      case 'designer_3d': return 'Designer 3D';
      case 'genie_civil': return 'Génie Civil';
      case 'directeur_technique': return 'Directeur Technique';
      case 'logistique': return 'Logistique';
      default: return 'Collaborateur';
    }
  };

  const handleTaskCheck = (taskId: string) => {
    MockDatabase.updateTaskStatus(taskId, 'done');
    // Déclencher mise à jour locale
    setTasks(MockDatabase.getTasks());
  };

  const handleAlertClick = () => {
    const urgentChan = MockDatabase.getChannels().find(c => c.name === 'urgences-cardio');
    if (urgentChan) {
      onChannelChange(urgentChan);
    } else {
      onTabChange('messages');
    }
  };

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.25s ease-out' }}>
      
      {/* Welcome Banner (Apple Gradient) */}
      <div className="welcome-banner">
        <div className="welcome-text">
          <h1>Bonjour, {currentUser.first_name} {currentUser.last_name} 👋</h1>
          <p>{getRoleLabel(currentUser.role)} • Statut actuel : <strong style={{ color: 'var(--color-primary)' }}>{currentUser.status_message || 'Disponible'}</strong></p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => onTabChange('directory')}>
            Changer mon statut
          </button>
        </div>
      </div>

      {/* Urgent Hospital Alert (If any) */}
      {urgentAlerts.length > 0 && (
        <div 
          onClick={handleAlertClick}
          style={{
            backgroundColor: 'var(--color-danger-bg)',
            border: '1px solid rgba(255,59,48,0.15)',
            borderRadius: '16px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'transform var(--transition-fast)'
          }}
          className="urgent-banner-hover"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={20} style={{ color: 'var(--color-danger)' }} />
            <div>
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-danger)' }}>ALERTE URGENTE ACTIVE</span>
              <p style={{ fontSize: '12px', color: 'var(--color-text-main)', marginTop: '2px' }}>{urgentAlerts[0].content}</p>
            </div>
          </div>
          <ArrowRight size={16} style={{ color: 'var(--color-danger)' }} />
        </div>
      )}

      {/* Main KPI Stats Row */}
      <div className="stat-grid">
        <div className="stat-card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
          <span className="stat-card-title">Messages non lus</span>
          <span className="stat-card-value">{unreadMsgCount}</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
          <span className="stat-card-title">Mes actions en cours</span>
          <span className="stat-card-value">{myTasks.length}</span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--color-danger)' }}>
          <span className="stat-card-title">Actions en retard</span>
          <span className="stat-card-value" style={{ color: overdueTasks.length > 0 ? 'var(--color-danger)' : 'inherit' }}>
            {overdueTasks.length}
          </span>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--color-success)' }}>
          <span className="stat-card-title">Réunions planifiées</span>
          <span className="stat-card-value">{upcomingMeetings.length}</span>
        </div>
      </div>

      {/* Secondary Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Left Column - Action Lists & Meetings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Action List Widget */}
          <div className="card">
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckSquare size={16} style={{ color: 'var(--color-primary)' }} />
              Mes tâches cliniques & projets ({myTasks.length})
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {myTasks.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                  Bravo ! Vous n'avez aucune tâche opérationnelle en attente.
                </div>
              ) : (
                myTasks.map(task => {
                  const isTaskOverdue = overdueTasks.some(t => t.id === task.id);
                  return (
                    <div 
                      key={task.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        backgroundColor: '#F5F5F7',
                        borderRadius: '12px',
                        border: '1px solid var(--color-border)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, overflow: 'hidden' }}>
                        <input 
                          type="checkbox" 
                          checked={false} 
                          onChange={() => handleTaskCheck(task.id)}
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: '2px solid var(--color-primary)',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        />
                        <div style={{ overflow: 'hidden' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-main)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {task.title}
                          </span>
                          <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)' }}>
                            Projet : DPI • Échéance : {task.due_date ? new Date(task.due_date).toLocaleDateString('fr-FR') : 'Non spécifiée'}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                        {isTaskOverdue && (
                          <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-danger)', backgroundColor: 'var(--color-danger-bg)', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <AlertTriangle size={10} /> En retard
                          </span>
                        )}
                        <span className={`badge badge-${task.priority}`} style={{ fontSize: '9px' }}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {myTasks.length > 0 && (
              <button 
                onClick={() => onTabChange('projects')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '12px'
                }}
              >
                Accéder au tableau de bord des projets <ArrowUpRight size={14} />
              </button>
            )}
          </div>

          {/* Meetings List Widget */}
          <div className="card">
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} style={{ color: 'var(--color-primary)' }} />
              Prochaines réunions & comités ({upcomingMeetings.length})
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {upcomingMeetings.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '12.5px', fontStyle: 'italic', padding: '12px 0' }}>Aucune réunion prévue aujourd'hui.</p>
              ) : (
                upcomingMeetings.map(m => (
                  <div 
                    key={m.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: '#FFFFFF'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-main)' }}>{m.title}</span>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        <span>📅 {new Date(m.date).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'})} à {m.time}</span>
                        <span>•📍 {m.location}</span>
                      </div>
                    </div>
                    <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11.5px' }} onClick={() => onTabChange('meetings')}>
                      Consulter / PV
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column - Decisions & Activities */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Decisions Board */}
          <div className="card" style={{ background: 'linear-gradient(to bottom, #FFFFFF, #FAFAFB)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClipboardCheck size={16} style={{ color: 'var(--color-success)' }} />
              Décisions institutionnelles récentes
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {decisions.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', fontStyle: 'italic' }}>Aucune décision enregistrée.</p>
              ) : (
                decisions.map(d => (
                  <div 
                    key={d.id}
                    style={{
                      borderLeft: '3px solid var(--color-success)',
                      paddingLeft: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <p style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--color-text-main)', lineHeight: '1.4' }}>
                      "{d.content}"
                    </p>
                    <span style={{ fontSize: '9.5px', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                      ✓ VALIDÉ LE {new Date(d.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Audit Logs / Activity feed */}
          <div className="card">
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={16} style={{ color: 'var(--color-info)' }} />
              Journal de traçabilité d'activité (Audit)
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
              <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)' }}>
                  <strong>Système Slock</strong>
                  <span>À l'instant</span>
                </div>
                <span style={{ color: '#2C2C2E' }}>Portail collaboratif Slock initialisé avec succès. En attente d'activité opérationnelle globale.</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
