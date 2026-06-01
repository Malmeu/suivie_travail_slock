import React, { useState, useEffect } from 'react';
import { 
  Briefcase, CheckSquare, Clock, User, AlertTriangle, 
  TrendingUp, Compass, Target, Layers, Plus, X
} from 'lucide-react';
import type { Project, Profile, Task, PriorityLevel, TaskStatus } from '../types';
import { MockDatabase } from '../services/db';
import { Kanban } from '../components/Kanban';

interface ProjectsProps {
  currentUser: Profile;
}

export const Projects: React.FC<ProjectsProps> = ({
  currentUser
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('proj_dpi');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);

  // Formulaire nouveau projet
  const [pName, setPName] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pSponsor, setPSponsor] = useState('');
  const [pManager, setPManager] = useState('');
  const [pPriority, setPPriority] = useState<PriorityLevel>('normal');
  const [pStartDate, setPStartDate] = useState('');
  const [pEndDate, setPEndDate] = useState('');
  const [pObjectives, setPObjectives] = useState('');

  useEffect(() => {
    const loadProjectsData = () => {
      setProjects(MockDatabase.getProjects());
      setTasks(MockDatabase.getTasks());
      const allProfiles = MockDatabase.getProfiles();
      setProfiles(allProfiles);
      
      // Sélectionner le manager par défaut si vide
      if (allProfiles.length > 0 && !pManager) {
        setPManager(allProfiles[0].id);
      }
    };

    loadProjectsData();

    // S'abonner aux mises à jour
    const handleProjectsUpdate = () => setProjects(MockDatabase.getProjects());
    const handleTasksUpdate = () => setTasks(MockDatabase.getTasks());

    window.addEventListener('slock_update_projects', handleProjectsUpdate);
    window.addEventListener('slock_update_tasks', handleTasksUpdate);

    return () => {
      window.removeEventListener('slock_update_projects', handleProjectsUpdate);
      window.removeEventListener('slock_update_tasks', handleTasksUpdate);
    };
  }, [pManager]);

  const handleTaskStatusChange = (taskId: string, status: TaskStatus) => {
    MockDatabase.updateTaskStatus(taskId, status);
    // Rafraîchir les tâches locales
    setTasks(MockDatabase.getTasks());
    setProjects(MockDatabase.getProjects());
  };

  const handleAddTask = (title: string, description: string, assignedTo: string, priority: PriorityLevel, dueDate?: string) => {
    MockDatabase.createTask(selectedProjectId, title, description, assignedTo, currentUser.id, priority, dueDate);
    // Rafraîchir
    setTasks(MockDatabase.getTasks());
    setProjects(MockDatabase.getProjects());
  };

  const handleAddProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim()) return;

    const listObjectives = pObjectives.split('\n').filter(o => o.trim().length > 0);

    const newProject: Project = {
      id: `proj_${Date.now()}`,
      name: pName,
      description: pDesc,
      department_id: currentUser.department_id || 'dep_admin',
      sponsor: pSponsor || 'Non précisé',
      manager_id: pManager,
      member_ids: [currentUser.id, pManager],
      objectives: listObjectives.length > 0 ? listObjectives : ['Objectif pilote à définir'],
      start_date: pStartDate || new Date().toISOString().split('T')[0],
      end_date_planned: pEndDate || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
      status: 'preparing',
      priority: pPriority,
      progress_percent: 0,
      created_at: new Date().toISOString()
    };

    const updatedProjects = [...projects, newProject];
    MockDatabase.saveProjects(updatedProjects);

    // Mettre à jour et sélectionner le nouveau projet
    setProjects(updatedProjects);
    setSelectedProjectId(newProject.id);
    setShowAddProjectModal(false);

    // Reset Form
    setPName('');
    setPDesc('');
    setPSponsor('');
    setPPriority('normal');
    setPStartDate('');
    setPEndDate('');
    setPObjectives('');
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  const getStatusBadge = (status: Project['status']) => {
    switch (status) {
      case 'active':
        return <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>En cours</span>;
      case 'paused':
        return <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>En attente</span>;
      case 'completed':
        return <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}>Terminé</span>;
      default:
        return <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', backgroundColor: 'rgba(0,0,0,0.05)', color: 'var(--color-text-muted)' }}>Préparation</span>;
    }
  };

  const getProjectManagerName = (managerId: string) => {
    const mgr = profiles.find(p => p.id === managerId);
    return mgr ? `${mgr.first_name} ${mgr.last_name}` : 'Inconnu';
  };

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.25s ease-out' }}>
      
      {/* Upper Area: Project Selector Carousel / Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-main)' }}>Projets Hospitaliers Organisés</h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Sélectionnez un projet pour voir ses indicateurs cliniques et piloter ses tâches.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddProjectModal(true)}>
          <Plus size={14} /> Nouveau projet
        </button>
      </div>

      {/* Grid of Projects (Apple Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {projects.map(p => {
          const isSelected = p.id === selectedProjectId;
          return (
            <div 
              key={p.id}
              className={`card ${isSelected ? 'selected-project-card' : ''}`}
              style={{
                cursor: 'pointer',
                border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                backgroundColor: isSelected ? 'var(--color-primary-light)' : '#FFFFFF',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)'
              }}
              onClick={() => setSelectedProjectId(p.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={`badge badge-${p.priority}`} style={{ fontSize: '9px' }}>
                  {p.priority === 'critical' ? 'Critique ⚡' : p.priority === 'high' ? 'Important ⚠' : 'Standard'}
                </span>
                {getStatusBadge(p.status)}
              </div>

              <div>
                <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: isSelected ? 'var(--color-primary)' : 'var(--color-text-main)', lineHeight: '1.4' }}>
                  {p.name}
                </h3>
                <p style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', marginTop: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {p.description}
                </p>
              </div>

              {/* Progress bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                  <span>Progression</span>
                  <span>{p.progress_percent}%</span>
                </div>
                <div style={{ height: '6px', width: '100%', backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${p.progress_percent}%`, backgroundColor: 'var(--color-primary)', borderRadius: '3px', transition: 'width 0.3s ease' }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedProject && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '24px', marginTop: '12px' }}>
          {/* Left Panel: Project details / KPIs */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignSelf: 'flex-start' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-main)' }}>Fiche d'identité</h3>
              <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Fiche de pilotage de coordination.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12.5px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Compass size={14} style={{ color: 'var(--color-text-muted)' }} />
                <span><strong>Sponsor :</strong> {selectedProject.sponsor}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={14} style={{ color: 'var(--color-text-muted)' }} />
                <span><strong>Chef de projet :</strong> {getProjectManagerName(selectedProject.manager_id)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={14} style={{ color: 'var(--color-text-muted)' }} />
                <span><strong>Fin prévue :</strong> {new Date(selectedProject.end_date_planned).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>

            {/* Objectives */}
            <div>
              <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#86868B', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Target size={12} /> Objectifs principaux
              </h4>
              <ul style={{ paddingLeft: '16px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px', color: '#2C2C2E' }}>
                {selectedProject.objectives.map((obj, index) => (
                  <li key={index}>{obj}</li>
                ))}
              </ul>
            </div>

            {/* Simulated Live KPIs */}
            {selectedProject.indicators && selectedProject.indicators.length > 0 && (
              <div>
                <h4 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#86868B', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingUp size={12} /> Indicateurs clés
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedProject.indicators.map((ind, index) => (
                    <div 
                      key={index}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: ind.status === 'alert' ? 'var(--color-danger-bg)' : ind.status === 'warning' ? 'var(--color-warning-bg)' : 'var(--color-success-bg)',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '11.5px'
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{ind.label}</span>
                      <strong style={{ color: ind.status === 'alert' ? 'var(--color-danger)' : ind.status === 'warning' ? 'var(--color-warning)' : 'var(--color-success)' }}>
                        {ind.value}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Nested Kanban Component */}
          <div className="card" style={{ padding: '24px' }}>
            <Kanban 
              projectId={selectedProject.id}
              currentUser={currentUser}
              profiles={profiles}
              tasks={tasks}
              onTaskStatusChange={handleTaskStatusChange}
              onAddTask={handleAddTask}
            />
          </div>
        </div>
      )}

      {/* Ajouter Projet Modal */}
      {showAddProjectModal && (
        <div className="modal-overlay" onClick={() => setShowAddProjectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Lancer un Nouveau Projet Clinique</span>
              <button onClick={() => setShowAddProjectModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAddProjectSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nom du projet *</label>
                  <input 
                    type="text" 
                    placeholder="ex: Réfection du circuit du médicament aux Blocs" 
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description des enjeux</label>
                  <textarea 
                    rows={3} 
                    placeholder="Pourquoi ce projet ? En quoi va-t-il optimiser la coordination..." 
                    value={pDesc}
                    onChange={(e) => setPDesc(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Commanditaire / Sponsor *</label>
                  <input 
                    type="text" 
                    placeholder="ex: Dr. Pierre Meyer (Directeur Médical)" 
                    value={pSponsor}
                    onChange={(e) => setPSponsor(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Chef de projet *</label>
                  <select 
                    value={pManager} 
                    onChange={(e) => setPManager(e.target.value)}
                    required
                  >
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.role})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Date de début</label>
                    <input 
                      type="date" 
                      value={pStartDate}
                      onChange={(e) => setPStartDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Fin prévisionnelle</label>
                    <input 
                      type="date" 
                      value={pEndDate}
                      onChange={(e) => setPEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Niveau de priorité d'urgence</label>
                  <select 
                    value={pPriority} 
                    onChange={(e) => setPPriority(e.target.value as PriorityLevel)}
                  >
                    <option value="low">Normale</option>
                    <option value="normal">Intermédiaire</option>
                    <option value="high">Haute ⚠</option>
                    <option value="critical">Critique ⚡ (Priorité Absolue)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Objectifs cibles (Un par ligne)</label>
                  <textarea 
                    rows={3} 
                    placeholder="ex: Former 100% de l'équipe de garde&#10;Réduire l'erreur médicamenteuse de 10%&#10;Acheter le mobilier de bloc" 
                    value={pObjectives}
                    onChange={(e) => setPObjectives(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddProjectModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Lancer le projet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
