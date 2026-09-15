import type { AdminContext } from '../auth/session'

const expires = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
const commonSession = { expires_at: expires, idle_expires_at: expires, mfa_level: 'webauthn', permissions_version: 12 }

const adminPermissions = ['content.clubs.read', 'content.events.read', 'content.attendees.read', 'ops.users.read', 'ops.users.update', 'ops.reports.read', 'ops.reports.review', 'ops.ambassadors.read', 'ops.ambassadors.create', 'ops.ambassadors.review', 'ops.partners.read', 'ops.partners.review', 'ops.jobs.read', 'ops.jobs.retry', 'security.audit.read']

export const demoProfiles: Record<string, AdminContext> = {
  admin: { identity: { id: 'demo-admin', fullName: 'Aysel Quliyeva', email: 'admin@genz.club' }, roles: ['admin'], permissions: adminPermissions, scopes: {}, session: commonSession },
  superadmin: { identity: { id: 'demo-superadmin', fullName: 'Murad Rzayev', email: 'superadmin@genz.club' }, roles: ['superadmin'], permissions: ['*'], scopes: {}, session: commonSession },
}

const iso = (days: number, hours = 10) => new Date(Date.now() + days * 86400000 + hours * 3600000).toISOString()

export type DemoRecord = { id: string | number; [key: string]: unknown }

