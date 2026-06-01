-- ==========================================
-- POLITIQUES DE SECURITE RLS (ROW LEVEL SECURITY)
-- ==========================================

-- Activer la RLS sur l'ensemble des tables critiques
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 1. PROFILES & DEPARTMENTS
-- ==========================================

-- Tout le monde (y compris les invites en demo) peut consulter l'annuaire des profils
CREATE POLICY "Annuaire accessible a tous" ON profiles
    FOR SELECT USING (true);

-- Permettre la creation de profil lors de l'inscription
CREATE POLICY "Creation de profil autorisee" ON profiles
    FOR INSERT WITH CHECK (true);

-- Un utilisateur ne peut modifier que son propre profil (ex: disponibilité de garde)
CREATE POLICY "Modification propre profil uniquement" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Les départements sont lisibles par tous
CREATE POLICY "Departements lisibles" ON departments
    FOR SELECT USING (auth.role() = 'authenticated');

-- Seul l'admin peut modifier la structure des départements
CREATE POLICY "Admin gère les départements" ON departments
    AS RESTRICTIVE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ==========================================
-- 2. GROUPES DE TRAVAIL & CANAUX (CLOISONNEMENT)
-- ==========================================

-- Un groupe n'est visible que par ses membres ou l'admin
CREATE POLICY "Groupes visibles par les membres" ON groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM group_members 
            WHERE group_id = groups.id AND profile_id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Seul un Manager, Directeur ou Admin peut créer un groupe
CREATE POLICY "Création de groupe restreinte" ON groups
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'director', 'project_manager', 'service_head')
        )
    );

-- Un canal de discussion n'est visible que par ses membres ou l'admin
CREATE POLICY "Canaux visibles par les membres" ON channels
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM channel_members 
            WHERE channel_id = channels.id AND profile_id = auth.uid()
        ) OR (
            channels.is_private = FALSE AND 
            EXISTS (
                SELECT 1 FROM group_members 
                WHERE group_id = channels.group_id AND profile_id = auth.uid()
            )
        ) OR EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ==========================================
-- 3. MESSAGERIE (CLOISONNEMENT STRICT DES ECHANGES)
-- ==========================================

-- Un message direct (DM) n'est visible que par ses participants
CREATE POLICY "DM visibles uniquement par les membres" ON messages
    FOR SELECT USING (
        (direct_conversation_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM direct_conversation_members 
            WHERE conversation_id = direct_conversation_id AND profile_id = auth.uid()
        )) OR
        (channel_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM channel_members 
            WHERE channel_id = messages.channel_id AND profile_id = auth.uid()
        ))
    );

-- Seul un membre du canal ou de la conversation de DM peut insérer un message
CREATE POLICY "Envoi de message restreint aux membres" ON messages
    FOR INSERT WITH CHECK (
        (channel_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM channel_members 
            WHERE channel_id = messages.channel_id AND profile_id = auth.uid()
        )) OR
        (direct_conversation_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM direct_conversation_members 
            WHERE conversation_id = direct_conversation_id AND profile_id = auth.uid()
        ))
    );

-- ==========================================
-- 4. PROJETS & SUIVI DE TACHES
-- ==========================================

-- Un projet n'est visible que par les membres affectés, les directeurs ou admins
CREATE POLICY "Projets visibles par l'équipe" ON projects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM project_members 
            WHERE project_id = projects.id AND profile_id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'director')
        )
    );

-- Une tâche n'est visible que si l'utilisateur a accès au projet parent
CREATE POLICY "Tâches visibles via projet" ON tasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM project_members 
            WHERE project_id = tasks.project_id AND profile_id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'director')
        )
    );

-- Seul le manager de projet ou l'assigné peut mettre à jour une tâche
CREATE POLICY "Mise à jour de tâche sécurisée" ON tasks
    FOR UPDATE USING (
        assigned_to = auth.uid() OR 
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM projects 
            WHERE id = tasks.project_id AND manager_id = auth.uid()
        )
    );

-- ==========================================
-- 5. REUNIONS & PV DE REUNION
-- ==========================================

-- Un PV de réunion n'est visible que par les invités ou membres du projet lié
CREATE POLICY "Réunions visibles par les invités" ON meetings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM meeting_participants 
            WHERE meeting_id = meetings.id AND profile_id = auth.uid()
        ) OR (
            project_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM project_members 
                WHERE project_id = meetings.project_id AND profile_id = auth.uid()
            )
        )
    );

-- Seul l'organisateur de réunion ou un directeur peut valider et signer le PV
CREATE POLICY "Habilitation signature PV" ON meetings
    FOR UPDATE USING (
        organizer_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'director')
        )
    );

-- ==========================================
-- 6. REGISTRE D'AUDIT (INALTERABLE)
-- ==========================================

-- Seul le rôle Administrateur ou Direction peut lire les logs d'audit
CREATE POLICY "Lecture des logs d'audit réservée" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'director')
        )
    );

-- Aucun utilisateur ne peut modifier ou effacer les logs d'audit (Figé à vie)
CREATE POLICY "Logs d'audit inaltérables" ON audit_logs
    FOR UPDATE USING (FALSE);
    
CREATE POLICY "Logs d'audit insupprimables" ON audit_logs
    FOR DELETE USING (FALSE);
