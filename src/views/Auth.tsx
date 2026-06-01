import React, { useState } from 'react';
import { Mail, Lock, User, Hospital, Activity, ArrowRight, ShieldAlert, Check } from 'lucide-react';
import { MockDatabase } from '../services/db';
import { supabase, toSupabaseDeptId, toLocalDeptId } from '../services/supabase';
import type { Profile } from '../types';

interface AuthProps {
  onAuthSuccess: (user: Profile) => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [role, setRole] = useState<string>('collaborator');
  const [departmentId, setDepartmentId] = useState<string>('dep_cardio');
  
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Liste des profils de démonstration pour connexion rapide (WOW factor)
  const demoProfiles = MockDatabase.getProfiles().slice(0, 5);

  const handleDemoLogin = (profile: Profile) => {
    setLoading(true);
    setTimeout(() => {
      MockDatabase.setCurrentUser(profile);
      onAuthSuccess(profile);
      setLoading(false);
    }, 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isLogin) {
      // --- LOGIQUE DE CONNEXION ---
      if (supabase) {
        // Authentification réelle via Supabase
        try {
          const { data, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (authError) throw authError;

          if (data.user) {
            // Récupérer le profil correspondant depuis la base
            const { data: profileData, error: profError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();

            if (profError || !profileData) {
              // Si le profil n'existe pas encore mais que le compte est valide, créer un profil par défaut
              const newProfile: Profile = {
                id: data.user.id,
                first_name: email.split('@')[0],
                last_name: 'Saldae',
                email: email,
                role: 'collaborator',
                avatar_url: `https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=100`,
                phone: "+33 6 00 00 00 00",
                status: 'available',
                status_message: 'Disponible',
                department_id: 'dep_cardio',
                created_at: new Date().toISOString()
              };
              await supabase.from('profiles').upsert([{
                ...newProfile,
                department_id: toSupabaseDeptId(newProfile.department_id)
              }]);
              MockDatabase.setCurrentUser(newProfile);
              onAuthSuccess(newProfile);
            } else {
              // Profil trouvé, on synchronise avec la session locale
              const activeProfile: Profile = {
                id: profileData.id,
                first_name: profileData.first_name,
                last_name: profileData.last_name,
                email: profileData.email,
                role: profileData.role,
                avatar_url: profileData.avatar_url || `https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=100`,
                phone: profileData.phone || "+33 6 00 00 00 00",
                status: (profileData.status === 'active' ? 'available' : profileData.status) || 'available',
                status_message: profileData.status_message || 'Disponible',
                department_id: toLocalDeptId(profileData.department_id) || 'dep_cardio',
                created_at: profileData.created_at || new Date().toISOString()
              };
              MockDatabase.setCurrentUser(activeProfile);
              onAuthSuccess(activeProfile);
            }
          }
        } catch (err: any) {
          setError(`Échec de la connexion Supabase : ${err.message || 'Identifiants invalides'}`);
          setLoading(false);
        }
      } else {
        // Mode local hors-ligne / Démo : chercher l'utilisateur par e-mail
        setTimeout(() => {
          const profiles = MockDatabase.getProfiles();
          const found = profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
          
          if (found) {
            MockDatabase.setCurrentUser(found);
            onAuthSuccess(found);
          } else {
            setError("Identifiants de démonstration invalides. (Tu peux utiliser l'inscription ou cliquer sur un profil rapide ci-dessous pour tester).");
          }
          setLoading(false);
        }, 800);
      }
    } else {
      // --- LOGIQUE D'INSCRIPTION ---
      if (!firstName.trim() || !lastName.trim() || !email.trim()) {
        setError("Veuillez remplir tous les champs obligatoires.");
        setLoading(false);
        return;
      }

      if (supabase) {
        // Inscription réelle via Supabase
        try {
          if (password.length < 6) {
            throw new Error("Le mot de passe doit contenir au moins 6 caractères.");
          }

          const { data, error: signUpErr } = await supabase.auth.signUp({
            email,
            password,
          });

          if (signUpErr) throw signUpErr;

          if (data.user) {
            // Créer le profil dans Supabase
            const newProfile: Profile = {
              id: data.user.id,
              first_name: firstName,
              last_name: lastName,
              email: email,
              role: role as any,
              avatar_url: `https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=100`,
              phone: "+33 6 00 00 00 00",
              status: 'available',
              status_message: 'Disponible',
              department_id: departmentId,
              created_at: new Date().toISOString()
            };

            const { error: dbError } = await supabase.from('profiles').insert([{
              ...newProfile,
              department_id: toSupabaseDeptId(newProfile.department_id)
            }]);
            if (dbError) throw dbError;

            setSuccessMsg("Félicitations, ton compte clinicien a été créé ! Connexion en cours...");
            setTimeout(() => {
              MockDatabase.setCurrentUser(newProfile);
              onAuthSuccess(newProfile);
            }, 1500);
          }
        } catch (err: any) {
          setError(`Échec de l'inscription Supabase : ${err.message}`);
          setLoading(false);
        }
      } else {
        // Mode local hors-ligne / Démo
        setTimeout(() => {
          try {
            const newProfile = MockDatabase.registerLocal(
              firstName,
              lastName,
              email,
              role,
              departmentId
            );
            setSuccessMsg("Inscription locale réussie ! Connexion automatique en cours...");
            setTimeout(() => {
              MockDatabase.setCurrentUser(newProfile);
              onAuthSuccess(newProfile);
            }, 1200);
          } catch (err: any) {
            setError(`Erreur lors de la création locale : ${err.message}`);
            setLoading(false);
          }
        }, 1000);
      }
    }
  };

  const getRoleLabel = (r: string) => {
    switch (r) {
      case 'admin': return 'Administrateur';
      case 'director': return 'Direction';
      case 'project_manager': return 'Chef de Projet';
      case 'service_head': return 'Chef de Service';
      case 'architecte': return 'Architecte';
      case 'dev_web': return 'Développeur Web';
      case 'designer_3d': return 'Designer 3D';
      case 'genie_civil': return 'Génie Civil';
      case 'directeur_technique': return 'Directeur Technique';
      case 'logistique': return 'Logistique';
      default: return 'Collaborateur';
    }
  };

  return (
    <div 
      style={{ 
        display: 'flex', 
        height: '100vh', 
        width: '100vw', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'linear-gradient(135deg, #E6F0FF 0%, #F5F7FA 50%, #F0EFFF 100%)', 
        fontFamily: 'var(--font-sans)',
        overflowY: 'auto',
        padding: '20px'
      }}
    >
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: '1.2fr 1fr', 
          width: '100%', 
          maxWidth: '1000px', 
          minHeight: '620px',
          backgroundColor: 'rgba(255, 255, 255, 0.72)', 
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          borderRadius: '24px', 
          border: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 20px 50px rgba(0, 122, 255, 0.08)',
          overflow: 'hidden',
          animation: 'scaleUp 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)'
        }}
        className="auth-container-grid"
      >
        
        {/* Left Side: Brand presentation of Hôpital Saldae */}
        <div 
          style={{ 
            background: 'linear-gradient(135deg, rgba(0, 122, 255, 0.04), rgba(88, 86, 214, 0.04))', 
            padding: '40px 48px', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            borderRight: '1px solid rgba(0, 0, 0, 0.04)'
          }}
          className="auth-brand-pane"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div 
              style={{ 
                width: '36px', 
                height: '36px', 
                background: 'linear-gradient(135deg, #007AFF, #5856D6)', 
                borderRadius: '10px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'white',
                boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)'
              }}
            >
              <Activity size={20} />
            </div>
            <span style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--color-text-main)' }}>
              Slock Saldae
            </span>
          </div>

          <div style={{ margin: '40px 0' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Portail Hospitalier Sécurisé
            </span>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--color-text-main)', marginTop: '8px', lineHeight: '1.25', letterSpacing: '-1px' }}>
              Hôpital Saldae
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '12px', lineHeight: '1.5' }}>
              Espace de coordination en temps réel et de transmission d'alertes médicales cryptées pour l'ensemble du personnel soignant et administratif.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '32px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', marginTop: '6px' }}></div>
                <div>
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--color-text-main)' }}>Garde Hospitalière Unifiée</span>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Changez de rôle de garde instantanément pour visualiser les alertes critiques.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-info)', marginTop: '6px' }}></div>
                <div>
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--color-text-main)' }}>Règles RGPD Claires</span>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Cloisonnement clinique par service sous politiques RLS Supabase robustes.</p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Hospital size={12} />
            <span>Saldae Group Hospitalier © 2026</span>
          </div>
        </div>

        {/* Right Side: Login & Register Forms */}
        <div style={{ padding: '40px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          
          {/* Form Switch tabs */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '10px' }}>
            <button 
              onClick={() => { setIsLogin(true); setError(''); setSuccessMsg(''); }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '15px',
                fontWeight: 700,
                color: isLogin ? 'var(--color-primary)' : 'var(--color-text-muted)',
                cursor: 'pointer',
                position: 'relative',
                padding: '4px 0',
                transition: 'color 0.2s'
              }}
            >
              Connexion
              {isLogin && <div style={{ position: 'absolute', bottom: '-11px', left: 0, right: 0, height: '2px', backgroundColor: 'var(--color-primary)', borderRadius: '2px' }}></div>}
            </button>
            <button 
              onClick={() => { setIsLogin(false); setError(''); setSuccessMsg(''); }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '15px',
                fontWeight: 700,
                color: !isLogin ? 'var(--color-primary)' : 'var(--color-text-muted)',
                cursor: 'pointer',
                position: 'relative',
                padding: '4px 0',
                transition: 'color 0.2s'
              }}
            >
              Inscription
              {!isLogin && <div style={{ position: 'absolute', bottom: '-11px', left: 0, right: 0, height: '2px', backgroundColor: 'var(--color-primary)', borderRadius: '2px' }}></div>}
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {error && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: 'var(--color-danger-bg)', border: '1px solid rgba(255, 59, 48, 0.15)', padding: '10px 12px', borderRadius: '10px', color: 'var(--color-danger)', fontSize: '12px' }}>
                <ShieldAlert size={14} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: 'var(--color-success-bg)', border: '1px solid rgba(52, 199, 89, 0.15)', padding: '10px 12px', borderRadius: '10px', color: 'var(--color-success)', fontSize: '12px' }}>
                <Check size={14} style={{ flexShrink: 0 }} />
                <span>{successMsg}</span>
              </div>
            )}

            {!isLogin && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Prénom</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      placeholder="Jean" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px 12px 10px 32px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '13px', outline: 'none', backgroundColor: 'white' }}
                    />
                    <User size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Nom</label>
                  <input 
                    type="text" 
                    placeholder="Marc" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '13px', outline: 'none', backgroundColor: 'white' }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Adresse e-mail professionnelle</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="email" 
                  placeholder="nom@saldae.fr" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px 10px 32px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '13px', outline: 'none', backgroundColor: 'white' }}
                />
                <Mail size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="password" 
                  placeholder={supabase ? "6 caractères min." : "Optionnel en démo"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!!supabase}
                  style={{ width: '100%', padding: '10px 12px 10px 32px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '13px', outline: 'none', backgroundColor: 'white' }}
                />
                <Lock size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              </div>
            </div>

            {!isLogin && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Rôle / Métier</label>
                  <select 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '12.5px', outline: 'none', backgroundColor: 'white', fontWeight: 500 }}
                  >
                    <option value="collaborator">Collaborateur / Agent</option>
                    <option value="service_head">Chef de Service / Service Clinique</option>
                    <option value="project_manager">Chef de Projet</option>
                    <option value="director">Direction</option>
                    <option value="admin">Administrateur</option>
                    <option value="architecte">Architecte</option>
                    <option value="dev_web">Développeur Web</option>
                    <option value="designer_3d">Designer 3D</option>
                    <option value="genie_civil">Génie Civil</option>
                    <option value="directeur_technique">Directeur Technique</option>
                    <option value="logistique">Logistique</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)' }}>Service Affecté</label>
                  <select 
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    style={{ width: '100%', padding: '9px 10px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '12.5px', outline: 'none', backgroundColor: 'white', fontWeight: 500 }}
                  >
                    <option value="dep_cardio">Cardiologie</option>
                    <option value="dep_urgences">Urgences</option>
                    <option value="dep_tech">Serv. Tech.</option>
                    <option value="dep_admin">Administration</option>
                  </select>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, var(--color-primary), #0056b3)',
                color: 'white',
                fontSize: '13px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(0, 122, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '6px',
                transition: 'all 0.2s'
              }}
            >
              {loading ? (
                <div className="apple-spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
              ) : (
                <>
                  <span>{isLogin ? 'Se connecter' : "Créer mon compte clinicien"}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>

            {supabase && (
              <span style={{ fontSize: '10.5px', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '4px', fontStyle: 'italic' }}>
                Authentification sécurisée par certificat Supabase active.
              </span>
            )}
          </form>

          {/* Quick demo profiles selector (WOW FACTOR) */}
          <div style={{ marginTop: '24px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '20px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '10px' }}>
              💡 Connexion Clinique de démonstration rapide :
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {demoProfiles.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleDemoLogin(p)}
                  disabled={loading}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: '1px solid rgba(0, 122, 255, 0.15)',
                    backgroundColor: 'rgba(230, 240, 255, 0.5)',
                    color: 'var(--color-primary)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s'
                  }}
                  className="demo-profile-btn"
                >
                  <span>{p.first_name}</span>
                  <span style={{ fontSize: '9px', opacity: 0.7, fontWeight: 500 }}>({getRoleLabel(p.role).split(' ')[0]})</span>
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
