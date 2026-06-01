import type { Meeting, MeetingDecision, Task, Profile } from '../types';

export const exportMeetingToPDF = (
  meeting: Meeting,
  decisions: MeetingDecision[],
  tasks: Task[],
  profiles: Profile[]
) => {
  const organizer = profiles.find(p => p.id === meeting.organizer_id);
  const participants = meeting.participant_ids
    .map(id => profiles.find(p => p.id === id))
    .filter(Boolean) as Profile[];

  const meetingTasks = tasks.filter(t => t.meeting_id === meeting.id);

  // Formater la date en français
  const formattedDate = new Date(meeting.date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Veuillez autoriser les fenêtres pop-up pour pouvoir imprimer le PV.');
    return;
  }

  // Rédiger le document HTML autonome avec styles d'impression soignés
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>PV de Réunion - ${meeting.title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
          color: #1D1D1F;
          line-height: 1.6;
          margin: 0;
          padding: 40px;
          background-color: #ffffff;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #007AFF;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }

        .hospital-brand {
          display: flex;
          flex-direction: column;
        }

        .hospital-name {
          font-size: 20px;
          font-weight: 700;
          color: #007AFF;
          letter-spacing: -0.5px;
        }

        .hospital-sub {
          font-size: 11px;
          color: #86868B;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 2px;
        }

        .doc-title {
          text-align: right;
        }

        .doc-title h1 {
          font-size: 22px;
          font-weight: 700;
          margin: 0;
          color: #1D1D1F;
        }

        .doc-title p {
          font-size: 12px;
          color: #86868B;
          margin: 4px 0 0 0;
        }

        .meta-card {
          background-color: #F5F5F7;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 30px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          font-size: 13px;
        }

        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .meta-label {
          font-weight: 600;
          color: #86868B;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.5px;
        }

        .meta-value {
          color: #1D1D1F;
          font-weight: 500;
        }

        .section {
          margin-bottom: 30px;
        }

        .section h2 {
          font-size: 14px;
          font-weight: 700;
          color: #007AFF;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-bottom: 1px solid #E5E5EA;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }

        ul {
          margin: 0;
          padding-left: 20px;
        }

        li {
          margin-bottom: 6px;
          font-size: 13.5px;
        }

        .notes-content {
          font-size: 13.5px;
          white-space: pre-wrap;
          color: #3A3A3C;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }

        th, td {
          border: 1px solid #E5E5EA;
          padding: 10px 12px;
          font-size: 13px;
          text-align: left;
        }

        th {
          background-color: #F5F5F7;
          font-weight: 600;
          color: #1D1D1F;
        }

        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .badge-critical { background-color: #FFEBEA; color: #FF3B30; }
        .badge-high { background-color: #FFF4E5; color: #FF9500; }
        .badge-normal { background-color: #F0EFFF; color: #5856D6; }
        .badge-low { background-color: #EAF9EE; color: #34C759; }

        .highlights-card {
          background-color: rgba(0, 122, 255, 0.05);
          border-left: 4px solid #007AFF;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 20px;
        }

        .warnings-card {
          background-color: rgba(255, 149, 0, 0.05);
          border-left: 4px solid #FF9500;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 20px;
        }

        .next-meeting-card {
          background-color: #F5F5F7;
          border: 1px solid #E5E5EA;
          border-radius: 8px;
          padding: 12px 16px;
          margin-top: 24px;
        }

        .validation-stamp {
          margin-top: 50px;
          display: flex;
          justify-content: flex-end;
        }

        .stamp-box {
          border: 1.5px dashed #34C759;
          border-radius: 8px;
          padding: 12px 20px;
          background-color: #EAF9EE;
          color: #34C759;
          text-align: center;
          font-size: 12px;
          font-weight: 600;
        }

        .stamp-title {
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .footer {
          margin-top: 60px;
          text-align: center;
          font-size: 11px;
          color: #86868B;
          border-top: 1px solid #E5E5EA;
          padding-top: 16px;
        }

        @media print {
          body {
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="hospital-brand">
          <span class="hospital-name">CENTRE HOSPITALIER CENTRAL</span>
          <span class="hospital-sub">Portail de Coordination Interne</span>
        </div>
        <div class="doc-title">
          <h1>PROCÈS-VERBAL DE RÉUNION</h1>
          <p>Document Officiel Interne</p>
        </div>
      </div>

      <div class="meta-card">
        <div class="meta-item">
          <span class="meta-label">Réunion / Objet</span>
          <span class="meta-value">${meeting.title}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Date & Heure</span>
          <span class="meta-value">${formattedDate} à ${meeting.time}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Organisateur</span>
          <span class="meta-value">${organizer ? `${organizer.first_name} ${organizer.last_name} (${organizer.status_message || organizer.role})` : 'Non renseigné'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Lieu / Visio</span>
          <span class="meta-value">${meeting.location}</span>
        </div>
      </div>

      <div class="section">
        <h2>Participants Présents</h2>
        <ul>
          ${participants.map(p => `<li><strong>${p.first_name} ${p.last_name}</strong> - ${p.status_message || p.role}</li>`).join('')}
        </ul>
      </div>

      <div class="section">
        <h2>Ordre du Jour</h2>
        <ul>
          ${meeting.agenda.map(a => `<li>${a}</li>`).join('')}
        </ul>
      </div>

      ${((meeting.highlights && meeting.highlights.length > 0 && meeting.highlights.some(h => h.trim())) ||
         (meeting.warnings && meeting.warnings.length > 0 && meeting.warnings.some(w => w.trim()))) ? `
      <div class="section" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        ${meeting.highlights && meeting.highlights.some(h => h.trim()) ? `
        <div class="highlights-card">
          <h3 style="color: #007AFF; font-size: 11px; font-weight: 700; text-transform: uppercase; margin: 0 0 8px 0; letter-spacing: 0.5px; border-bottom: none; padding-bottom: 0;">
            🌟 Points Importants / Faits Saillants
          </h3>
          <ul style="padding-left: 16px; margin: 0; font-size: 12.5px;">
            ${meeting.highlights.filter(h => h.trim()).map(h => `<li>${h}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
        ${meeting.warnings && meeting.warnings.some(w => w.trim()) ? `
        <div class="warnings-card">
          <h3 style="color: #FF9500; font-size: 11px; font-weight: 700; text-transform: uppercase; margin: 0 0 8px 0; letter-spacing: 0.5px; border-bottom: none; padding-bottom: 0;">
            ⚠️ Points de Vigilance / Risques
          </h3>
          <ul style="padding-left: 16px; margin: 0; font-size: 12.5px;">
            ${meeting.warnings.filter(w => w.trim()).map(w => `<li>${w}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
      </div>
      ` : ''}

      ${meeting.notes ? `
      <div class="section">
        <h2>Notes & Débats</h2>
        <div class="notes-content">${meeting.notes}</div>
      </div>
      ` : ''}

      ${decisions.length > 0 ? `
      <div class="section">
        <h2>Décisions Prises</h2>
        <ul>
          ${decisions.map(d => `<li><strong>DÉCISION :</strong> ${d.content}</li>`).join('')}
        </ul>
      </div>
      ` : ''}

      ${meetingTasks.length > 0 ? `
      <div class="section">
        <h2>Actions Assignées</h2>
        <table>
          <thead>
            <tr>
              <th>Action / Description</th>
              <th>Responsable</th>
              <th>Échéance</th>
              <th>Priorité</th>
            </tr>
          </thead>
          <tbody>
            ${meetingTasks.map(t => {
              const assignee = profiles.find(p => p.id === t.assigned_to);
              return `
                <tr>
                  <td><strong>${t.title}</strong>${t.description ? `<br><small style="color: #666">${t.description}</small>` : ''}</td>
                  <td>${assignee ? `${assignee.first_name} ${assignee.last_name}` : 'Non assigné'}</td>
                  <td>${t.due_date ? new Date(t.due_date).toLocaleDateString('fr-FR') : 'Non spécifiée'}</td>
                  <td><span class="badge badge-${t.priority}">${t.priority}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}

      ${meeting.next_meeting ? `
      <div class="next-meeting-card">
        <div style="font-size: 10px; font-weight: 700; color: #86868B; text-transform: uppercase; letter-spacing: 0.5px;">
          📅 Prochaine Réunion Programmée
        </div>
        <div style="font-size: 13px; font-weight: 600; color: #1D1D1F; margin-top: 4px;">
          ${meeting.next_meeting}
        </div>
      </div>
      ` : ''}

      ${meeting.is_minutes_validated ? `
      <div class="validation-stamp">
        <div class="stamp-box">
          <div class="stamp-title">✓ VALIDÉ ET SIGNÉ</div>
          <div>Par le Président de Séance</div>
          <div style="font-size: 10px; margin-top: 4px; opacity: 0.8;">Le ${meeting.validated_at ? new Date(meeting.validated_at).toLocaleDateString('fr-FR') : ''}</div>
        </div>
      </div>
      ` : ''}

      <div class="footer">
        Ce compte-rendu de réunion est réservé à un usage interne au sein du Centre Hospitalier. Toute transmission externe est interdite.<br>
        Généré automatiquement par le logiciel de coordination hospitalière Slock.
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
