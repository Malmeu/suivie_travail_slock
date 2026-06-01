import type { 
  Profile, Department, Group, Channel, Message, 
  DirectConversation, Project, Task, Meeting, 
  MeetingDecision, AppNotification, TaskComment, DocumentFile,
  PriorityLevel, TaskStatus
} from '../types';
import { supabase, toSupabaseDeptId } from './supabase';

// ==========================================
// SEED DATA - DONNÉES HOSPITALIÈRES
// ==========================================

const SEED_DEPARTMENTS: Department[] = [
  { id: 'dep_cardio', name: 'Cardiologie', code: 'CARD' },
  { id: 'dep_urgences', name: 'Urgences', code: 'URG' },
  { id: 'dep_admin', name: 'Administration', code: 'ADM' },
  { id: 'dep_tech', name: 'Services Techniques', code: 'TECH' }
];

const SEED_PROFILES: Profile[] = [
  {
    id: 'user_admin',
    first_name: 'Admin',
    last_name: 'Slock',
    email: 'admin.slock@hospital.fr',
    role: 'admin',
    avatar_url: 'AS',
    phone: '06 00 00 00 00',
    status: 'available',
    status_message: 'Support Technique',
    department_id: 'dep_admin',
    created_at: new Date(2026, 1, 1).toISOString()
  }
];

const SEED_GROUPS: Group[] = [];

const SEED_CHANNELS: Channel[] = [
  {
    id: 'chan_general',
    name: 'general',
    description: 'Discussions générales et coordination clinique à l\'Hôpital Saldae.',
    is_private: false,
    owner_id: 'user_admin',
    created_at: new Date().toISOString(),
    member_ids: ['user_1', 'user_2', 'user_3', 'user_4', 'user_5', 'user_admin']
  }
];

const SEED_PROJECTS: Project[] = [];

const SEED_TASKS: Task[] = [];

const SEED_MEETINGS: Meeting[] = [];

const SEED_DECISIONS: MeetingDecision[] = [];

const SEED_MESSAGES: Message[] = [];

const SEED_NOTIFICATIONS: AppNotification[] = [];

// ==========================================
// MOCK DATABASE & STATE MANAGEMENT (LOCAL)
// ==========================================

export class MockDatabase {
  static {
    const cleanFlag = localStorage.getItem('slock_clean_v5');
    if (!cleanFlag) {
      localStorage.removeItem('slock_profiles');
      localStorage.removeItem('slock_groups');
      localStorage.removeItem('slock_channels');
      localStorage.removeItem('slock_projects');
      localStorage.removeItem('slock_tasks');
      localStorage.removeItem('slock_meetings');
      localStorage.removeItem('slock_decisions');
      localStorage.removeItem('slock_messages');
      localStorage.removeItem('slock_notifications');
      localStorage.removeItem('slock_direct_conversations');
      localStorage.removeItem('slock_current_user');
      localStorage.setItem('slock_clean_v5', 'true');
    }
  }

