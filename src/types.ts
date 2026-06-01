export type UserRole = 'admin' | 'director' | 'project_manager' | 'service_head' | 'collaborator' | 'observer' | 'architecte' | 'dev_web' | 'designer_3d' | 'genie_civil' | 'directeur_technique' | 'logistique';

export type UserStatus = 'available' | 'on_duty' | 'in_meeting' | 'away' | 'offline';

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  status: UserStatus;
  status_message?: string;
  department_id?: string;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  manager_id?: string;
}

export type GroupType = 'service' | 'project' | 'committee' | 'temporary';

export interface Group {
  id: string;
  name: string;
  description: string;
  type: GroupType;
  owner_id: string;
  created_at: string;
  member_ids: string[];
  project_id?: string;
}

export interface Channel {
  id: string;
  group_id?: string; // Si lié à un groupe de travail, sinon global
  name: string;
  description?: string;
  is_private: boolean;
  owner_id: string;
  created_at: string;
  member_ids: string[];
}

export type MessageType = 'normal' | 'important' | 'urgent';

export interface MessageReaction {
  emoji: string;
  user_ids: string[];
}

export interface Message {
  id: string;
  channel_id?: string;
  direct_conversation_id?: string;
  sender_id: string;
  content: string;
  type: MessageType;
  parent_id?: string; // Pour les fils de discussion (threads)
  created_at: string;
  attachments?: {
    name: string;
    url: string;
    size: number;
    type: string;
  }[];
  reactions?: MessageReaction[];
  read_by?: string[];
}

export interface DirectConversation {
  id: string;
  member_ids: string[];
  created_at: string;
}

export type ProjectStatus = 'draft' | 'preparing' | 'active' | 'paused' | 'blocked' | 'completed' | 'archived';
export type PriorityLevel = 'low' | 'normal' | 'high' | 'critical';

export interface Project {
  id: string;
  name: string;
  description: string;
  department_id: string;
  sponsor: string;
  manager_id: string;
  member_ids: string[];
  objectives: string[];
  scope?: string;
  start_date: string;
  end_date_planned: string;
  status: ProjectStatus;
  priority: PriorityLevel;
  progress_percent: number;
  indicators?: {
    label: string;
    value: string;
    status: 'good' | 'warning' | 'alert';
  }[];
  created_at: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'pending' | 'done' | 'cancelled';

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string;
  meeting_id?: string; // Réunion source si applicable
  assigned_to: string; // ID utilisateur
  created_by: string; // ID utilisateur
  due_date?: string;
  priority: PriorityLevel;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
  comments?: TaskComment[];
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string; // ex: Salle B3 ou Visio Teams
  organizer_id: string;
  participant_ids: string[];
  agenda: string[];
  notes?: string;
  is_minutes_validated: boolean;
  validated_by?: string;
  validated_at?: string;
  created_at: string;
  project_id?: string;
}

export interface MeetingDecision {
  id: string;
  meeting_id: string;
  content: string;
  created_at: string;
}

export interface MeetingAction {
  id: string;
  meeting_id: string;
  task_id: string; // Tâche générée associée
  created_at: string;
}

export interface DocumentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  project_id?: string;
  meeting_id?: string;
  group_id?: string;
  uploaded_by: string;
  created_at: string;
}

export type NotificationType = 'mention' | 'message' | 'group_add' | 'task_assign' | 'task_due' | 'task_overdue' | 'meeting_invite' | 'minutes_validated' | 'project_status';

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  content: string;
  link_to: string; // URL ou hash de navigation
  is_read: boolean;
  created_at: string;
}