export const demoData: Record<string, DemoRecord[]> = {
  clubs: [
    { id: 'club-1', name: 'Baku Creators', city: 'Bakı', members_count: 2840, events_count: 18, status: 'active', updated_at: iso(-1), description: 'Yaradıcı gənclər üçün community və tədbirlər.', version: 4 },
    { id: 'club-2', name: 'Tech & Chill', city: 'Bakı', members_count: 1964, events_count: 12, status: 'active', updated_at: iso(-2), description: 'Texnologiya, networking və rahat söhbət.', version: 7 },
    { id: 'club-3', name: 'Gəncə Run Club', city: 'Gəncə', members_count: 735, events_count: 7, status: 'draft', updated_at: iso(-4), description: 'Həftəlik şəhər qaçışları.', version: 2 },
    { id: 'club-4', name: 'Film Circle', city: 'Bakı', members_count: 1128, events_count: 9, status: 'archived', updated_at: iso(-12), description: 'Kino nümayişləri və müzakirələr.', version: 9 },
  ],
  events: [
    { id: 'event-1', title: 'Design after dark', club_name: 'Baku Creators', starts_at: iso(2, 19), attendees_count: 184, capacity: 220, status: 'published', version: 4 },
    { id: 'event-2', title: 'AI builders breakfast', club_name: 'Tech & Chill', starts_at: iso(4, 10), attendees_count: 92, capacity: 120, status: 'published', version: 2 },
    { id: 'event-3', title: '5K sunrise run', club_name: 'Gəncə Run Club', starts_at: iso(5, 7), attendees_count: 46, capacity: 80, status: 'draft', version: 1 },
    { id: 'event-4', title: 'Short film screening', club_name: 'Film Circle', starts_at: iso(8, 20), attendees_count: 118, capacity: 140, status: 'review', version: 3 },
  ],
  attendees: [
    { id: 'att-1', name: 'Kamran Həsənli', event_title: 'Design after dark', joined_at: iso(-4), ticket_code: 'GZ-8P4K', status: 'confirmed' },
    { id: 'att-2', name: 'Ləman Cəfərova', event_title: 'AI builders breakfast', joined_at: iso(-2), ticket_code: 'GZ-2W9Q', status: 'checked_in' },
    { id: 'att-3', name: 'Emil İsmayılov', event_title: 'Design after dark', joined_at: iso(-1), ticket_code: 'GZ-7A3M', status: 'confirmed' },
  ],
  'join-requests': [
    { id: 'join-1', name: 'Rəna Əsgərova', event_title: 'Design after dark', created_at: iso(-1), status: 'pending' },
    { id: 'join-2', name: 'Orxan Vəliyev', event_title: 'AI builders breakfast', created_at: iso(-2), status: 'pending' },
  ],
  campaigns: [
    { id: 'camp-1', name: 'Campus Week', promo_code: 'LEYLA25', clicks: 1428, conversions: 186, expires_at: iso(18), status: 'active' },
    { id: 'camp-2', name: 'Summer Circle', promo_code: 'GENZSUMMER', clicks: 864, conversions: 97, expires_at: iso(6), status: 'active' },
    { id: 'camp-3', name: 'Launch Crew', promo_code: 'CREW10', clicks: 2310, conversions: 304, expires_at: iso(-20), status: 'expired' },
  ],
  referrals: [
    { id: 'ref-1', name: 'N*** A***', source: 'LEYLA25', created_at: iso(-3), converted_at: iso(-2), status: 'converted' },
    { id: 'ref-2', name: 'E*** M***', source: 'GENZSUMMER', created_at: iso(-2), converted_at: null, status: 'verified' },
    { id: 'ref-3', name: 'T*** R***', source: 'LEYLA25', created_at: iso(-1), converted_at: null, status: 'signed_up' },
  ],
  rewards: [
    { id: 'reward-1', reference: 'RWD-2026-0842', description: 'Campus Week — 24 konversiya', amount_minor: 24000, created_at: iso(-3), status: 'approved' },
    { id: 'reward-2', reference: 'RWD-2026-0781', description: 'Summer Circle — 18 konversiya', amount_minor: 18000, created_at: iso(-12), status: 'paid' },
  ],
  tasks: [
    { id: 'task-1', title: 'Campus event recap', due_at: iso(3), xp_reward: 450, status: 'in_progress' },
    { id: 'task-2', title: '3 creator referralı', due_at: iso(8), xp_reward: 300, status: 'open' },
    { id: 'task-3', title: 'August brand story', due_at: iso(-2), xp_reward: 250, status: 'submitted' },
  ],
  users: [
    { id: 'user-1', name: 'Nihad Abbasov', email: 'ni***@mail.az', role: 'user', created_at: iso(-180), last_seen_at: iso(-1), status: 'active' },
    { id: 'user-2', name: 'Səbinə Rəhimli', email: 'sa***@mail.az', role: 'ambassador', created_at: iso(-120), last_seen_at: iso(-2), status: 'active' },
    { id: 'user-3', name: 'Rauf Kərimli', email: 'ra***@mail.az', role: 'user', created_at: iso(-30), last_seen_at: iso(-8), status: 'suspended' },
    { id: 'user-4', name: 'Aytac Əliyeva', email: 'ay***@mail.az', role: 'partner_owner', created_at: iso(-240), last_seen_at: iso(-1), status: 'active' },
  ],
  reports: [
    { id: 'report-1', reference: 'REP-2901', reason: 'Spam və təkrar paylaşım', reporter_name: '2 istifadəçi', created_at: iso(-1), priority: 'medium', status: 'open' },
    { id: 'report-2', reference: 'REP-2898', reason: 'Təhqiredici mesaj', reporter_name: '1 istifadəçi', created_at: iso(-2), priority: 'high', status: 'reviewing' },
    { id: 'report-3', reference: 'REP-2874', reason: 'Saxta profil', reporter_name: '4 istifadəçi', created_at: iso(-5), priority: 'high', status: 'resolved' },
  ],
  'ambassador-applications': [
    { id: 'app-1', name: 'Fidan Cavadova', city: 'Bakı', followers: 18400, created_at: iso(-2), status: 'pending' },
    { id: 'app-2', name: 'Samir Nəcəfli', city: 'Sumqayıt', followers: 9200, created_at: iso(-4), status: 'reviewing' },
  ],
  jobs: [
    { id: 'job-1', name: 'event.notifications', queue: 'notifications', attempts: 1, updated_at: iso(-1), status: 'running' },
    { id: 'job-2', name: 'reward.aggregate.daily', queue: 'analytics', attempts: 1, updated_at: iso(-1), status: 'completed' },
    { id: 'job-3', name: 'media.scan', queue: 'security', attempts: 3, updated_at: iso(-2), status: 'failed' },
  ],
  'audit-events': [
    { id: 'audit-1', occurred_at: iso(-1), actor_name: 'Aysel Quliyeva', action: 'user.unsuspend', resource: 'user / 72ad…', request_id: '1a74c632…', outcome: 'success' },
    { id: 'audit-2', occurred_at: iso(-1), actor_name: 'Nərgiz Məmmədli', action: 'event.publish', resource: 'event / 48ef…', request_id: 'b0219f40…', outcome: 'success' },
    { id: 'audit-3', occurred_at: iso(-2), actor_name: 'System', action: 'session.reuse_detected', resource: 'session / 309c…', request_id: '816d410e…', outcome: 'blocked' },
  ],
  roles: [
    { id: 'role-1', name: 'Superadmin', users_count: 2, permissions_count: 48, risk_level: 'critical', updated_at: iso(-6) },
    { id: 'role-2', name: 'Admin', users_count: 6, permissions_count: 17, risk_level: 'high', updated_at: iso(-12) },
    { id: 'role-3', name: 'Moderator', users_count: 28, permissions_count: 12, risk_level: 'medium', updated_at: iso(-15) },
    { id: 'role-4', name: 'Ambassador', users_count: 64, permissions_count: 8, risk_level: 'low', updated_at: iso(-18) },
  ],
  sessions: [
    { id: 'sess-1', user_name: 'Murad Rzayev', device: 'Chrome · macOS', ip_address: '85.132.***.***', last_seen_at: iso(-1), mfa_level: 'passkey', status: 'active' },
    { id: 'sess-2', user_name: 'Aysel Quliyeva', device: 'Safari · iPhone', ip_address: '94.20.***.***', last_seen_at: iso(-2), mfa_level: 'totp', status: 'active' },
  ],
  payouts: [
    { id: 'pay-1', reference: 'PAY-0841', recipient_name: 'Leyla Əliyeva', amount_minor: 42600, requested_at: iso(-2), risk: 'low', status: 'pending' },
    { id: 'pay-2', reference: 'PAY-0839', recipient_name: 'Səbinə Rəhimli', amount_minor: 78500, requested_at: iso(-3), risk: 'review', status: 'pending' },
  ],
  settings: [
    { id: 'set-1', label: 'Yeni qeydiyyat', key: 'registration.enabled', category: 'Growth', value_display: 'Aktiv', updated_at: iso(-4), status: 'configured' },
    { id: 'set-2', label: 'Payment provider', key: 'payments.provider', category: 'Finance', value_display: '•••• configured', updated_at: iso(-18), status: 'secret' },
    { id: 'set-3', label: 'Event publish review', key: 'events.require_review', category: 'Content', value_display: 'Aktiv', updated_at: iso(-9), status: 'configured' },
  ],
  backups: [
    { id: 'backup-1', reference: 'backup-2026-08-16-0200', size: '4.8 GB', created_at: iso(-1), expires_at: iso(180), integrity: 'verified', status: 'available' },
    { id: 'backup-2', reference: 'backup-2026-08-15-0200', size: '4.7 GB', created_at: iso(-2), expires_at: iso(179), integrity: 'verified', status: 'available' },
  ],
}