  private static load<T>(key: string, defaultValue: T): T {
    const data = localStorage.getItem(`slock_${key}`);
    if (!data) {
      localStorage.setItem(`slock_${key}`, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(data);
  }

  public static save<T>(key: string, data: T): void {
    localStorage.setItem(`slock_${key}`, JSON.stringify(data));
    // Déclencher un événement système pour simuler le temps réel
    window.dispatchEvent(new CustomEvent(`slock_update_${key}`, { detail: data }));
  }

  // --- GETTERS & SETTERS INDIVIDUELS ---

  static getProfiles(): Profile[] {
    return this.load('profiles', SEED_PROFILES);
  }

  static getDepartments(): Department[] {
    return this.load('departments', SEED_DEPARTMENTS);
  }

  static getGroups(): Group[] {
    return this.load('groups', SEED_GROUPS);
  }

  static saveGroups(groups: Group[]) {
    this.save('groups', groups);
  }

  static getChannels(): Channel[] {
    return this.load('channels', SEED_CHANNELS);
  }

  static saveChannels(channels: Channel[]) {
    this.save('channels', channels);
  }

  static getProjects(): Project[] {
    return this.load('projects', SEED_PROJECTS);
  }

  static saveProjects(projects: Project[]) {
    this.save('projects', projects);
  }

  static getTasks(): Task[] {
    return this.load('tasks', SEED_TASKS);
  }

  static saveTasks(tasks: Task[]) {
    this.save('tasks', tasks);
  }

  static getMeetings(): Meeting[] {
    return this.load('meetings', SEED_MEETINGS);
  }

  static saveMeetings(meetings: Meeting[]) {
    this.save('meetings', meetings);
  }

  static getDecisions(): MeetingDecision[] {
    return this.load('decisions', SEED_DECISIONS);
  }

  static saveDecisions(decisions: MeetingDecision[]) {
    this.save('decisions', decisions);
  }

  static getMessages(): Message[] {
    return this.load('messages', SEED_MESSAGES);
  }

  static saveMessages(messages: Message[]) {
    this.save('messages', messages);
  }

  static getNotifications(userId: string): AppNotification[] {
    const all = this.load('notifications', SEED_NOTIFICATIONS);
    return all.filter(n => n.user_id === userId);
  }

  static saveNotifications(notifications: AppNotification[]) {
    this.save('notifications', notifications);
  }

  static getDocuments(): DocumentFile[] {
    return this.load('documents', []);
  }

  static saveDocuments(docs: DocumentFile[]) {
    this.save('documents', docs);
  }

  static getDirectConversations(): DirectConversation[] {
    return this.load('direct_conversations', []);
  }

  static saveDirectConversations(convs: DirectConversation[]) {
    this.save('direct_conversations', convs);
  }

  static getOrCreateDirectConversation(user1Id: string, user2Id: string): DirectConversation {
    const convs = this.getDirectConversations();
    const existing = convs.find(c => 
      c.member_ids.includes(user1Id) && c.member_ids.includes(user2Id) && c.member_ids.length === 2
    );
    if (existing) {
      return existing;
    }

    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `3e54b6d8-${Math.random().toString(36).substring(2, 6)}-4f24-9b1b-${Math.random().toString(36).substring(2, 14)}`;
    const newConv: DirectConversation = {
      id: newId,
      member_ids: [user1Id, user2Id],
      created_at: new Date().toISOString()
    };

    convs.push(newConv);
    this.saveDirectConversations(convs);

    if (supabase) {
      const client = supabase;
      client.from('direct_conversations').insert([{
        id: newConv.id,
        created_at: newConv.created_at
      }]).then(({ error }) => {
        if (error) {
          console.warn("Supabase background DM insert error:", error.message);
          return;
        }
        
        const membersData = newConv.member_ids.map(pId => ({
          conversation_id: newConv.id,
          profile_id: pId
        }));
        client.from('direct_conversation_members').insert(membersData).then(({ error: memErr }) => {
          if (memErr) console.warn("Supabase background DM members insert error:", memErr.message);
        });
      });
    }

    return newConv;
  }

  // --- GESTION DE L'UTILISATEUR ACTUEL (POUR LE BASCULEMENT DE RÔLE & AUTH) ---

  static getCurrentUser(): Profile | null {
    const user = localStorage.getItem('slock_current_user');
    if (!user) {
      return null;
    }
    return JSON.parse(user);
  }

  static setCurrentUser(user: Profile | null): void {
    if (user === null) {
      localStorage.removeItem('slock_current_user');
    } else {
      localStorage.setItem('slock_current_user', JSON.stringify(user));
    }
    window.dispatchEvent(new CustomEvent('slock_user_changed', { detail: user }));
    
    // Synchro du profil modifié vers Supabase
    if (user && supabase) {
      supabase.from('profiles').upsert([{
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url,
        phone: user.phone,
        status: user.status,
        status_message: user.status_message,
        department_id: toSupabaseDeptId(user.department_id)
      }]).then(({ error }) => {
        if (error) console.warn("Supabase background status update error:", error.message);
      });
    }
  }

  static logout(): void {
    this.setCurrentUser(null);
  }

  static registerLocal(firstName: string, lastName: string, email: string, role: string, departmentId: string): Profile {
    const profiles = this.getProfiles();
    const newProfile: Profile = {
      id: `usr_${Date.now()}`,
      first_name: firstName,
      last_name: lastName,
      email: email,
      role: role as any,
      avatar_url: `https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=100`, // Avatar médecin par défaut
      phone: "+33 6 00 00 00 00",
      status: 'available',
      status_message: 'Disponible',
      department_id: departmentId,
      created_at: new Date().toISOString()
    };
    
    profiles.push(newProfile);
    this.save('profiles', profiles);

    // Si Supabase est connecté, créer aussi le profil dans Supabase en arrière-plan
    if (supabase) {
      supabase.from('profiles').upsert([{
        ...newProfile,
        department_id: toSupabaseDeptId(newProfile.department_id)
      }]).then(({ error }) => {
        if (error) console.warn("Supabase background profile insert error:", error.message);
      });
    }

    return newProfile;
  }

  // --- OPÉRATIONS MÉTIER EN DIRECT AVEC SYNCHRO SUPABASE ---

  static sendMessage(channelId: string | undefined, dmId: string | undefined, senderId: string, content: string, type: 'normal' | 'important' | 'urgent' = 'normal', parentId?: string): Message {
    const messages = this.getMessages();
    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      channel_id: channelId,
      direct_conversation_id: dmId,
      sender_id: senderId,
      content,
      type,
      parent_id: parentId,
      created_at: new Date().toISOString(),
      reactions: [],
      read_by: [senderId]
    };
    
    messages.push(newMsg);
    this.saveMessages(messages);

    // --- SYNCHRO ARRIERE-PLAN SUPABASE ---
    if (supabase) {
      supabase.from('messages').insert([{
        id: newMsg.id,
        channel_id: newMsg.channel_id,
        direct_conversation_id: newMsg.direct_conversation_id,
        sender_id: newMsg.sender_id,
        content: newMsg.content,
        type: newMsg.type,
        parent_id: newMsg.parent_id,
        created_at: newMsg.created_at
      }]).then(({ error }) => {
        if (error) console.warn("Supabase background message insert error (As-tu exécuté le script SQL dans Supabase ?):", error.message);
      });
    }

    // Détecter les mentions et envoyer des notifications
    if (content.includes('@')) {
      const profiles = this.getProfiles();
      profiles.forEach(p => {
        const mentionTag = `@${p.first_name}`;
        if (content.toLowerCase().includes(mentionTag.toLowerCase()) && p.id !== senderId) {
          this.createNotification(
            p.id,
            'mention',
            'Nouvelle mention',
            `${this.getCurrentUser()?.first_name || 'Un collègue'} vous a mentionné dans un message.`,
            '#messages'
          );
        }
      });
    }

    return newMsg;
  }

  static createNotification(userId: string, type: AppNotification['type'], title: string, content: string, link: string): void {
    const all = this.load('notifications', SEED_NOTIFICATIONS);
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      user_id: userId,
      type,
      title,
      content,
      link_to: link,
      is_read: false,
      created_at: new Date().toISOString()
    };
    all.push(newNotif);
    this.saveNotifications(all);

    // --- SYNCHRO ARRIERE-PLAN SUPABASE ---
    if (supabase) {
      supabase.from('notifications').insert([{
        id: newNotif.id,
        user_id: newNotif.user_id,
        type: newNotif.type,
        title: newNotif.title,
        content: newNotif.content,
        link_to: newNotif.link_to,
        is_read: newNotif.is_read,
        created_at: newNotif.created_at
      }]).then(({ error }) => {
        if (error) console.warn("Supabase background notification insert error:", error.message);
      });
    }
  }

