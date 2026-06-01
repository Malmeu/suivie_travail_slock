import React, { useState, useEffect } from 'react';
import { Users, Info, Plus, ChevronRight, MessageSquare, Clipboard, Folder, X } from 'lucide-react';
import type { Group, Profile, Channel } from '../types';
import { MockDatabase } from '../services/db';
import { Avatar } from '../components/Avatar';
import { supabase, toLocalDeptId } from '../services/supabase';

interface GroupsProps {
  currentUser: Profile;
}

export const Groups: React.FC<GroupsProps> = ({
  currentUser
}) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('group_1');
  const [channels, setChannels] = useState<Channel[]>([]);
  
  // Créer groupe modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [gName, setGName] = useState('');
  const [gDesc, setGDesc] = useState('');
  const [gType, setGType] = useState<'service' | 'project' | 'committee' | 'temporary'>('committee');
  const [gMembers, setGMembers] = useState<string[]>([]);

  const loadGroupsData = async () => {
    if (supabase) {
      try {
        const client = supabase;

        // 1. Charger les profils
        const { data: profData, error: profErr } = await client.from('profiles').select('*');
        if (!profErr && profData) {
          const loadedProfiles: Profile[] = profData.map(p => ({
            id: p.id,
            first_name: p.first_name,
            last_name: p.last_name,
            email: p.email,
            role: p.role,
            avatar_url: p.avatar_url || `https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=100`,
            phone: p.phone || "+33 6 00 00 00 00",
            status: (p.status === 'active' ? 'available' : p.status) || 'available',
            status_message: p.status_message || 'Disponible',
            department_id: toLocalDeptId(p.department_id) || 'dep_cardio',
            created_at: p.created_at || new Date().toISOString()
          }));
          setProfiles(loadedProfiles);
        }

        // 2. Charger les groupes
        const { data: grpData, error: grpErr } = await client.from('groups').select('*');
        if (!grpErr && grpData) {
          const loadedGroups = await Promise.all(grpData.map(async (g) => {
            const { data: members, error: memErr } = await client
              .from('group_members')
              .select('profile_id')
              .eq('group_id', g.id);
            
            const memberIds = !memErr && members ? members.map(m => m.profile_id) : [];
            
            return {
              id: g.id,
              name: g.name,
              description: g.description || '',
              type: g.type,
              owner_id: g.owner_id,
              created_at: g.created_at || new Date().toISOString(),
              member_ids: memberIds
            };
          }));
          setGroups(loadedGroups);
          if (loadedGroups.length > 0 && !selectedGroupId) {
            setSelectedGroupId(loadedGroups[0].id);
          }
        }

        // 3. Charger les canaux
        const { data: chanData, error: chanErr } = await client.from('channels').select('*');
        if (!chanErr && chanData) {
          const loadedChannels = await Promise.all(chanData.map(async (c) => {
            const { data: members, error: memErr } = await client
              .from('channel_members')
              .select('profile_id')
              .eq('channel_id', c.id);
            
            const memberIds = !memErr && members ? members.map(m => m.profile_id) : [];
            
            return {
              id: c.id,
              group_id: c.group_id || undefined,
              name: c.name,
              description: c.description || '',
              is_private: c.is_private || false,
              owner_id: c.owner_id,
              created_at: c.created_at || new Date().toISOString(),
              member_ids: memberIds
            };
          }));
          setChannels(loadedChannels);
        }
      } catch (err) {
        console.error("Erreur de chargement asynchrone Supabase :", err);
      }
    } else {
      // Fallback local hors ligne
      setGroups(MockDatabase.getGroups());
      setProfiles(MockDatabase.getProfiles());
      setChannels(MockDatabase.getChannels());
    }
  };

  useEffect(() => {
    loadGroupsData();

    // S'abonner aux notifications locales pour le mode fallback
    const handleGroupsUpdate = () => setGroups(MockDatabase.getGroups());
    const handleProfilesUpdate = () => setProfiles(MockDatabase.getProfiles());
    const handleChannelsUpdate = () => setChannels(MockDatabase.getChannels());

    window.addEventListener('slock_update_groups', handleGroupsUpdate);
    window.addEventListener('slock_update_profiles', handleProfilesUpdate);
    window.addEventListener('slock_update_channels', handleChannelsUpdate);

    return () => {
      window.removeEventListener('slock_update_groups', handleGroupsUpdate);
      window.removeEventListener('slock_update_profiles', handleProfilesUpdate);
      window.removeEventListener('slock_update_channels', handleChannelsUpdate);
    };
  }, []);

  const selectedGroup = groups.find(g => g.id === selectedGroupId) || groups[0];

  const getOwnerName = (ownerId: string) => {
    const user = profiles.find(p => p.id === ownerId);
    return user ? `${user.first_name} ${user.last_name}` : 'Inconnu';
  };

  const getGroupMembers = (memberIds: string[]) => {
    return memberIds.map(id => profiles.find(p => p.id === id)).filter(Boolean) as Profile[];
  };

  const getGroupTypeLabel = (type: Group['type']) => {
    switch (type) {
      case 'service': return 'Service Hospitalier';
      case 'committee': return 'Comité Scientifique';
      case 'project': return 'Groupe Projet';
      default: return 'Groupe Temporaire';
    }
  };

  const getGroupTypeColor = (type: Group['type']) => {
    switch (type) {
      case 'service': return 'var(--color-primary)';
      case 'committee': return 'var(--color-info)';
      case 'project': return 'var(--color-warning)';
      default: return 'var(--color-text-muted)';
    }
  };

  const handleCreateGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gName.trim()) return;

    const newGroupId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `group_${Date.now()}`;
    const memberIds = [currentUser.id, ...gMembers];

    const newGroup: Group = {
      id: newGroupId,
      name: gName,
      description: gDesc,
      type: gType,
      owner_id: currentUser.id,
      created_at: new Date().toISOString(),
      member_ids: memberIds
    };

    if (supabase) {
      try {
        const client = supabase;

        // 1. Créer le groupe dans Supabase
        const { error: grpErr } = await client.from('groups').insert([{
          id: newGroup.id,
          name: newGroup.name,
          description: newGroup.description,
          type: newGroup.type,
          owner_id: newGroup.owner_id,
          created_at: newGroup.created_at
        }]);
        if (grpErr) throw grpErr;

        // 2. Associer les membres au groupe
        const membersData = memberIds.map(pId => ({
          group_id: newGroup.id,
          profile_id: pId
        }));
        const { error: memErr } = await client.from('group_members').insert(membersData);
        if (memErr) throw memErr;

        // 3. Créer un canal de discussion officiel associé
        const newChanId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `chan_${Date.now()}`;
        const { error: chanErr } = await client.from('channels').insert([{
          id: newChanId,
          group_id: newGroup.id,
          name: gName.toLowerCase().replace(/\s+/g, '-'),
          description: `Canal de discussion officiel pour : ${gName}`,
          is_private: false,
          owner_id: currentUser.id,
          created_at: new Date().toISOString()
        }]);
        if (chanErr) throw chanErr;

        // 4. Associer les membres au canal
        const chanMembersData = memberIds.map(pId => ({
          channel_id: newChanId,
          profile_id: pId
        }));
        const { error: chanMemErr } = await client.from('channel_members').insert(chanMembersData);
        if (chanMemErr) throw chanMemErr;

        // Recharger les données directement depuis le cloud pour rafraîchir la liste et fermer
        await loadGroupsData();
        setSelectedGroupId(newGroup.id);
        setShowCreateModal(false);
      } catch (err: any) {
        alert(`Erreur lors du déploiement du groupe sur Supabase : ${err.message}`);
      }
    } else {
      // Fallback local hors ligne
      const updated = [...groups, newGroup];
      MockDatabase.saveGroups(updated);
      setGroups(updated);
      setSelectedGroupId(newGroup.id);
      setShowCreateModal(false);

      const channelsData = MockDatabase.getChannels();
      const newChannel: Channel = {
        id: `chan_${Date.now()}`,
        group_id: newGroup.id,
        name: gName.toLowerCase().replace(/\s+/g, '-'),
        description: `Canal de discussion officiel pour : ${gName}`,
        is_private: false,
        owner_id: currentUser.id,
        created_at: new Date().toISOString(),
        member_ids: memberIds
      };
      MockDatabase.saveChannels([...channelsData, newChannel]);
    }

    // Reset Form
    setGName('');
    setGDesc('');
    setGType('committee');
    setGMembers([]);
  };

  const toggleMemberSelection = (pId: string) => {
    const index = gMembers.indexOf(pId);
    if (index > -1) {
      setGMembers(gMembers.filter(id => id !== pId));
    } else {
      setGMembers([...gMembers, pId]);
    }
  };

  const groupChannels = channels.filter(c => c.group_id === selectedGroup?.id);

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.25s ease-out' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-main)' }}>Groupes de Travail & Comités</h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Cloisonnez la communication par service clinique, comité de spécialité ou groupe transverse.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={14} /> Créer un groupe
        </button>
      </div>

      {/* Grid: Left Groups, Right Selected Group details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', flex: 1 }}>
        
        {/* Left pane: list */}
        <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', alignSelf: 'flex-start' }}>
          <h3 style={{ fontSize: '14.5px', fontWeight: 700, borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '10px' }}>Espaces Cliniques</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {groups.map(g => {
              const isSelected = g.id === selectedGroupId;
              return (
                <div 
                  key={g.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: isSelected ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                    backgroundColor: isSelected ? 'var(--color-primary-light)' : '#FFFFFF',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.15s'
                  }}
                  onClick={() => setSelectedGroupId(g.id)}
                >
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? 'var(--color-primary)' : 'var(--color-text-main)' }}>{g.name}</h4>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: getGroupTypeColor(g.type), display: 'block', marginTop: '4px' }}>
                      {getGroupTypeLabel(g.type)}
                    </span>
                  </div>
                  <ChevronRight size={14} style={{ color: isSelected ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right pane: selected group details */}
        {selectedGroup && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'white', backgroundColor: getGroupTypeColor(selectedGroup.type), padding: '2px 8px', borderRadius: '10px' }}>
                  {getGroupTypeLabel(selectedGroup.type)}
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-main)', marginTop: '8px' }}>{selectedGroup.name}</h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px', lineHeight: '1.4' }}>{selectedGroup.description}</p>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                Créé par : <strong>{getOwnerName(selectedGroup.owner_id)}</strong>
              </div>
            </div>

            {/* Sub-grid of Group: Members & Channels */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              {/* Channels list of group */}
              <div style={{ backgroundColor: '#F5F5F7', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MessageSquare size={14} style={{ color: 'var(--color-primary)' }} />
                  Canaux de discussion associés
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {groupChannels.length === 0 ? (
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Aucun canal lié</span>
                  ) : (
                    groupChannels.map(c => (
                      <div 
                        key={c.id} 
                        style={{ 
                          padding: '8px 12px', 
                          backgroundColor: '#FFFFFF', 
                          borderRadius: '8px', 
                          border: '1px solid var(--color-border)',
                          fontSize: '12.5px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>#</span>
                        <span style={{ fontWeight: 600 }}>{c.name}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Members of group */}
              <div style={{ backgroundColor: '#F5F5F7', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={14} style={{ color: 'var(--color-primary)' }} />
                  Membres de l'espace ({selectedGroup.member_ids.length})
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                  {getGroupMembers(selectedGroup.member_ids).map(m => (
                    <div 
                      key={m.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        fontSize: '12px',
                        padding: '4px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px'
                      }}
                    >
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, overflow: 'hidden' }}>
                        <Avatar avatarUrl={m.avatar_url} fallbackText={m.first_name[0]} size="100%" fontSize="9px" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600 }}>{m.first_name} {m.last_name}</span>
                        <span style={{ fontSize: '8.5px', color: 'var(--color-text-muted)' }}>{m.status_message || m.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Créer Groupe Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Créer un Espace de Travail Clinique</span>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateGroupSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nom du groupe de travail *</label>
                  <input 
                    type="text" 
                    placeholder="ex: Comité d'Éthique Médicale" 
                    value={gName}
                    onChange={(e) => setGName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description des objectifs de l'espace</label>
                  <textarea 
                    rows={3} 
                    placeholder="Préciser à quel service ou projet ce groupe s'adresse..." 
                    value={gDesc}
                    onChange={(e) => setGDesc(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Type de structure clinique</label>
                  <select 
                    value={gType} 
                    onChange={(e) => setGType(e.target.value as any)}
                  >
                    <option value="service">Service Clinique Dédié</option>
                    <option value="committee">Comité de Coordination / Éthique</option>
                    <option value="project">Comité Projet Transverse</option>
                    <option value="temporary">Comité Temporaire / Crise</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Inviter des membres (Sélectionnez)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--color-border)', padding: '10px', borderRadius: '8px', backgroundColor: '#FFFFFF' }}>
                    {profiles.filter(p => p.id !== currentUser.id).map(p => (
                      <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={gMembers.includes(p.id)}
                          onChange={() => toggleMemberSelection(p.id)}
                        />
                        <span>{p.first_name} {p.last_name} ({p.role})</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary">Créer l'espace</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
