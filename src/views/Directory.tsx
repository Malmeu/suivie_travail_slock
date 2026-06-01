import React, { useState, useEffect } from 'react';
import { 
  Contact, Search, Phone, Mail, Award, Clock, 
  MapPin, CheckCircle, AlertCircle, RefreshCw
} from 'lucide-react';
import type { Profile, Department, UserStatus } from '../types';
import { MockDatabase } from '../services/db';
import { Avatar } from '../components/Avatar';

interface DirectoryProps {
  currentUser: Profile;
  onUserChange: (user: Profile) => void;
}

export const Directory: React.FC<DirectoryProps> = ({
  currentUser,
  onUserChange
}) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  // État local pour le statut en cours de modification
  const [myStatus, setMyStatus] = useState<UserStatus>(currentUser.status);
  const [myStatusMessage, setMyStatusMessage] = useState(currentUser.status_message || '');

  useEffect(() => {
    const loadDirectory = () => {
      setProfiles(MockDatabase.getProfiles());
      setDepartments(MockDatabase.getDepartments());
      
      // Mettre à jour l'état local du statut
      setMyStatus(currentUser.status);
      setMyStatusMessage(currentUser.status_message || '');
    };

    loadDirectory();

    const handleUserChangeOutside = () => {
      const freshUser = MockDatabase.getCurrentUser();
      if (freshUser) {
        setMyStatus(freshUser.status);
        setMyStatusMessage(freshUser.status_message || '');
      }
      setProfiles(MockDatabase.getProfiles());
    };

    window.addEventListener('slock_user_changed', handleUserChangeOutside);
    return () => {
      window.removeEventListener('slock_user_changed', handleUserChangeOutside);
    };
  }, [currentUser]);

  const handleUpdateMyStatus = (e: React.FormEvent) => {
    e.preventDefault();
    
    const all = MockDatabase.getProfiles();
    const target = all.find(p => p.id === currentUser.id);
    if (target) {
      target.status = myStatus;
      target.status_message = myStatusMessage;
      
      // Enregistrer profil dans la DB
      MockDatabase.save('profiles', all);
      
      // Mettre à jour la session en cours
      MockDatabase.setCurrentUser(target);
      onUserChange(target);

      // Mettre à jour la liste des profils locale
      setProfiles(MockDatabase.getProfiles());
      alert("Votre statut de garde a bien été mis à jour et diffusé en temps réel !");
    }
  };

  const getStatusIcon = (status: UserStatus) => {
    switch (status) {
      case 'available':
        return <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-success)', display: 'inline-block' }} />;
      case 'on_duty':
        return <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-danger)', display: 'inline-block' }} />;
      case 'in_meeting':
        return <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-warning)', display: 'inline-block' }} />;
      case 'away':
        return <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-info)', display: 'inline-block' }} />;
      default:
        return <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--color-text-muted)', display: 'inline-block' }} />;
    }
  };

  const getStatusLabel = (status: UserStatus) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'on_duty': return 'En Garde Active';
      case 'in_meeting': return 'En Réunion';
      case 'away': return 'Déplacé / Absence courte';
      default: return 'Hors ligne';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'director': return 'Direction';
      case 'project_manager': return 'Chef Projet';
      case 'service_head': return 'Chef Service';
      case 'architecte': return 'Architecte';
      case 'dev_web': return 'Développeur Web';
      case 'designer_3d': return 'Designer 3D';
      case 'genie_civil': return 'Génie Civil';
      case 'directeur_technique': return 'Directeur Technique';
      case 'logistique': return 'Logistique';
      default: return 'Collaborateur';
    }
  };

  const getDeptName = (deptId?: string) => {
    if (!deptId) return 'Non affecté';
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name : 'Inconnu';
  };

  // Filtrer les profils
  const filteredProfiles = profiles.filter(p => {
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || p.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'all' || p.department_id === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.25s ease-out' }}>
      
      {/* View Header */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-main)' }}>Annuaire Médical & Administratif</h2>
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Consultez la disponibilité du personnel hospitalier et mettez à jour votre statut de garde.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* Left Side: Directory Search & List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Filters Bar */}
          <div className="card" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input 
                type="text" 
                placeholder="Rechercher par nom, prénom ou email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 36px', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
              />
            </div>
            
            <select 
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '13px', backgroundColor: '#FFFFFF', fontWeight: 500 }}
            >
              <option value="all">Tous les services</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Personnel Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {filteredProfiles.map(p => (
              <div 
                key={p.id} 
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  position: 'relative'
                }}
              >
                {/* Status indicator absolute pin */}
                <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                  {getStatusIcon(p.status)}
                  <span>{p.status === 'on_duty' ? 'Garde' : p.status === 'available' ? 'Dispo' : 'Occupé'}</span>
                </div>

                {/* Identity header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', overflow: 'hidden' }}>
                    <Avatar avatarUrl={p.avatar_url} fallbackText={p.first_name[0]} size="100%" fontSize="13px" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--color-text-main)' }}>{p.first_name} {p.last_name}</h4>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 500 }}>{getRoleLabel(p.role)}</span>
                  </div>
                </div>

                {/* Status Message details */}
                <div style={{ backgroundColor: '#F5F5F7', padding: '6px 10px', borderRadius: '8px', fontSize: '11px', color: '#3A3A3C', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <strong>Service : {getDeptName(p.department_id)}</strong>
                  <span>Statut : {p.status_message || getStatusLabel(p.status)}</span>
                </div>

                {/* Contact Coordinates */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px', color: 'var(--color-text-muted)', paddingTop: '6px', borderTop: '1px dashed rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={12} />
                    <span>{p.phone || 'Non renseigné'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={12} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.email}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Right Side: My Live Garde Switcher (Interactive wow factor!) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignSelf: 'flex-start' }}>
          
          <div className="card" style={{ background: 'linear-gradient(to bottom, #FFFFFF, #E6F0FF)', border: '1px solid rgba(0, 122, 255, 0.15)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <RefreshCw size={16} />
              Mon Statut de Garde Live
            </h3>

            <p style={{ fontSize: '12px', color: 'var(--color-text-main)', marginBottom: '16px', lineHeight: '1.4' }}>
              Changez votre état clinique ci-dessous. Il sera **instantanément synchronisé** sur le tableau de bord de tous vos collaborateurs hospitaliers.
            </p>

            <form onSubmit={handleUpdateMyStatus} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-group">
                <label>Disponibilité opérationnelle</label>
                <select 
                  value={myStatus}
                  onChange={(e) => setMyStatus(e.target.value as UserStatus)}
                  style={{ backgroundColor: '#FFFFFF' }}
                >
                  <option value="available">Disponible (Au bureau / Service)</option>
                  <option value="on_duty">En Garde Clinique Active (Bloc / Urgence)</option>
                  <option value="in_meeting">En Réunion / Staff</option>
                  <option value="away">Absence Courte / Déplacement externe</option>
                  <option value="offline">Hors ligne</option>
                </select>
              </div>

              <div className="form-group">
                <label>Message de précision (ex: Salle 402, Bloc A...)</label>
                <input 
                  type="text" 
                  value={myStatusMessage}
                  onChange={(e) => setMyStatusMessage(e.target.value)}
                  placeholder="ex: Bloc Cardio - Salle 2"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Mettre à jour mon statut
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};