  static createTask(projectId: string, title: string, description: string, assignedTo: string, createdBy: string, priority: PriorityLevel, dueDate?: string, meetingId?: string): Task {
    const tasks = this.getTasks();
    const newTask: Task = {
      id: `task_${Date.now()}`,
      project_id: projectId,
      title,
      description,
      assigned_to: assignedTo,
      created_by: createdBy,
      priority,
      status: 'todo',
      due_date: dueDate,
      meeting_id: meetingId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      comments: []
    };
    tasks.push(newTask);
    this.saveTasks(tasks);

    // --- SYNCHRO ARRIERE-PLAN SUPABASE ---
    if (supabase) {
      supabase.from('tasks').insert([{
        id: newTask.id,
        project_id: newTask.project_id,
        title: newTask.title,
        description: newTask.description,
        assigned_to: newTask.assigned_to,
        created_by: newTask.created_by,
        due_date: newTask.due_date,
        priority: newTask.priority,
        status: newTask.status,
        meeting_id: newTask.meeting_id,
        created_at: newTask.created_at,
        updated_at: newTask.updated_at
      }]).then(({ error }) => {
        if (error) console.warn("Supabase background task insert error:", error.message);
      });
    }

    // Mettre à jour l'avancement global du projet
    this.recalculateProjectProgress(projectId);

    // Notification à l'assigné
    if (assignedTo !== createdBy) {
      this.createNotification(
        assignedTo,
        'task_assign',
        'Nouvelle tâche assignée',
        `Vous avez été assigné à : "${title}"`,
        '#projects'
      );
    }

    return newTask;
  }

