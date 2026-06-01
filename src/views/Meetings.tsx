import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, MapPin, User, FileText, CheckCircle, 
  Plus, Trash2, Printer, Check, ShieldCheck, X, FileCheck
} from 'lucide-react';
import type { Meeting, MeetingDecision, Task, Profile, PriorityLevel } from '../types';
import { MockDatabase } from '../services/db';
import { exportMeetingToPDF } from '../services/pdf';

interface MeetingsProps {
  currentUser: Profile;
}

export const Meetings: React.FC<MeetingsProps> = ({
  currentUser
}) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('meet_1');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [decisions, setDecisions] = useState<MeetingDecision[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showDirectPVModal, setShowDirectPVModal] = useState(false);

  // Formulaire PV Direct
  const [pvTitle, setPvTitle] = useState('');
  const [pvDate, setPvDate] = useState('');
  const [pvLocation, setPvLocation] = useState('');
  const [pvAgenda, setPvAgenda] = useState('');
  const [pvNotes, setPvNotes] = useState('');
  const [pvParticipants, setPvParticipants] = useState<string[]>([]);

  // Éditeur de PV locaux
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState('');
  const [localDecisions, setLocalDecisions] = useState<string[]>([]);
  const [localTasks, setLocalTasks] = useState<{title: string, assignedTo: string, priority: PriorityLevel, dueDate?: string}[]>([]);
  const [localHighlights, setLocalHighlights] = useState<string[]>([]);
  const [localWarnings, setLocalWarnings] = useState<string[]>([]);
  const [nextMeeting, setNextMeeting] = useState('');

  // Formulaire Planification Réunion
  const [meetTitle, setMeetTitle] = useState('');
  const [meetDate, setMeetDate] = useState('');
  const [meetTime, setMeetTime] = useState('');
  const [meetLocation, setMeetLocation] = useState('');
  const [meetAgenda, setMeetAgenda] = useState('');
  const [meetParticipants, setMeetParticipants] = useState<string[]>([]);

  useEffect(() => {
    const loadMeetingsData = () => {
      setMeetings(MockDatabase.getMeetings());
      setProfiles(MockDatabase.getProfiles());
      setTasks(MockDatabase.getTasks());
      
      const allDec = MockDatabase.getDecisions();
      if (selectedMeetingId) {
        setDecisions(allDec.filter(d => d.meeting_id === selectedMeetingId));
      }
    };

    loadMeetingsData();

    // S'abonner
    const handleMeetingsUpdate = () => setMeetings(MockDatabase.getMeetings());
    const handleDecisionsUpdate = () => {
      const allDec = MockDatabase.getDecisions();
      setDecisions(allDec.filter(d => d.meeting_id === selectedMeetingId));
    };

    window.addEventListener('slock_update_meetings', handleMeetingsUpdate);
    window.addEventListener('slock_update_decisions', handleDecisionsUpdate);

    return () => {
      window.removeEventListener('slock_update_meetings', handleMeetingsUpdate);
      window.removeEventListener('slock_update_decisions', handleDecisionsUpdate);
    };
  }, [selectedMeetingId]);

  const selectedMeeting = meetings.find(m => m.id === selectedMeetingId) || meetings[0];

  // Charger les états d'édition quand on change de réunion
  useEffect(() => {
    if (selectedMeeting) {
      setNotes(selectedMeeting.notes || '');
      setLocalHighlights(selectedMeeting.highlights && selectedMeeting.highlights.length > 0 ? selectedMeeting.highlights : ['']);
      setLocalWarnings(selectedMeeting.warnings && selectedMeeting.warnings.length > 0 ? selectedMeeting.warnings : ['']);
      setNextMeeting(selectedMeeting.next_meeting || '');
      
      const allDec = MockDatabase.getDecisions();
      const decs = allDec.filter(d => d.meeting_id === selectedMeeting.id).map(d => d.content);
      setLocalDecisions(decs.length > 0 ? decs : ['']);

      setLocalTasks([]);
      setIsEditing(false);
    }
  }, [selectedMeetingId, selectedMeeting]);

  const getOrganizerName = (id: string) => {
    const user = profiles.find(p => p.id === id);
    return user ? `${user.first_name} ${user.last_name}` : 'Organisateur inconnu';
  };

  const getParticipantsNames = (ids: string[]) => {
    return ids.map(id => {
      const u = profiles.find(p => p.id === id);
      return u ? `${u.first_name} ${u.last_name}` : '';
    }).filter(Boolean).join(', ');
  };

  const handleStartEditing = () => {
    setIsEditing(true);
  };

  const handleAddDecisionField = () => {
    setLocalDecisions([...localDecisions, '']);
  };

  const handleRemoveDecisionField = (index: number) => {
    const next = [...localDecisions];
    next.splice(index, 1);
    setLocalDecisions(next.length > 0 ? next : ['']);
  };

  const handleDecisionChange = (index: number, val: string) => {
    const next = [...localDecisions];
    next[index] = val;
    setLocalDecisions(next);
  };

  const handleAddHighlightField = () => {
    setLocalHighlights([...localHighlights, '']);
  };

  const handleRemoveHighlightField = (index: number) => {
    const next = [...localHighlights];
    next.splice(index, 1);
    setLocalHighlights(next.length > 0 ? next : ['']);
  };

  const handleHighlightChange = (index: number, val: string) => {
    const next = [...localHighlights];
    next[index] = val;
    setLocalHighlights(next);
  };

  const handleAddWarningField = () => {
    setLocalWarnings([...localWarnings, '']);
  };

  const handleRemoveWarningField = (index: number) => {
    const next = [...localWarnings];
    next.splice(index, 1);
    setLocalWarnings(next.length > 0 ? next : ['']);
  };

  const handleWarningChange = (index: number, val: string) => {
    const next = [...localWarnings];
    next[index] = val;
    setLocalWarnings(next);
  };

  const handleAddTaskField = () => {
    setLocalTasks([...localTasks, { title: '', assignedTo: profiles[0]?.id || '', priority: 'normal' }]);
  };

  const handleRemoveTaskField = (index: number) => {
    const next = [...localTasks];
    next.splice(index, 1);
    setLocalTasks(next);
  };

  const handleTaskChange = (index: number, key: string, val: any) => {
    const next = [...localTasks] as any;
    next[index][key] = val;
    setLocalTasks(next);
  };

  const handleSavePV = () => {
    if (!selectedMeeting) return;
    
    MockDatabase.saveMinutes(
      selectedMeeting.id, 
      notes, 
      localDecisions, 
      localTasks,
      localHighlights,
      localWarnings,
      nextMeeting
    );
    
    // Notifications system update
    setIsEditing(false);
    // Rafraîchir les données
    setMeetings(MockDatabase.getMeetings());
    const allDec = MockDatabase.getDecisions();
    setDecisions(allDec.filter(d => d.meeting_id === selectedMeeting.id));
    setTasks(MockDatabase.getTasks());
  };

  const handleValidatePV = () => {
    if (!selectedMeeting) return;
    MockDatabase.validateMinutes(selectedMeeting.id, currentUser.id);
    
    // Rafraîchir
    setMeetings(MockDatabase.getMeetings());
    alert("PV de réunion officiellement signé et figé. Une notification de conformité a été envoyée aux participants.");
  };

  const handleExportPDF = () => {
    if (!selectedMeeting) return;
    exportMeetingToPDF(selectedMeeting, decisions, tasks, profiles);
  };

  const handlePlanMeetingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetTitle.trim() || !meetDate || !meetTime) return;

    const listAgenda = meetAgenda.split('\n').filter(a => a.trim().length > 0);

    const newMeeting: Meeting = {
      id: `meet_${Date.now()}`,
      title: meetTitle,
      date: meetDate,
      time: meetTime,
      location: meetLocation || 'Salle B3 ou Visio',
      organizer_id: currentUser.id,
      participant_ids: [currentUser.id, ...meetParticipants],
      agenda: listAgenda.length > 0 ? listAgenda : ['Sujets opérationnels à définir'],
      is_minutes_validated: false,
      created_at: new Date().toISOString(),
      project_id: 'proj_dpi' // Lié au DPI par défaut
    };

    const updated = [...meetings, newMeeting];
    MockDatabase.saveMeetings(updated);
    setMeetings(updated);
    setSelectedMeetingId(newMeeting.id);
    setShowPlanModal(false);

    // Reset Form
    setMeetTitle('');
    setMeetDate('');
    setMeetTime('');
    setMeetLocation('');
    setMeetAgenda('');
    setMeetParticipants([]);
  };

  const handleCreateDirectPVSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pvTitle.trim() || !pvDate) return;

    const listAgenda = pvAgenda.split('\n').filter(a => a.trim().length > 0);

    const newMeeting: Meeting = {
      id: `meet_${Date.now()}`,
      title: pvTitle,
      date: pvDate,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      location: pvLocation || 'Salle Staff / Visioconférence',
      organizer_id: currentUser.id,
      participant_ids: [currentUser.id, ...pvParticipants],
      agenda: listAgenda.length > 0 ? listAgenda : ['Sujets abordés dans la séance'],
      notes: pvNotes || 'Procès-verbal rédigé en séance.',
      highlights: [],
      warnings: [],
      next_meeting: '',
      is_minutes_validated: false,
      created_at: new Date().toISOString(),
      project_id: 'proj_dpi' // Lié par défaut
    };

    const updated = [...meetings, newMeeting];
    MockDatabase.saveMeetings(updated);
    setMeetings(updated);
    setSelectedMeetingId(newMeeting.id);
    setShowDirectPVModal(false);

    // Reset Form
    setPvTitle('');
    setPvDate('');
    setPvLocation('');
    setPvAgenda('');
    setPvNotes('');
    setPvParticipants([]);
    
    alert("PV direct créé avec succès ! Vous pouvez maintenant y ajouter des décisions structurées ou le signer numériquement.");
  };

  const togglePvParticipant = (pId: string) => {
    const index = pvParticipants.indexOf(pId);
    if (index > -1) {
      setPvParticipants(pvParticipants.filter(id => id !== pId));
    } else {
      setPvParticipants([...pvParticipants, pId]);
    }
  };

  const toggleParticipant = (pId: string) => {
    const index = meetParticipants.indexOf(pId);
    if (index > -1) {
      setMeetParticipants(meetParticipants.filter(id => id !== pId));
    } else {
      setMeetParticipants([...meetParticipants, pId]);
    }
  };

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.25s ease-out' }}>
      
      {/* View Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-main)' }}>Comptes-Rendus & Procès-Verbaux (PV)</h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Rédigez les décisions hospitalières, assignez les actions opérationnelles et exportez en PDF certifié.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setShowDirectPVModal(true)}>
            <FileText size={14} /> Rédiger un PV direct
          </button>
          <button className="btn btn-primary" onClick={() => setShowPlanModal(true)}>
            <Plus size={14} /> Planifier une réunion
          </button>
        </div>
      </div>

      {/* Grid: Left Meetings list, Right PV Editor/Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '24px', flex: 1, overflow: 'hidden' }}>
        
        {/* Left Meetings List Card */}
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', alignSelf: 'flex-start' }}>
          <h3 style={{ fontSize: '14.5px', fontWeight: 700, borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '10px' }}>Liste des Réunions</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto' }}>
            {meetings.map(m => {
              const isSelected = m.id === selectedMeetingId;
              return (
                <div 
                  key={m.id}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    border: isSelected ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                    backgroundColor: isSelected ? 'var(--color-primary-light)' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onClick={() => setSelectedMeetingId(m.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                      📅 {new Date(m.date).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'})}
                    </span>
                    {m.is_minutes_validated ? (
                      <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <FileCheck size={10} /> Validé
                      </span>
                    ) : (
                      <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Brouillon</span>
                    )}
                  </div>

                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? 'var(--color-primary)' : 'var(--color-text-main)', marginTop: '6px', lineHeight: '1.4' }}>
                    {m.title}
                  </h4>
                  <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', display: 'block', marginTop: '4px' }}>
                    🕑 {m.time} • 📍 {m.location}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Pane: PV Editor or Preview (frosted layout) */}
        {selectedMeeting && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* PV Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-main)' }}>{selectedMeeting.title}</h3>
                <span style={{ fontSize: '11.5px', color: 'var(--color-text-muted)' }}>
                  Organisé par : <strong>{getOrganizerName(selectedMeeting.organizer_id)}</strong>
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" onClick={handleExportPDF} style={{ padding: '6px 12px' }}>
                  <Printer size={13} /> Imprimer / PDF
                </button>

                {!selectedMeeting.is_minutes_validated && !isEditing && (
                  <button className="btn btn-primary" onClick={handleStartEditing} style={{ padding: '6px 12px' }}>
                    <FileText size={13} /> Rédiger / Éditer le PV
                  </button>
                )}

                {!selectedMeeting.is_minutes_validated && (currentUser.role === 'service_head' || currentUser.role === 'director' || currentUser.id === selectedMeeting.organizer_id) && (
                  <button className="btn btn-danger" onClick={handleValidatePV} style={{ padding: '6px 12px', color: 'white', backgroundColor: 'var(--color-success)' }}>
                    <Check size={13} /> Valider & Signer le PV
                  </button>
                )}
              </div>
            </div>

            {/* EDITING STATE */}
            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group">
                  <label>Notes de la séance / Débats</label>
                  <textarea 
                    rows={6}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Synthèse des échanges, points techniques soulevés..."
                  />
                </div>

                {/* HIGHLIGHTS (POINTS IMPORTANTS) */}
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      🌟 Points Importants (Faits Saillants)
                    </h4>
                    <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', border: 'none' }} onClick={handleAddHighlightField}>
                      + Ajouter un fait saillant
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {localHighlights.map((hl, i) => (
                      <div key={i} style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="text"
                          value={hl}
                          onChange={(e) => handleHighlightChange(i, e.target.value)}
                          placeholder={`Fait saillant #${i+1} (Décisions stratégiques, jalons atteints...)`}
                          style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '12.5px', backgroundColor: '#F5FAFF' }}
                        />
                        <button type="button" onClick={() => handleRemoveHighlightField(i)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* WARNINGS (POINTS DE VIGILANCE) */}
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      ⚠️ Points de Vigilance (Risques & Alertes)
                    </h4>
                    <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: 'none' }} onClick={handleAddWarningField}>
                      + Ajouter un point de vigilance
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {localWarnings.map((wr, i) => (
                      <div key={i} style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="text"
                          value={wr}
                          onChange={(e) => handleWarningChange(i, e.target.value)}
                          placeholder={`Point de vigilance #${i+1} (Retards potentiels, blocages techniques...)`}
                          style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '12.5px', backgroundColor: '#FFFDF5' }}
                        />
                        <button type="button" onClick={() => handleRemoveWarningField(i)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* DECISIONS LIST */}
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-info)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      📝 Décisions prises
                    </h4>
                    <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)', border: 'none' }} onClick={handleAddDecisionField}>
                      + Ajouter décision
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {localDecisions.map((dec, i) => (
                      <div key={i} style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="text"
                          value={dec}
                          onChange={(e) => handleDecisionChange(i, e.target.value)}
                          placeholder={`Décision #${i+1}`}
                          style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '12.5px' }}
                        />
                        <button type="button" onClick={() => handleRemoveDecisionField(i)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* GENERATE ACTIONS LIST */}
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '12.5px', fontWeight: 700 }}>🛠️ Actions opérationnelles décidées (Création de tâches)</h4>
                    <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={handleAddTaskField}>
                      + Ajouter une action
                    </button>
                  </div>

                  {localTasks.map((t, i) => (
                    <div 
                      key={i} 
                      style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '2fr 1fr 1fr 1fr auto', 
                        gap: '8px', 
                        alignItems: 'center', 
                        backgroundColor: '#F5F5F7', 
                        padding: '10px', 
                        borderRadius: '8px', 
                        marginBottom: '8px' 
                      }}
                    >
                      <input 
                        type="text" 
                        placeholder="Intitulé de l'action" 
                        value={t.title} 
                        onChange={(e) => handleTaskChange(i, 'title', e.target.value)}
                        style={{ padding: '6px 8px', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '12px' }}
                      />
                      <select 
                        value={t.assignedTo} 
                        onChange={(e) => handleTaskChange(i, 'assignedTo', e.target.value)}
                        style={{ padding: '6px 8px', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '12px' }}
                      >
                        {profiles.map(p => (
                          <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                        ))}
                      </select>
                      <select 
                        value={t.priority} 
                        onChange={(e) => handleTaskChange(i, 'priority', e.target.value)}
                        style={{ padding: '6px 8px', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '12px' }}
                      >
                        <option value="low">Priorité Basse</option>
                        <option value="normal">Priorité Normale</option>
                        <option value="high">Priorité Haute</option>
                        <option value="critical">Priorité Critique</option>
                      </select>
                      <input 
                        type="date" 
                        value={t.dueDate || ''} 
                        onChange={(e) => handleTaskChange(i, 'dueDate', e.target.value)}
                        style={{ padding: '4px 6px', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '11px' }}
                      />
                      <button type="button" onClick={() => handleRemoveTaskField(i)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* NEXT MEETING PLANNER */}
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📅 Prochaine réunion
                  </h4>
                  <input 
                    type="text"
                    value={nextMeeting}
                    onChange={(e) => setNextMeeting(e.target.value)}
                    placeholder="Date, heure et ordre du jour prévisionnel (ex: Lundi 15 Juin à 14h - Suivi de chantier DPI)"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--color-border)', borderRadius: '10px', fontSize: '12.5px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '16px' }}>
                  <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>Annuler</button>
                  <button className="btn btn-primary" onClick={handleSavePV}>Enregistrer le PV & Générer les actions</button>
                </div>
              </div>
            ) : (
              /* PREVIEW/READ-ONLY STATE (APPLE DOCUMENT STYLE) */
              <div className="pv-document">
                <div className="pv-meta">
                  <div><strong>Date de Séance :</strong> {new Date(selectedMeeting.date).toLocaleDateString('fr-FR', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})} à {selectedMeeting.time}</div>
                  <div><strong>Lieu / Moyen :</strong> {selectedMeeting.location}</div>
                  <div><strong>Présents / Participants :</strong> {getParticipantsNames(selectedMeeting.participant_ids)}</div>
                </div>

                <div className="pv-section" style={{ marginTop: '24px' }}>
                  <h3>Ordre du Jour</h3>
                  <ul className="pv-list">
                    {selectedMeeting.agenda.map((a, i) => <li key={i}>{a}</li>)}
                  </ul>
                </div>

                {/* POINTS IMPORTANTS & DE VIGILANCE (Premium Apple Style) */}
                {((selectedMeeting.highlights && selectedMeeting.highlights.length > 0 && selectedMeeting.highlights.some(h => h.trim())) ||
                  (selectedMeeting.warnings && selectedMeeting.warnings.length > 0 && selectedMeeting.warnings.some(w => w.trim()))) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px' }}>
                    {/* Points Importants (Bleu Pastel Apple) */}
                    {selectedMeeting.highlights && selectedMeeting.highlights.some(h => h.trim()) && (
                      <div style={{
                        padding: '16px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(0, 122, 255, 0.06)',
                        borderLeft: '4px solid var(--color-primary)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}>
                        <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0, letterSpacing: '0.5px' }}>
                          🌟 POINTS IMPORTANTS / FAITS SAILLANTS
                        </h4>
                        <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '12.5px', color: '#1D1D1F', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {selectedMeeting.highlights.filter(h => h.trim()).map((h, i) => (
                            <li key={i} style={{ lineHeight: '1.4' }}>{h}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Points de Vigilance (Orange Pastel Apple) */}
                    {selectedMeeting.warnings && selectedMeeting.warnings.some(w => w.trim()) && (
                      <div style={{
                        padding: '16px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(255, 149, 0, 0.06)',
                        borderLeft: '4px solid var(--color-warning)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}>
                        <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0, letterSpacing: '0.5px' }}>
                          ⚠️ POINTS DE VIGILANCE / RISQUES
                        </h4>
                        <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '12.5px', color: '#1D1D1F', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {selectedMeeting.warnings.filter(w => w.trim()).map((w, i) => (
                            <li key={i} style={{ lineHeight: '1.4' }}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {selectedMeeting.notes ? (
                  <div className="pv-section" style={{ marginTop: '24px' }}>
                    <h3>Notes de la réunion / Débats</h3>
                    <p style={{ fontSize: '13.5px', color: '#2C2C2E', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{selectedMeeting.notes}</p>
                  </div>
                ) : (
                  <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#FAFAFB', border: '1px dashed var(--color-border)', borderRadius: '12px', margin: '20px 0' }}>
                    <p style={{ fontSize: '12.5px', color: 'var(--color-text-muted)' }}>Le procès-verbal n'a pas encore été rédigé pour cette réunion.</p>
                  </div>
                )}

                {decisions.length > 0 && (
                  <div className="pv-section" style={{ marginTop: '24px' }}>
                    <h3>Décisions prises</h3>
                    <ul className="pv-list" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                      {decisions.map(d => <li key={d.id}>{d.content}</li>)}
                    </ul>
                  </div>
                )}

                {/* Display generated tasks if any */}
                {tasks.filter(t => t.meeting_id === selectedMeeting.id).length > 0 && (
                  <div className="pv-section" style={{ marginTop: '24px' }}>
                    <h3>Actions opérationnelles assignées</h3>
                    <table className="pv-table">
                      <thead>
                        <tr>
                          <th>Action</th>
                          <th>Responsable</th>
                          <th>Échéance</th>
                          <th>Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.filter(t => t.meeting_id === selectedMeeting.id).map(t => {
                          const assignee = profiles.find(p => p.id === t.assigned_to);
                          return (
                            <tr key={t.id}>
                              <td style={{ fontWeight: 600 }}>{t.title}</td>
                              <td>{assignee ? `${assignee.first_name} ${assignee.last_name}` : 'Non assigné'}</td>
                              <td>{t.due_date ? new Date(t.due_date).toLocaleDateString('fr-FR') : 'Non spécifiée'}</td>
                              <td>
                                <span className={`badge badge-${t.priority}`} style={{ fontSize: '9px' }}>
                                  {t.status === 'done' ? 'Terminé ✓' : 'À faire'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Next Meeting (Minimalist & elegant bottom box) */}
                {selectedMeeting.next_meeting && (
                  <div style={{
                    marginTop: '28px',
                    padding: '14px 18px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--color-bg-base)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--color-primary-light)',
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Calendar size={18} />
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                        Prochaine réunion programmée
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-main)', marginTop: '2px', display: 'block' }}>
                        {selectedMeeting.next_meeting}
                      </span>
                    </div>
                  </div>
                )}

                {/* President stamp if validated */}
                {selectedMeeting.is_minutes_validated && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px' }}>
                    <div 
                      style={{ 
                        border: '2px dashed var(--color-success)', 
                        color: 'var(--color-success)',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--color-success-bg)',
                        fontWeight: 700,
                        fontSize: '12px',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', marginBottom: '2px' }}>
                        <ShieldCheck size={16} /> VALIDÉ ET CONFORME
                      </div>
                      <div style={{ fontSize: '10.5px', fontWeight: 500 }}>Signé numériquement par {profiles.find(p => p.id === selectedMeeting.validated_by)?.first_name} {profiles.find(p => p.id === selectedMeeting.validated_by)?.last_name}</div>
                      <div style={{ fontSize: '9.5px', opacity: 0.8, marginTop: '4px' }}>Le {new Date(selectedMeeting.validated_at || '').toLocaleDateString('fr-FR')}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Planifier Réunion Modal */}
      {showPlanModal && (
        <div className="modal-overlay" onClick={() => setShowPlanModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <span className="modal-title">Planifier un Comité / Réunion</span>
              <button onClick={() => setShowPlanModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handlePlanMeetingSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Objet de la réunion *</label>
                  <input 
                    type="text" 
                    placeholder="ex: Staff technique de Cardiologie" 
                    value={meetTitle}
                    onChange={(e) => setMeetTitle(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Date *</label>
                    <input 
                      type="date" 
                      value={meetDate}
                      onChange={(e) => setMeetDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Heure *</label>
                    <input 
                      type="time" 
                      value={meetTime}
                      onChange={(e) => setMeetTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Lieu physique ou visio</label>
                  <input 
                    type="text" 
                    placeholder="ex: Salle Staff Cardio - Bloc B" 
                    value={meetLocation}
                    onChange={(e) => setMeetLocation(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Membres invités (Sélectionnez)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--color-border)', padding: '10px', borderRadius: '8px', backgroundColor: '#FFFFFF' }}>
                    {profiles.map(p => (
                      <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={meetParticipants.includes(p.id)}
                          onChange={() => toggleParticipant(p.id)}
                        />
                        <span>{p.first_name} {p.last_name} ({p.role})</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Ordre du Jour (Un sujet par ligne)</label>
                  <textarea 
                    rows={3} 
                    placeholder="ex: validation des plannings&#10;point d'avancement DPI&#10;divers" 
                    value={meetAgenda}
                    onChange={(e) => setMeetAgenda(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPlanModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Planifier la réunion</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rédiger PV Direct Modal */}
      {showDirectPVModal && (
        <div className="modal-overlay" onClick={() => setShowDirectPVModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <span className="modal-title">Rédiger un Procès-Verbal (PV) à la volée</span>
              <button onClick={() => setShowDirectPVModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateDirectPVSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Sujet / Objet de la réunion *</label>
                  <input 
                    type="text" 
                    placeholder="ex: Décisions urgentes - Cellule de crise sanitaire" 
                    value={pvTitle}
                    onChange={(e) => setPvTitle(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Date de Séance *</label>
                    <input 
                      type="date" 
                      value={pvDate}
                      onChange={(e) => setPvDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Lieu / Moyen de rencontre</label>
                    <input 
                      type="text" 
                      placeholder="ex: Bureau Direction ou Visioconférence" 
                      value={pvLocation}
                      onChange={(e) => setPvLocation(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Participants présents (Sélectionnez)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '110px', overflowY: 'auto', border: '1px solid var(--color-border)', padding: '10px', borderRadius: '8px', backgroundColor: '#FFFFFF' }}>
                    {profiles.map(p => (
                      <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={pvParticipants.includes(p.id)}
                          onChange={() => togglePvParticipant(p.id)}
                        />
                        <span>{p.first_name} {p.last_name} ({p.role})</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Ordre du Jour (Un sujet par ligne)</label>
                  <textarea 
                    rows={2} 
                    placeholder="ex: Bilan clinique&#10;Réorganisation des plannings" 
                    value={pvAgenda}
                    onChange={(e) => setPvAgenda(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Notes de séance / Synthèse du PV *</label>
                  <textarea 
                    rows={4} 
                    placeholder="Saisissez ici le contenu principal de votre procès-verbal, résumant les échanges et points clés..." 
                    value={pvNotes}
                    onChange={(e) => setPvNotes(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDirectPVModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Créer et enregistrer le PV</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
