import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, AlertTriangle, Info, Smile, ThumbsUp, Heart, Check, 
  MessageSquare, X, Lock, Hash, Users, Paperclip
} from 'lucide-react';
import type { Profile, Channel, Message } from '../types';
import { MockDatabase } from '../services/db';
import { Avatar } from './Avatar';

interface ChatProps {
  currentUser: Profile;
  activeChannel: Channel | null;
}

export const Chat: React.FC<ChatProps> = ({
  currentUser,
  activeChannel
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [priority, setPriority] = useState<'normal' | 'important' | 'urgent'>('normal');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeThreadParent, setActiveThreadParent] = useState<Message | null>(null);
  const [threadText, setThreadText] = useState('');

  // DM State
  const [dmSearchQuery, setDmSearchQuery] = useState('');
  const [activeDmConversation, setActiveDmConversation] = useState<any>(null);
  const [activeDms, setActiveDms] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);

  // Charger les messages, les profils et les DMs
  useEffect(() => {
    const loadChat = () => {
      setProfiles(MockDatabase.getProfiles());
      const allMsgs = MockDatabase.getMessages();
      const allDms = MockDatabase.getDirectConversations().filter(c => c.member_ids.includes(currentUser.id));
      setActiveDms(allDms);

      if (activeChannel) {
        setMessages(allMsgs.filter(m => m.channel_id === activeChannel.id && !m.parent_id));
      } else if (activeDmConversation) {
        setMessages(allMsgs.filter(m => m.direct_conversation_id === activeDmConversation.id && !m.parent_id));
      } else {
        setMessages([]);
      }
    };

    loadChat();

    // S'abonner aux nouveaux messages
    const handleMessagesUpdate = () => {
      const allMsgs = MockDatabase.getMessages();
      const allDms = MockDatabase.getDirectConversations().filter(c => c.member_ids.includes(currentUser.id));
      setActiveDms(allDms);

      if (activeChannel) {
        setMessages(allMsgs.filter(m => m.channel_id === activeChannel.id && !m.parent_id));
      } else if (activeDmConversation) {
        setMessages(allMsgs.filter(m => m.direct_conversation_id === activeDmConversation.id && !m.parent_id));
      } else {
        setMessages([]);
      }
      
      // Mettre à jour le parent du fil si ouvert
      if (activeThreadParent) {
        const updatedParent = allMsgs.find(m => m.id === activeThreadParent.id);
        if (updatedParent) setActiveThreadParent(updatedParent);
      }
    };

    const handleDmsUpdate = () => {
      const allDms = MockDatabase.getDirectConversations().filter(c => c.member_ids.includes(currentUser.id));
      setActiveDms(allDms);
    };

    window.addEventListener('slock_update_messages', handleMessagesUpdate);
    window.addEventListener('slock_update_direct_conversations', handleDmsUpdate);

    return () => {
      window.removeEventListener('slock_update_messages', handleMessagesUpdate);
      window.removeEventListener('slock_update_direct_conversations', handleDmsUpdate);
    };
  }, [activeChannel, activeDmConversation, activeThreadParent, currentUser]);

  // Défilement automatique vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThreadParent]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (activeChannel) {
      MockDatabase.sendMessage(activeChannel.id, undefined, currentUser.id, inputText, priority);
    } else if (activeDmConversation) {
      MockDatabase.sendMessage(undefined, activeDmConversation.id, currentUser.id, inputText, priority);
    }
    
    setInputText('');
    setPriority('normal');
  };

  const handleSendThreadReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!threadText.trim() || !activeThreadParent) return;

    if (activeChannel) {
      MockDatabase.sendMessage(activeChannel.id, undefined, currentUser.id, threadText, 'normal', activeThreadParent.id);
    } else if (activeDmConversation) {
      MockDatabase.sendMessage(undefined, activeDmConversation.id, currentUser.id, threadText, 'normal', activeThreadParent.id);
    }
    
    setThreadText('');
  };

  const handleStartDirectConversation = (otherUserId: string) => {
    const newConv = MockDatabase.getOrCreateDirectConversation(currentUser.id, otherUserId);
    setActiveDmConversation(newConv);
    setDmSearchQuery('');
    
    // Forcer la mise à jour de la liste
    const dms = MockDatabase.getDirectConversations().filter(c => c.member_ids.includes(currentUser.id));
    setActiveDms(dms);
  };

  const getLastMessageForDm = (dmId: string) => {
    const allMsgs = MockDatabase.getMessages().filter(m => m.direct_conversation_id === dmId);
    if (allMsgs.length === 0) return null;
    return allMsgs[allMsgs.length - 1];
  };

  const getThreadReplies = (parentId: string) => {
    return MockDatabase.getMessages().filter(m => m.parent_id === parentId);
  };

  const toggleReaction = (messageId: string, emoji: string) => {
    const allMsgs = MockDatabase.getMessages();
    const msg = allMsgs.find(m => m.id === messageId);
    if (msg) {
      if (!msg.reactions) msg.reactions = [];
      const reactIndex = msg.reactions.findIndex(r => r.emoji === emoji);
      
      if (reactIndex > -1) {
        const userIndex = msg.reactions[reactIndex].user_ids.indexOf(currentUser.id);
        if (userIndex > -1) {
          // Enlever la réaction
          msg.reactions[reactIndex].user_ids.splice(userIndex, 1);
          if (msg.reactions[reactIndex].user_ids.length === 0) {
            msg.reactions.splice(reactIndex, 1);
          }
        } else {
          // Ajouter l'utilisateur à la réaction existante
          msg.reactions[reactIndex].user_ids.push(currentUser.id);
        }
      } else {
        // Créer une nouvelle réaction
        msg.reactions.push({ emoji, user_ids: [currentUser.id] });
      }
      
      MockDatabase.saveMessages(allMsgs);
    }
  };

  const getSenderName = (senderId: string) => {
    const user = profiles.find(p => p.id === senderId);
    return user ? `${user.first_name} ${user.last_name}` : 'Utilisateur inconnu';
  };

  const getSenderAvatar = (senderId: string) => {
    const user = profiles.find(p => p.id === senderId);
    return user?.avatar_url || 'U';
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const getChannelMembersCount = () => {
    if (activeChannel) return activeChannel.member_ids.length;
    return profiles.length;
  };

  const otherMemberId = activeDmConversation?.member_ids.find((id: string) => id !== currentUser.id) || '';
  const otherUser = profiles.find(p => p.id === otherMemberId);

  return (
    <div className="chat-layout" style={{ display: 'grid', gridTemplateColumns: activeChannel ? '1fr' : '260px 1fr', height: '100%', overflow: 'hidden' }}>
      
      {/* Left DM Sidebar (only if activeChannel is null) */}
      {!activeChannel && (
        <div style={{ borderRight: '1px solid var(--color-border)', backgroundColor: '#FAFAFB', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          {/* DM Sidebar Header */}
          <div style={{ padding: '16px 14px', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
            <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '8px' }}>Messagerie privée</h3>
            <input 
              type="text"
              placeholder="Rechercher un membre..."
              value={dmSearchQuery}
              onChange={(e) => setDmSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '6px 10px', fontSize: '12px', border: '1px solid var(--color-border)', borderRadius: '8px', outline: 'none' }}
            />
          </div>

          {/* DM Conversations & Members List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            
            {/* If searching, show matching members */}
            {dmSearchQuery.trim().length > 0 ? (
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', padding: '4px 8px' }}>Membres correspondants</div>
                {profiles
                  .filter(p => p.id !== currentUser.id && `${p.first_name} ${p.last_name}`.toLowerCase().includes(dmSearchQuery.toLowerCase()))
                  .map(p => (
                    <div 
                      key={p.id}
                      onClick={() => handleStartDirectConversation(p.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s',
                        marginBottom: '2px'
                      }}
                      className="dm-list-item-hover"
                    >
                      <div style={{ position: 'relative', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, overflow: 'hidden', flexShrink: 0 }}>
                        <Avatar avatarUrl={p.avatar_url} fallbackText={p.first_name[0]} size="100%" fontSize="9px" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.first_name} {p.last_name}</span>
                        <span style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>{p.status_message || p.role}</span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              /* Otherwise show active/recent conversations */
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', padding: '4px 8px' }}>Conversations récentes</div>
                {activeDms.length === 0 ? (
                  <div style={{ padding: '20px 8px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '11px', fontStyle: 'italic' }}>
                    Aucune discussion. Recherchez un collaborateur ci-dessus.
                  </div>
                ) : (
                  activeDms.map(dm => {
                    const otherId = dm.member_ids.find((id: string) => id !== currentUser.id) || '';
                    const otherU = profiles.find(p => p.id === otherId);
                    if (!otherU) return null;
                    const isSelected = activeDmConversation?.id === dm.id;
                    const lastMsg = getLastMessageForDm(dm.id);

                    return (
                      <div 
                        key={dm.id}
                        onClick={() => setActiveDmConversation(dm)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 8px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'var(--color-primary-light)' : 'transparent',
                          transition: 'background-color 0.15s',
                          marginBottom: '4px'
                        }}
                        className="dm-list-item-hover"
                      >
                        <div style={{ position: 'relative', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, overflow: 'hidden', flexShrink: 0 }}>
                          <Avatar avatarUrl={otherU.avatar_url} fallbackText={otherU.first_name[0]} size="100%" fontSize="10px" />
                          <div 
                            style={{ 
                              position: 'absolute', 
                              bottom: 0, 
                              right: 0, 
                              width: '8px', 
                              height: '8px', 
                              borderRadius: '50%', 
                              backgroundColor: otherU.status === 'available' ? 'var(--color-success)' : otherU.status === 'on_duty' ? 'var(--color-danger)' : otherU.status === 'in_meeting' ? 'var(--color-warning)' : 'var(--color-text-muted)',
                              border: '1px solid white' 
                            }} 
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
                          <span style={{ fontSize: '12px', fontWeight: isSelected ? 700 : 600, color: isSelected ? 'var(--color-primary)' : 'var(--color-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {otherU.first_name} {otherU.last_name}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {lastMsg ? lastMsg.content : (otherU.status_message || 'Démarrer la discussion')}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Right Chat Area */}
      {activeChannel || activeDmConversation ? (
        <div className="chat-room" style={{ display: 'flex', flexDirection: 'row', flex: 1, overflow: 'hidden', height: '100%' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', overflow: 'hidden' }}>
            {/* Chat Room Header */}
            <div className="chat-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {activeChannel ? (
                  <>
                    {activeChannel.is_private ? <Lock size={16} style={{ color: 'var(--color-text-muted)' }} /> : <Hash size={16} style={{ color: 'var(--color-text-muted)' }} />}
                    <div>
                      <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--color-text-main)' }}>
                        {activeChannel.name}
                      </h3>
                      <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '1px' }}>
                        {activeChannel.description}
                      </p>
                    </div>
                  </>
                ) : otherUser ? (
                  <>
                    <div style={{ position: 'relative', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, overflow: 'hidden' }}>
                      <Avatar avatarUrl={otherUser.avatar_url} fallbackText={otherUser.first_name[0]} size="100%" fontSize="12px" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {otherUser.first_name} {otherUser.last_name}
                        <span 
                          style={{ 
                            width: '7px', 
                            height: '7px', 
                            borderRadius: '50%', 
                            backgroundColor: otherUser.status === 'available' ? 'var(--color-success)' : otherUser.status === 'on_duty' ? 'var(--color-danger)' : otherUser.status === 'in_meeting' ? 'var(--color-warning)' : 'var(--color-text-muted)',
                            display: 'inline-block'
                          }} 
                        />
                      </h3>
                      <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '1px' }}>
                        {otherUser.status_message || (otherUser.status === 'available' ? 'Disponible' : otherUser.status === 'on_duty' ? 'En Garde' : 'Occupé')} • {otherUser.role}
                      </p>
                    </div>
                  </>
                ) : null}
              </div>
              {activeChannel && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--color-text-muted)', fontWeight: 500, backgroundColor: 'rgba(0,0,0,0.03)', padding: '4px 10px', borderRadius: '20px' }}>
                  <Users size={12} />
                  <span>{getChannelMembersCount()} membres</span>
                </div>
              )}
            </div>

            {/* Messages List Area */}
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div style={{ margin: 'auto', textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
                  <MessageSquare size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
                  <p style={{ fontSize: '13px', fontWeight: 500 }}>Début de l'historique de discussion.</p>
                  <p style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>Envoyez un message pour démarrer.</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isSelf = msg.sender_id === currentUser.id;
                  const repliesCount = getThreadReplies(msg.id).length;
                  return (
                    <div key={msg.id} className={`message-item ${isSelf ? 'self' : ''}`}>
                      {!isSelf && (
                        <div className="message-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Avatar avatarUrl={profiles.find(p => p.id === msg.sender_id)?.avatar_url} fallbackText={profiles.find(p => p.id === msg.sender_id)?.first_name || 'U'} size="100%" fontSize="11px" />
                        </div>
                      )}
                      
                      <div className="message-body">
                        <div className="message-info">
                          <span className="message-sender">{getSenderName(msg.sender_id)}</span>
                          <span className="message-time">{formatTime(msg.created_at)}</span>
                          {msg.type !== 'normal' && (
                            <span className={`message-badge message-badge-${msg.type}`}>
                              {msg.type}
                            </span>
                          )}
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: isSelf ? 'flex-end' : 'flex-start' }}>
                          <div className="message-bubble-wrapper">
                            <p className="message-content">{msg.content}</p>
                          </div>
                          
                          {/* Reactions and Actions strip */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                            <button 
                              onClick={() => setActiveThreadParent(msg)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '10.5px',
                                fontWeight: 600,
                                color: 'var(--color-primary)'
                              }}
                            >
                              <MessageSquare size={10} />
                              <span>{repliesCount > 0 ? `${repliesCount} rép.` : 'Répondre'}</span>
                            </button>

                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                              <button onClick={() => toggleReaction(msg.id, '👍')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px' }}>👍</button>
                              <button onClick={() => toggleReaction(msg.id, '❤️')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px' }}>❤️</button>
                              <button onClick={() => toggleReaction(msg.id, '✓')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px' }}>✓</button>
                            </div>

                            {msg.reactions && msg.reactions.map((r, ri) => (
                              <div 
                                key={ri}
                                onClick={() => toggleReaction(msg.id, r.emoji)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                  padding: '1px 5px',
                                  borderRadius: '6px',
                                  backgroundColor: r.user_ids.includes(currentUser.id) ? 'var(--color-primary-light)' : 'rgba(0,0,0,0.04)',
                                  border: `1px solid ${r.user_ids.includes(currentUser.id) ? 'rgba(0,122,255,0.2)' : 'transparent'}`,
                                  fontSize: '10px',
                                  cursor: 'pointer',
                                  fontWeight: 700
                                }}
                              >
                                <span>{r.emoji}</span>
                                <span style={{ color: r.user_ids.includes(currentUser.id) ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>{r.user_ids.length}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Form */}
            <form className="message-input-area" onSubmit={handleSendMessage}>
              <div className="message-input-box">
                <textarea 
                  placeholder={activeChannel ? `Écrire dans #${activeChannel.name}... (Entrée pour envoyer)` : `Écrire à ${otherUser?.first_name}... (Entrée pour envoyer)`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  rows={1}
                />
                
                <div className="message-input-tools">
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '4px 8px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: priority === 'urgent' ? 'var(--color-danger-bg)' : priority === 'important' ? 'var(--color-warning-bg)' : 'rgba(0,0,0,0.05)',
                      color: priority === 'urgent' ? 'var(--color-danger)' : priority === 'important' ? 'var(--color-warning)' : 'var(--color-text-main)',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="normal">Normal ✉</option>
                    <option value="important">Important ⚠</option>
                    <option value="urgent">Urgent ⚡</option>
                  </select>

                  <button 
                    type="button" 
                    className="header-btn" 
                    style={{ padding: '4px' }}
                    onClick={() => alert("Simulé : Dépôt de fichier. Les documents sont gérés dans l'onglet Projets/Réunions.")}
                  >
                    <Paperclip size={14} />
                  </button>

                  <button 
                    type="submit" 
                    style={{
                      border: 'none',
                      backgroundColor: 'var(--color-primary)',
                      color: 'white',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    disabled={!inputText.trim()}
                  >
                    <Send size={12} />
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Side Threads Pane (Apple Panel style) */}
          {activeThreadParent && (
            <div 
              style={{
                width: '320px',
                borderLeft: '1px solid var(--color-border)',
                backgroundColor: '#FAFAFB',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                animation: 'fadeIn 0.2s ease-out'
              }}
            >
              {/* Thread Header */}
              <div style={{ height: '56px', borderBottom: '1px solid var(--color-border)', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-main)' }}>Fil de discussion</span>
                <button 
                  onClick={() => setActiveThreadParent(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Original Parent Message Card */}
              <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', backgroundColor: '#FFFFFF' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, overflow: 'hidden' }}>
                    <Avatar avatarUrl={profiles.find(p => p.id === activeThreadParent.sender_id)?.avatar_url} fallbackText={profiles.find(p => p.id === activeThreadParent.sender_id)?.first_name || 'U'} size="100%" fontSize="10px" />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700 }}>{getSenderName(activeThreadParent.sender_id)}</span>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{formatTime(activeThreadParent.created_at)}</span>
                    </div>
                    <p style={{ fontSize: '12.5px', color: '#2C2C2E', lineHeight: '1.4' }}>{activeThreadParent.content}</p>
                  </div>
                </div>
              </div>

              {/* Thread Replies List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {getThreadReplies(activeThreadParent.id).length === 0 ? (
                  <div style={{ margin: 'auto', textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)', fontSize: '11.5px' }}>
                    Aucune réponse pour le moment.
                  </div>
                ) : (
                  getThreadReplies(activeThreadParent.id).map(rep => (
                    <div key={rep.id} style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, overflow: 'hidden' }}>
                        <Avatar avatarUrl={profiles.find(p => p.id === rep.sender_id)?.avatar_url} fallbackText={profiles.find(p => p.id === rep.sender_id)?.first_name || 'U'} size="100%" fontSize="9px" />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', backgroundColor: '#FFFFFF', padding: '8px 12px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700 }}>{getSenderName(rep.sender_id)}</span>
                          <span style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>{formatTime(rep.created_at)}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#2C2C2E', lineHeight: '1.4' }}>{rep.content}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={threadEndRef} />
              </div>

              {/* Thread Reply Input Form */}
              <form style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)', backgroundColor: '#FFFFFF' }} onSubmit={handleSendThreadReply}>
                <div style={{ display: 'flex', gap: '8px', backgroundColor: '#F2F2F7', borderRadius: '12px', padding: '6px 10px', alignItems: 'center' }}>
                  <input 
                    type="text"
                    placeholder="Répondre..."
                    value={threadText}
                    onChange={(e) => setThreadText(e.target.value)}
                    style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '12px', outline: 'none' }}
                  />
                  <button 
                    type="submit"
                    style={{ border: 'none', background: 'none', color: 'var(--color-primary)', cursor: 'pointer', padding: '2px' }}
                    disabled={!threadText.trim()}
                  >
                    <Send size={14} />
                  </button>
                </div>
              </form>
            </div>
          )}
          
        </div>
      ) : (
        /* Left DM sidebar select user welcome dashboard screen */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px', backgroundColor: '#FAFAFB', flex: 1 }}>
          <div style={{ backgroundColor: 'var(--color-primary-light)', padding: '20px', borderRadius: '50%', color: 'var(--color-primary)', marginBottom: '16px' }}>
            <MessageSquare size={36} />
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '4px' }}>Messagerie privée et sécurisée</h3>
          <p style={{ fontSize: '12.5px', color: 'var(--color-text-muted)', textAlign: 'center', maxWidth: '360px', lineHeight: '1.4' }}>
            Sélectionnez une discussion récente ou recherchez un collaborateur inscrit sur la plateforme pour démarrer une conversation privée instantanée.
          </p>
        </div>
      )}
    </div>
  );
};