  static updateTaskStatus(taskId: string, status: TaskStatus): void {
    const tasks = this.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      task.status = status;
      task.updated_at = new Date().toISOString();
      this.saveTasks(tasks);
      this.recalculateProjectProgress(task.project_id);

      // --- SYNCHRO ARRIERE-PLAN SUPABASE ---
      if (supabase) {
        supabase.from('tasks').update({
          status: task.status,
          updated_at: task.updated_at
        }).eq('id', task.id).then(({ error }) => {
          if (error) console.warn("Supabase background task update error:", error.message);
        });
      }
    }
  }

  static addCommentToTask(taskId: string, userId: string, content: string): void {
    const tasks = this.getTasks();
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      if (!task.comments) task.comments = [];
      const newComment = {
        id: `com_${Date.now()}`,
        task_id: taskId,
        user_id: userId,
        content,
        created_at: new Date().toISOString()
      };
      task.comments.push(newComment);
      task.updated_at = new Date().toISOString();
      this.saveTasks(tasks);

      // --- SYNCHRO ARRIERE-PLAN SUPABASE ---
      if (supabase) {
        supabase.from('task_comments').insert([{
          id: newComment.id,
          task_id: newComment.task_id,
          user_id: newComment.user_id,
          content: newComment.content,
          created_at: newComment.created_at
        }]).then(({ error }) => {
          if (error) console.warn("Supabase background comment insert error:", error.message);
        });
      }
    }
  }

  private static recalculateProjectProgress(projectId: string): void {
    const tasks = this.getTasks().filter(t => t.project_id === projectId && t.status !== 'cancelled');
    if (tasks.length === 0) return;
    
    const doneTasks = tasks.filter(t => t.status === 'done').length;
    const progress = Math.round((doneTasks / tasks.length) * 100);
    
    const projects = this.getProjects();
    const proj = projects.find(p => p.id === projectId);
    if (proj) {
      proj.progress_percent = progress;
      this.saveProjects(projects);

      // --- SYNCHRO ARRIERE-PLAN SUPABASE ---
      if (supabase) {
        supabase.from('projects').update({
          progress_percent: proj.progress_percent
        }).eq('id', proj.id).then(({ error }) => {
          if (error) console.warn("Supabase background project progress update error:", error.message);
        });
      }
    }
  }

  static saveMinutes(meetingId: string, notes: string, decisions: string[], newTasks: {title: string, assignedTo: string, priority: PriorityLevel, dueDate?: string}[]): void {
    const meetings = this.getMeetings();
    const meet = meetings.find(m => m.id === meetingId);
    if (meet) {
      meet.notes = notes;
      this.saveMeetings(meetings);

      // --- SYNCHRO ARRIERE-PLAN SUPABASE ---
      if (supabase) {
        supabase.from('meetings').update({
          notes: meet.notes
        }).eq('id', meet.id).then(({ error }) => {
          if (error) console.warn("Supabase background meeting notes update error:", error.message);
        });
      }
      
      // Enregistrer les décisions
      let allDecisions = this.getDecisions();
      // Supprimer anciennes décisions de cette réunion pour écraser propre
      allDecisions = allDecisions.filter(d => d.meeting_id !== meetingId);
      
      decisions.forEach((decContent, index) => {
        if (decContent.trim()) {
          const newDec = {
            id: `dec_${meetingId}_${index}`,
            meeting_id: meetingId,
            content: decContent,
            created_at: new Date().toISOString()
          };
          allDecisions.push(newDec);

          // Pousser vers Supabase
          if (supabase) {
            supabase.from('meeting_decisions').upsert([newDec]).then(({ error }) => {
              if (error) console.warn("Supabase background decision upsert error:", error.message);
            });
          }
        }
      });
      this.saveDecisions(allDecisions);

      // Créer les tâches associées
      newTasks.forEach(t => {
        if (t.title.trim()) {
          this.createTask(
            meet.project_id || 'proj_dpi', // Projet par défaut s'il n'y en a pas de lié
            t.title,
            `Créée à partir de la réunion "${meet.title}"`,
            t.assignedTo,
            meet.organizer_id,
            t.priority,
            t.dueDate,
            meetingId
          );
        }
      });
    }
  }

  static validateMinutes(meetingId: string, validatorId: string): void {
    const meetings = this.getMeetings();
    const meet = meetings.find(m => m.id === meetingId);
    if (meet) {
      meet.is_minutes_validated = true;
      meet.validated_by = validatorId;
      meet.validated_at = new Date().toISOString();
      this.saveMeetings(meetings);

      // --- SYNCHRO ARRIERE-PLAN SUPABASE ---
      if (supabase) {
        supabase.from('meetings').update({
          is_minutes_validated: meet.is_minutes_validated,
          validated_by: meet.validated_by,
          validated_at: meet.validated_at
        }).eq('id', meet.id).then(({ error }) => {
          if (error) console.warn("Supabase background validate minutes error:", error.message);
        });
      }

      // Notifier les participants
      meet.participant_ids.forEach(pId => {
        if (pId !== validatorId) {
          this.createNotification(
            pId,
            'minutes_validated',
            'PV Validé',
            `Le PV de la réunion "${meet.title}" a été validé par le président.`,
            '#meetings'
          );
        }
      });
    }
  }

  // --- RECHERCHE MULTI-MODALE ---

  static searchGlobal(query: string): any[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    
    const results: any[] = [];
    
    // Rechercher les utilisateurs
    this.getProfiles().forEach(u => {
      if (u.first_name.toLowerCase().includes(q) || u.last_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) {
        results.push({ type: 'profile', title: `${u.first_name} ${u.last_name}`, subtitle: u.status_message || u.role, item: u });
      }
    });

    // Rechercher les projets
    this.getProjects().forEach(p => {
      if (p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) {
        results.push({ type: 'project', title: p.name, subtitle: `Projet - Statut: ${p.status}`, item: p });
      }
    });

    // Rechercher les tâches
    this.getTasks().forEach(t => {
      if (t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) {
        results.push({ type: 'task', title: t.title, subtitle: `Tâche - Statut: ${t.status}`, item: t });
      }
    });

    // Rechercher les réunions
    this.getMeetings().forEach(m => {
      if (m.title.toLowerCase().includes(q) || (m.notes && m.notes.toLowerCase().includes(q))) {
        results.push({ type: 'meeting', title: m.title, subtitle: `Réunion - Date: ${m.date}`, item: m });
      }
    });

    // Rechercher dans les messages
    this.getMessages().forEach(m => {
      if (m.content.toLowerCase().includes(q)) {
        const sender = this.getProfiles().find(p => p.id === m.sender_id);
        results.push({ type: 'message', title: m.content, subtitle: `Message de ${sender?.first_name || 'Inconnu'}`, item: m });
      }
    });

    return results;
  }

  // --- SYNCHRONISATION EN UN CLIC DES DONNÉES DANS LE CLOUD SUPABASE (WOW FACTOR) ---

  public static async syncAllToSupabase(): Promise<{success: boolean, message: string}> {
    if (!supabase) {
      return { success: false, message: "Client Supabase non initialisé. Vérifiez vos variables .env" };
    }

    try {
      // 1. Pousser les départements
      const { error: depErr } = await supabase.from('departments').upsert(SEED_DEPARTMENTS);
      if (depErr) throw new Error(`Départements: ${depErr.message}`);

      // 2. Pousser les profils
      const { error: profErr } = await supabase.from('profiles').upsert(
        SEED_PROFILES.map(p => ({
          id: p.id,
          first_name: p.first_name,
          last_name: p.last_name,
          email: p.email,
          role: p.role,
          avatar_url: p.avatar_url,
          phone: p.phone,
          status: p.status,
          status_message: p.status_message,
          department_id: p.department_id
        }))
      );
      if (profErr) throw new Error(`Profils: ${profErr.message}`);

      // 3. Pousser les groupes
      const { error: grpErr } = await supabase.from('groups').upsert(
        SEED_GROUPS.map(g => ({
          id: g.id,
          name: g.name,
          description: g.description,
          type: g.type,
          owner_id: g.owner_id
        }))
      );
      if (grpErr) throw new Error(`Groupes: ${grpErr.message}`);

      // Pousser les liaisons des membres de groupes
      const groupLiaisons: any[] = [];
      SEED_GROUPS.forEach(g => {
        g.member_ids.forEach(pId => {
          groupLiaisons.push({ group_id: g.id, profile_id: pId });
        });
      });
      const { error: grpMemErr } = await supabase.from('group_members').upsert(groupLiaisons);
      if (grpMemErr) throw new Error(`Membres de groupes: ${grpMemErr.message}`);

      // 4. Pousser les canaux
      const { error: chanErr } = await supabase.from('channels').upsert(
        SEED_CHANNELS.map(c => ({
          id: c.id,
          group_id: c.group_id,
          name: c.name,
          description: c.description,
          is_private: c.is_private,
          owner_id: c.owner_id
        }))
      );
      if (chanErr) throw new Error(`Canaux: ${chanErr.message}`);

      // Pousser les membres des canaux
      const chanLiaisons: any[] = [];
      SEED_CHANNELS.forEach(c => {
        c.member_ids.forEach(pId => {
          chanLiaisons.push({ channel_id: c.id, profile_id: pId });
        });
      });
      const { error: chanMemErr } = await supabase.from('channel_members').upsert(chanLiaisons);
      if (chanMemErr) throw new Error(`Membres de canaux: ${chanMemErr.message}`);

      // 5. Pousser les projets
      const { error: projErr } = await supabase.from('projects').upsert(
        SEED_PROJECTS.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          department_id: p.department_id,
          sponsor: p.sponsor,
          manager_id: p.manager_id,
          scope: p.scope,
          start_date: p.start_date,
          end_date_planned: p.end_date_planned,
          status: p.status,
          priority: p.priority,
          progress_percent: p.progress_percent
        }))
      );
      if (projErr) throw new Error(`Projets: ${projErr.message}`);

      // Liaison des membres de projets
      const projLiaisons: any[] = [];
      SEED_PROJECTS.forEach(p => {
        p.member_ids.forEach(pId => {
          projLiaisons.push({ project_id: p.id, profile_id: pId });
        });
      });
      const { error: projMemErr } = await supabase.from('project_members').upsert(projLiaisons);
      if (projMemErr) throw new Error(`Membres de projets: ${projMemErr.message}`);

      // 6. Pousser les réunions
      const { error: meetErr } = await supabase.from('meetings').upsert(
        SEED_MEETINGS.map(m => ({
          id: m.id,
          project_id: m.project_id,
          title: m.title,
          date: m.date,
          time: m.time + ":00", // Format time PostgreSQL
          location: m.location,
          organizer_id: m.organizer_id,
          notes: m.notes,
          is_minutes_validated: m.is_minutes_validated,
          validated_by: m.validated_by,
          validated_at: m.validated_at
        }))
      );
      if (meetErr) throw new Error(`Réunions: ${meetErr.message}`);

      // Liaison des participants aux réunions
      const meetLiaisons: any[] = [];
      SEED_MEETINGS.forEach(m => {
        m.participant_ids.forEach(pId => {
          meetLiaisons.push({ meeting_id: m.id, profile_id: pId });
        });
      });
      const { error: meetMemErr } = await supabase.from('meeting_participants').upsert(meetLiaisons);
      if (meetMemErr) throw new Error(`Participants aux réunions: ${meetMemErr.message}`);

      // 7. Pousser les décisions de réunions
      const { error: decErr } = await supabase.from('meeting_decisions').upsert(SEED_DECISIONS);
      if (decErr) throw new Error(`Décisions: ${decErr.message}`);

      // 8. Pousser les tâches
      const { error: taskErr } = await supabase.from('tasks').upsert(
        SEED_TASKS.map(t => ({
          id: t.id,
          project_id: t.project_id,
          meeting_id: t.meeting_id,
          title: t.title,
          description: t.description,
          assigned_to: t.assigned_to,
          created_by: t.created_by,
          due_date: t.due_date,
          priority: t.priority,
          status: t.status
        }))
      );
      if (taskErr) throw new Error(`Tâches: ${taskErr.message}`);

      // 9. Pousser les messages
      const { error: msgErr } = await supabase.from('messages').upsert(
        SEED_MESSAGES.map(m => ({
          id: m.id,
          channel_id: m.channel_id,
          direct_conversation_id: m.direct_conversation_id,
          sender_id: m.sender_id,
          content: m.content,
          type: m.type,
          parent_id: m.parent_id,
          created_at: m.created_at
        }))
      );
      if (msgErr) throw new Error(`Messages: ${msgErr.message}`);

      return { 
        success: true, 
        message: "Félicitations ! L'ensemble de la base de données hospitalière locale (Départements, Profils, Groupes, Canaux, Messages, Tâches, Projets, Réunions et Décisions) a été synchronisé avec succès vers ton instance de production Supabase." 
      };

    } catch (err: any) {
      console.error("Supabase migration failed:", err.message);
      return { 
        success: false, 
        message: `La synchronisation a échoué : ${err.message}. As-tu bien collé les scripts SQL dans ton éditeur Supabase en premier ?` 
      };
    }
  }
}
