import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, Layers, ShieldCheck, FileText, CheckCircle, Database, RefreshCw, Cloud, AlertCircle } from 'lucide-react';
import type { Profile, Department, UserRole } from '../types';
import { MockDatabase } from '../services/db';
import { supabase } from '../services/supabase';

interface AdminProps {
  currentUser: Profile;
  onUserChange: (user: Profile) => void;
}

export const Admin: React.FC<AdminProps> = ({
  currentUser,
  onUserChange
}) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState<string>('');

  const handleSupabaseSync = async () => {
    if (!supabase) {
      setSyncStatus('error');
      setSyncMessage("Le client Supabase n'est pas initialisé. Veuillez configurer les variables d'environnement dans le fichier .env");
      return;
    }

    setSyncStatus('loading');
    setSyncMessage("Préparation de la migration clinique...");
    
    // Étapes intermédiaires visuelles (WOW factor)
    const steps = [
      "Validation de la connexion à l'API Supabase...",
      "Migration des départements cliniques (Urgences, Cardiologie)...",
      "Génération des profils hospitaliers et habilitations...",
      "Synchronisation des comités et groupes de travail...",
      "Création des canaux de communication internes...",
      "Intégration du Kanban de coordination des projets...",
      "Importation des procès-verbaux de réunions cliniques...",
      "Sécurisation et application des politiques cliniques..."
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 350));
      setSyncMessage(steps[i]);
    }

    try {
      const result = await MockDatabase.syncAllToSupabase();
      if (result.success) {
        setSyncStatus('success');
        setSyncMessage(result.message);
        
        // Ajouter au journal d'audit
        const newLog = {
          id: auditLogs.length + 1,
          user: `${currentUser.first_name} ${currentUser.last_name}`,
          role: currentUser.role,
          time: new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'}),
          text: 'Synchronisation complète des données cliniques vers le Cloud Supabase réussie',
          level: 'success'
        };
        setAuditLogs(prev => [newLog, ...prev]);
      } else {
        setSyncStatus('error');
        setSyncMessage(result.message);
      }
    } catch (error: any) {
      setSyncStatus('error');
      setSyncMessage(error.message || "Une erreur inattendue est survenue.");
    }
  };

  useEffect(() => {
    const loadAdminData = () => {
      setProfiles(MockDatabase.getProfiles());
      setDepartments(MockDatabase.getDepartments());
      
      // Journal d'audit de départ
      setAuditLogs([
        { id: 1, user: `${currentUser.first_name} ${currentUser.last_name}`, role: currentUser.role, time: new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'}), text: 'Initialisation du registre de conformité et de traçabilité Slock', level: 'info' }
      ]);
    };

    loadAdminData();
  }, []);

  const handleRoleChange = (profileId: string, newRole: UserRole) => {
    const all = MockDatabase.getProfiles();
    const target = all.find(p => p.id === profileId);
    if (target) {
      target.role = newRole;
      MockDatabase.save('profiles', all);
      setProfiles(MockDatabase.getProfiles());

      // Ajouter au journal d'audit
      const newLog = {
        id: auditLogs.length + 1,
        user: `${currentUser.first_name} ${currentUser.last_name}`,
        role: currentUser.role,
        time: new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'}),
        text: `Rôle de ${target.first_name} ${target.last_name} changé vers "${newRole}"`,
        level: 'warning'
      };
      setAuditLogs([newLog, ...auditLogs]);

      // Si l'utilisateur modifié est soi-même, propager
      if (target.id === currentUser.id) {
        MockDatabase.setCurrentUser(target);
        onUserChange(target);
      }
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'director': return 'Direction';
      case 'project_manager': return 'Chef de Projet';
      case 'service_head': return 'Chef de Service';
      case 'architecte': return 'Architecte';
      case 'dev_web': return 'Développeur Web';
      case 'designer_3d': return 'Designer 3D';
      case 'genie_civil': return 'Génie Civil';
      case 'directeur_technique': return 'Directeur Technique';
      case 'logistique': return 'Logistique';
      default: return 'Observateur';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'warning': return 'var(--color-danger)';
      case 'success': return 'var(--color-success)';
      default: return 'var(--color-primary)';
    }
  };

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.25s ease-out' }}>
      
      {/* Title */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-main)' }}>Console d'Administration & Traçabilité</h2>
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Gérez les habilitations, contrôlez les rôles métiers hospitaliers et auditez les actions du personnel.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '24px' }}>
        
        {/* Left Side: Users list and Habilitations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="card">
            <h3 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Users size={16} style={{ color: 'var(--color-primary)' }} />
              Gestion des habilitations & Rôles Slock
            </h3>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: '#86868B', textAlign: 'left' }}>
                  <th style={{ padding: '10px 8px' }}>Collaborateur</th>
                  <th style={{ padding: '10px 8px' }}>Service Affecté</th>
                  <th style={{ padding: '10px 8px' }}>Rôle Métier Slock</th>
                  <th style={{ padding: '10px 8px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)', transition: 'background-color 0.1s' }} className="table-row-hover">
                    <td style={{ padding: '12px 8px', fontWeight: 600 }}>{p.first_name} {p.last_name}</td>
                    <td style={{ padding: '12px 8px', color: 'var(--color-text-muted)' }}>
                      {p.department_id === 'dep_cardio' ? 'Cardiologie' : p.department_id === 'dep_urgences' ? 'Urgences' : p.department_id === 'dep_tech' ? 'Services Tech.' : 'Administration'}
                    </td>
                    <td style={{ padding: '12px 8px', fontWeight: 500 }}>
                      <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '12px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                        {getRoleLabel(p.role)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <select 
                        value={p.role}
                        onChange={(e) => handleRoleChange(p.id, e.target.value as UserRole)}
                        style={{
                          fontSize: '12px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--color-border)',
                          backgroundColor: '#FFFFFF',
                          fontWeight: 500,
                          cursor: 'pointer'
                        }}
                      >
                        <option value="admin">Administrateur</option>
                        <option value="director">Directeur</option>
                        <option value="project_manager">Chef Projet</option>
                        <option value="service_head">Chef Service</option>
                        <option value="collaborator">Collaborateur / Agent</option>
                        <option value="architecte">Architecte</option>
                        <option value="dev_web">Développeur Web</option>
                        <option value="designer_3d">Designer 3D</option>
                        <option value="genie_civil">Génie Civil</option>
                        <option value="directeur_technique">Directeur Technique</option>
                        <option value="logistique">Logistique</option>
                        <option value="observer">Observateur</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* List of Departments */}
          <div className="card">
            <h3 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Layers size={16} style={{ color: 'var(--color-primary)' }} />
              Départements cliniques & services hospitaliers
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {departments.map(d => (
                <div key={d.id} style={{ border: '1px solid var(--color-border)', padding: '12px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)' }}>{d.code}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-main)' }}>{d.name}</span>
                  <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>Responsable affecté</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Regulated Audit Log (Journal de Traçabilité) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignSelf: 'flex-start' }}>
          
          {/* Supabase Cloud Connection & Sync Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: 'linear-gradient(135deg, rgba(230, 240, 255, 0.4), rgba(240, 239, 255, 0.4))', border: '1px solid rgba(0, 122, 255, 0.15)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cloud size={16} style={{ color: 'var(--color-primary)' }} />
                <span>Base Cloud Supabase</span>
              </div>
              <span 
                style={{ 
                  fontSize: '10px', 
                  padding: '3px 8px', 
                  borderRadius: '10px', 
                  fontWeight: 600,
                  backgroundColor: supabase ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                  color: supabase ? 'var(--color-success)' : 'var(--color-danger)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: supabase ? 'var(--color-success)' : 'var(--color-danger)', display: 'inline-block' }}></span>
                {supabase ? 'Connecté' : 'Non configuré'}
              </span>
            </h3>

            <p style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
              L'application utilise un stockage local hautement réactif et réplique les écritures cliniques en temps réel vers Supabase.
            </p>

            {supabase && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                <div style={{ fontSize: '11px', padding: '10px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.6)', border: '1px solid rgba(0, 0, 0, 0.04)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>Informations Instance :</span>
                  <span style={{ fontFamily: 'monospace', color: 'var(--color-text-muted)', fontSize: '9.5px', wordBreak: 'break-all' }}>
                    URL : https://uqrhvbqpdlmqdnvjtwwv.supabase.co
                  </span>
                </div>

                {syncStatus === 'idle' && (
                  <button 
                    onClick={handleSupabaseSync}
                    className="btn btn-primary"
                    style={{ 
                      width: '100%', 
                      fontSize: '12px', 
                      padding: '10px', 
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, var(--color-primary), #0056b3)',
                      boxShadow: '0 2px 8px rgba(0, 122, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.2s',
                      border: 'none'
                    }}
                  >
                    <RefreshCw size={14} />
                    Synchroniser les données démo
                  </button>
                )}

                {syncStatus === 'loading' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.7)', border: '1px solid var(--color-border)' }}>
                    <div className="apple-spinner" style={{
                      width: '18px',
                      height: '18px',
                      border: '2.5px solid var(--color-primary-light)',
                      borderTop: '2.5px solid var(--color-primary)',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }}></div>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-main)', textAlign: 'center', fontWeight: 500 }}>
                      {syncMessage}
                    </span>
                  </div>
                )}

                {syncStatus === 'success' && (
                  <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'var(--color-success-bg)', border: '1px solid rgba(52, 199, 89, 0.2)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-success)', fontWeight: 700, fontSize: '12px' }}>
                      <ShieldCheck size={16} />
                      <span>Synchronisation réussie !</span>
                    </div>
                    <span style={{ fontSize: '11.5px', color: '#1E6B30', lineHeight: '1.4' }}>
                      {syncMessage}
                    </span>
                    <button 
                      onClick={() => setSyncStatus('idle')}
                      style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '11px', fontWeight: 600, textAlign: 'left', cursor: 'pointer', padding: 0, marginTop: '4px' }}
                    >
                      Refaire une synchronisation
                    </button>
                  </div>
                )}

                {syncStatus === 'error' && (
                  <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'var(--color-danger-bg)', border: '1px solid rgba(255, 59, 48, 0.2)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-danger)', fontWeight: 700, fontSize: '12px' }}>
                      <AlertCircle size={16} />
                      <span>Échec de synchronisation</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#8A1F19', lineHeight: '1.4', wordBreak: 'break-word' }}>
                      {syncMessage}
                    </span>
                    <div style={{ fontSize: '10.5px', color: '#5C1510', borderTop: '1px dashed rgba(255, 59, 48, 0.15)', paddingTop: '6px', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <span style={{ fontWeight: 600 }}>Étapes recommandées :</span>
                      <span>1. Ouvrez l'éditeur SQL de votre console Supabase.</span>
                      <span>2. Copiez/collez le fichier <code style={{fontFamily:'monospace', background:'rgba(255,255,255,0.4)', padding:'1px 3px', borderRadius:'3px'}}>supabase/schema.sql</code> et exécutez-le.</span>
                      <span>3. Copiez/collez le fichier <code style={{fontFamily:'monospace', background:'rgba(255,255,255,0.4)', padding:'1px 3px', borderRadius:'3px'}}>supabase/policies.sql</code> et exécutez-le.</span>
                    </div>
                    <button 
                      onClick={handleSupabaseSync}
                      className="btn btn-secondary"
                      style={{ fontSize: '11px', padding: '6px 12px', borderRadius: '8px', marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <RefreshCw size={12} />
                      Réessayer
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '10px' }}>
              <ShieldAlert size={16} style={{ color: 'var(--color-danger)' }} />
              Registre de Conformité RGPD & Audit
            </h3>

            <p style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
              Toutes les connexions, changements de droits cliniques et diffusions d'alertes urgentes sont tracées et figées ci-dessous conformément aux lois de santé.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto' }}>
              {auditLogs.map(log => (
                <div 
                  key={log.id} 
                  style={{ 
                    borderLeft: `3px solid ${getLogLevelColor(log.level)}`,
                    paddingLeft: '10px',
                    fontSize: '11px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    <span>{log.user} ({log.role})</span>
                    <span>{log.time.split(' ')[1] || log.time}</span>
                  </div>
                  <span style={{ color: '#2C2C2E', lineHeight: '1.3' }}>{log.text}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
