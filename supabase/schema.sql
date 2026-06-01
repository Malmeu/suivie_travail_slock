-- ==========================================
-- SCHEMA DE BASE DE DONNÉES SLOCK (SUPABASE)
-- ==========================================

-- Désactiver les triggers temporairement si nécessaire
SET statement_timeout = 0;
SET lock_timeout = 0;

-- 1. ENUMS & RÔLES
CREATE TYPE user_role AS ENUM ('admin', 'director', 'project_manager', 'service_head', 'collaborator', 'observer', 'architecte', 'dev_web', 'designer_3d', 'genie_civil', 'directeur_technique', 'logistique');
CREATE TYPE user_status AS ENUM ('available', 'on_duty', 'in_meeting', 'away', 'offline');
CREATE TYPE group_type AS ENUM ('service', 'project', 'committee', 'temporary');
CREATE TYPE message_priority AS ENUM ('normal', 'important', 'urgent');
CREATE TYPE project_status AS ENUM ('draft', 'preparing', 'active', 'paused', 'blocked', 'completed', 'archived');
CREATE TYPE priority_level AS ENUM ('low', 'normal', 'high', 'critical');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'pending', 'done', 'cancelled');
CREATE TYPE notification_type AS ENUM ('mention', 'message', 'group_add', 'task_assign', 'task_due', 'task_overdue', 'meeting_invite', 'minutes_validated', 'project_status');

-- 2. TABLES FONDAMENTALES (SERVICES & PROFITS)

-- Table des départements / services cliniques
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table des profils utilisateurs (liée à auth.users de Supabase)
CREATE TABLE profiles (
    id UUID PRIMARY KEY, -- Référence à auth.users.id
    first_name VARCHAR(150) NOT NULL,
    last_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role DEFAULT 'collaborator'::user_role NOT NULL,
    avatar_url VARCHAR(255),
    phone VARCHAR(50),
    status user_status DEFAULT 'available'::user_status NOT NULL,
    status_message VARCHAR(255),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. COMMUNICATION (GROUPES, CANAUX & MESSAGERIE)

-- Table des groupes de travail
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type group_type DEFAULT 'committee'::group_type NOT NULL,
    owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table de liaison des membres de groupes
CREATE TABLE group_members (
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, profile_id)
);

-- Table des canaux de discussion
CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE, -- Optionnel si canal global
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT FALSE NOT NULL,
    owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Membres des canaux
CREATE TABLE channel_members (
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (channel_id, profile_id)
);

-- Conversations directes (DM)
CREATE TABLE direct_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Membres de conversations directes
CREATE TABLE direct_conversation_members (
    conversation_id UUID REFERENCES direct_conversations(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (conversation_id, profile_id)
);

-- Table principale des messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    direct_conversation_id UUID REFERENCES direct_conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    type message_priority DEFAULT 'normal'::message_priority NOT NULL,
    parent_id UUID REFERENCES messages(id) ON DELETE CASCADE, -- Pour les threads
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT check_destination CHECK (
        (channel_id IS NOT NULL AND direct_conversation_id IS NULL) OR 
        (channel_id IS NULL AND direct_conversation_id IS NOT NULL)
    )
);

-- Lecture des messages (Accusés de lecture)
CREATE TABLE message_reads (
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (message_id, profile_id)
);

-- 4. GESTION DE PROJETS & TÂCHES

-- Table des projets
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    sponsor VARCHAR(255) NOT NULL,
    manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    scope TEXT,
    start_date DATE NOT NULL,
    end_date_planned DATE NOT NULL,
    status project_status DEFAULT 'preparing'::project_status NOT NULL,
    priority priority_level DEFAULT 'normal'::priority_level NOT NULL,
    progress_percent INT DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table historique des statuts de projet
CREATE TABLE project_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    old_status project_status,
    new_status project_status NOT NULL,
    changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    comment TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table des membres de projets
CREATE TABLE project_members (
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, profile_id)
);

-- Table des réunions
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE, -- Optionnel
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    organizer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    notes TEXT,
    highlights TEXT[],
    warnings TEXT[],
    next_meeting TEXT,
    is_minutes_validated BOOLEAN DEFAULT FALSE NOT NULL,
    validated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    validated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Participants aux réunions
CREATE TABLE meeting_participants (
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (meeting_id, profile_id)
);

-- Tâches / Actions opérationnelles
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL, -- Si générée depuis réunion
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    due_date DATE,
    priority priority_level DEFAULT 'normal'::priority_level NOT NULL,
    status task_status DEFAULT 'todo'::task_status NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table historique des modifications de tâche (traçabilité clinique complète)
CREATE TABLE task_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    column_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Commentaires des tâches
CREATE TABLE task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Décisions prises lors des réunions
CREATE TABLE meeting_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. DOCUMENTS, NOTIFICATIONS & AUDIT

-- Table des documents partagés
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    size INT NOT NULL,
    type VARCHAR(100) NOT NULL,
    url VARCHAR(255) NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    meeting_id UUID REFERENCES meetings(id) ON DELETE SET NULL,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table des notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    link_to VARCHAR(255) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Table d'audit de sécurité et de conformité hospitalière (Fichée et inaltérable par RLS)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- INDEX DE PERFORMANCE POUR TEMPS RÉEL
-- ==========================================
CREATE INDEX idx_messages_channel ON messages(channel_id);
CREATE INDEX idx_messages_dm ON messages(direct_conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_notifications_user ON notifications(user_id) WHERE is_read = FALSE;

-- ==========================================
-- TRIGGERS POUR AUTOMATISER updated_at
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_groups_modtime BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_modtime BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_modtime BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
