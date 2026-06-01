import React, { useState } from 'react';
import { 
  Plus, Calendar, AlertTriangle, ArrowRight, MessageSquare, 
  ChevronRight, CornerDownRight, User, X
} from 'lucide-react';
import type { Task, Profile, PriorityLevel, TaskStatus } from '../types';
import { MockDatabase } from '../services/db';
import { Avatar } from './Avatar';

interface KanbanProps {
  projectId: string;
  currentUser: Profile;
  profiles: Profile[];
  tasks: Task[];
  onTaskStatusChange: (taskId: string, status: TaskStatus) => void;
  onAddTask: (title: string, description: string, assignedTo: string, priority: PriorityLevel, dueDate?: string) => void;
}

export const Kanban: React.FC<KanbanProps> = ({
  projectId,
  currentUser,
  profiles,
  tasks,
  onTaskStatusChange,
  onAddTask
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTaskDetail, setActiveTaskDetail] = useState<Task | null>(null);
  const [newComment, setNewComment] = useState('');
  
  // Formulaire nouvelle tâche
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAssignee, setNewAssignee] = useState(profiles[0]?.id || '');
  const [newPriority, setNewPriority] = useState<PriorityLevel>('normal');
  const [newDueDate, setNewDueDate] = useState('');

  const projectTasks = tasks.filter(t => t.project_id === projectId);

  const columns: { id: TaskStatus; title: string; color: string }[] = [
    { id: 'todo', title: 'À faire', color: '#86868B' },
    { id: 'in_progress', title: 'En cours', color: 'var(--color-primary)' },
    { id: 'pending', title: 'En attente', color: 'var(--color-warning)' },
    { id: 'done', title: 'Terminé', color: 'var(--color-success)' }
  ];

  const getAssigneeName = (id: string) => {
    const user = profiles.find(p => p.id === id);
    return user ? `${user.first_name} ${user.last_name}` : 'Non assigné';
  };

  const getAssigneeAvatar = (id: string) => {
    const user = profiles.find(p => p.id === id);
    return user?.avatar_url || 'U';
  };

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddTask(newTitle, newDesc, newAssignee, newPriority, newDueDate || undefined);
    
    // Reset form
    setNewTitle('');
    setNewDesc('');
    setNewAssignee(profiles[0]?.id || '');
    setNewPriority('normal');
    setNewDueDate('');
    setShowAddModal(false);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !activeTaskDetail) return;

    MockDatabase.addCommentToTask(activeTaskDetail.id, currentUser.id, newComment);
    setNewComment('');
    
    // Rafraîchir la tâche ouverte
    const updatedTasks = MockDatabase.getTasks();
    const updatedTask = updatedTasks.find(t => t.id === activeTaskDetail.id);
    if (updatedTask) setActiveTaskDetail(updatedTask);
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    return due < today;
  };

  const getPriorityBadgeClass = (prio: PriorityLevel) => {
    return `badge badge-${prio}`;
  };

  const getPriorityLabel = (prio: PriorityLevel) => {
    switch (prio) {
      case 'critical': return 'Critique ⚡';
      case 'high': return 'Haute ⚠';
      case 'normal': return 'Normale';
      case 'low': return 'Basse';
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onTaskStatusChange(taskId, status);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Kanban Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-main)' }}>Tableau des tâches</h3>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Glissez-déposez ou utilisez le sélecteur rapide pour mettre à jour l'avancement.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={14} /> Ajouter une tâche
        </button>
      </div>

      {/* Kanban Board Container */}
      <div className="kanban-board">
        {columns.map(col => {
          const colTasks = projectTasks.filter(t => t.status === col.id);
          return (
            <div 
              key={col.id} 
              className="kanban-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="kanban-column-header">
                <span className="kanban-column-title" style={{ color: col.color }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: col.color, display: 'inline-block' }} />
                  {col.title}
                </span>
                <span className="kanban-column-count">{colTasks.length}</span>
              </div>

              <div className="kanban-cards">
                {colTasks.length === 0 ? (
                  <div style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '11px', border: '1px dashed rgba(0,0,0,0.05)', borderRadius: '12px' }}>
                    Aucune tâche
                  </div>
                ) : (
                  colTasks.map(task => {
                    const isTaskOverdue = isOverdue(task.due_date) && task.status !== 'done';
                    return (
                      <div 
                        key={task.id} 
                        className="kanban-card"
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => setActiveTaskDetail(task)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <span className={getPriorityBadgeClass(task.priority)}>
                            {getPriorityLabel(task.priority)}
                          </span>
                          
                          {/* Column Mover Selector (Sûr & Pratique) */}
                          <select 
                            value={task.status}
                            onChange={(e) => {
                              e.stopPropagation();
                              onTaskStatusChange(task.id, e.target.value as TaskStatus);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              fontSize: '10px',
                              padding: '2px 4px',
                              borderRadius: '4px',
                              border: '1px solid var(--color-border)',
                              backgroundColor: '#FAFAFB',
                              fontWeight: 500,
                              cursor: 'pointer'
                            }}
                          >
                            <option value="todo">À faire</option>
                            <option value="in_progress">En cours</option>
                            <option value="pending">En attente</option>
                            <option value="done">Terminé</option>
                          </select>
                        </div>

                        <h4 className="kanban-card-title">{task.title}</h4>
                        {task.description && <p className="kanban-card-desc">{task.description}</p>}

                        <div className="kanban-card-footer">
                          {task.due_date ? (
                            <div 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '4px', 
                                fontSize: '10.5px', 
                                color: isTaskOverdue ? 'var(--color-danger)' : 'var(--color-text-muted)',
                                fontWeight: isTaskOverdue ? 700 : 500
                              }}
                            >
                              <Calendar size={11} />
                              <span>{new Date(task.due_date).toLocaleDateString('fr-FR', {month: 'short', day: 'numeric'})}</span>
                              {isTaskOverdue && <AlertTriangle size={11} />}
                            </div>
                          ) : <div />}

                          <div className="kanban-card-assignee">
                            <div className="kanban-card-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Avatar avatarUrl={profiles.find(p => p.id === task.assigned_to)?.avatar_url} fallbackText={profiles.find(p => p.id === task.assigned_to)?.first_name || 'U'} size="100%" fontSize="10px" />
                            </div>
                            <span style={{ maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {profiles.find(p => p.id === task.assigned_to)?.first_name}
                            </span>
                          </div>
                        </div>

                        {/* Task Comments Count Indicator */}
                        {task.comments && task.comments.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--color-text-muted)', borderTop: '1px solid rgba(0,0,0,0.03)', paddingTop: '6px', marginTop: '2px' }}>
                            <MessageSquare size={10} />
                            <span>{task.comments.length} commentaire{task.comments.length > 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tâche Détail & Commentaires Modal */}
      {activeTaskDetail && (
        <div className="modal-overlay" onClick={() => setActiveTaskDetail(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <span className="modal-title">Fiche de Tâche Opérationnelle</span>
              <button onClick={() => setActiveTaskDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <span className={getPriorityBadgeClass(activeTaskDetail.priority)} style={{ marginBottom: '8px' }}>
                  {getPriorityLabel(activeTaskDetail.priority)}
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-main)', marginTop: '4px' }}>
                  {activeTaskDetail.title}
                </h3>
              </div>

              <div style={{ backgroundColor: '#F5F5F7', borderRadius: '12px', padding: '16px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, color: '#86868B' }}>Responsable :</span>
                  <span style={{ fontWeight: 600 }}>{getAssigneeName(activeTaskDetail.assigned_to)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, color: '#86868B' }}>Échéance :</span>
                  <span style={{ fontWeight: 600, color: isOverdue(activeTaskDetail.due_date) ? 'var(--color-danger)' : 'inherit' }}>
                    {activeTaskDetail.due_date ? new Date(activeTaskDetail.due_date).toLocaleDateString('fr-FR', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'}) : 'Non spécifiée'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: '#86868B' }}>Statut :</span>
                  <select 
                    value={activeTaskDetail.status}
                    onChange={(e) => {
                      onTaskStatusChange(activeTaskDetail.id, e.target.value as TaskStatus);
                      // Mettre à jour l'instance locale affichée dans la modale
                      setActiveTaskDetail({ ...activeTaskDetail, status: e.target.value as TaskStatus });
                    }}
                    style={{
                      fontSize: '12px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                      backgroundColor: '#FFFFFF',
                      fontWeight: 600
                    }}
                  >
                    <option value="todo">À faire</option>
                    <option value="in_progress">En cours</option>
                    <option value="pending">En attente</option>
                    <option value="done">Terminé</option>
                  </select>
                </div>
              </div>

              {activeTaskDetail.description && (
                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#86868B', marginBottom: '6px' }}>Description</h4>
                  <p style={{ fontSize: '13.5px', color: '#2C2C2E', lineHeight: '1.5' }}>{activeTaskDetail.description}</p>
                </div>
              )}

              {/* SECTION COMMENTAIRES (TRAÇABILITÉ) */}
              <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#86868B', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MessageSquare size={14} /> Traçabilité / Échanges ({activeTaskDetail.comments?.length || 0})
                </h4>

                {/* Comment list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                  {!activeTaskDetail.comments || activeTaskDetail.comments.length === 0 ? (
                    <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Aucun commentaire historique pour le moment.</p>
                  ) : (
                    activeTaskDetail.comments.map(c => {
                      const commUser = profiles.find(p => p.id === c.user_id);
                      return (
                        <div key={c.id} style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
                            <Avatar avatarUrl={commUser?.avatar_url} fallbackText={commUser?.first_name || 'U'} size="100%" fontSize="9px" />
                          </div>
                          <div style={{ flex: 1, backgroundColor: '#F2F2F7', padding: '6px 10px', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontWeight: 600 }}>
                              <span>{commUser ? `${commUser.first_name} ${commUser.last_name}` : 'Utilisateur'}</span>
                              <span style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>{new Date(c.created_at).toLocaleDateString('fr-FR')} {new Date(c.created_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}</span>
                            </div>
                            <p style={{ color: '#3A3A3C', lineHeight: '1.4' }}>{c.content}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Comment Form */}
                <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="Ajouter une précision / note de traçabilité..." 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '12.5px', outline: 'none' }}
                  />
                  <button type="submit" className="btn btn-secondary" style={{ padding: '8px 12px' }} disabled={!newComment.trim()}>
                    Ajouter
                  </button>
                </form>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setActiveTaskDetail(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* Ajouter Tâche Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Créer une Tâche Opérationnelle</span>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAddTaskSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Intitulé de la tâche *</label>
                  <input 
                    type="text" 
                    placeholder="ex: Rédiger le planning d'accueil des patients" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description détaillée</label>
                  <textarea 
                    rows={3} 
                    placeholder="Préciser les consignes, documents à consulter..." 
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Assigner à (Responsable Nominatif) *</label>
                  <select 
                    value={newAssignee} 
                    onChange={(e) => setNewAssignee(e.target.value)}
                    required
                  >
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.role})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Niveau de priorité</label>
                    <select 
                      value={newPriority} 
                      onChange={(e) => setNewPriority(e.target.value as PriorityLevel)}
                    >
                      <option value="low">Basse</option>
                      <option value="normal">Normale</option>
                      <option value="high">Haute ⚠</option>
                      <option value="critical">Critique ⚡</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Date d'échéance</label>
                    <input 
                      type="date" 
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Créer l'action</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
