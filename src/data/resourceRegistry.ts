export type FieldKind = 'text' | 'status' | 'date' | 'number' | 'money' | 'email'

export type ResourceField = {
  source: string
  label: string
  kind?: FieldKind
  editable?: boolean
  list?: boolean
}

export type ResourceContract = {
  name: string
  label: string
  singular: string
  path: string
  group: 'content' | 'growth' | 'operations' | 'security' | 'system'
  readPermission: string
  writePermission?: string
  createPermission?: string
  supportsShow?: boolean
  accent: string
  description: string
  recordLabel: string
  fields: ResourceField[]
}

const contract = (value: ResourceContract) => value

export const resourceContracts: ResourceContract[] = [
  contract({ name: 'clubs', label: 'Klublar', singular: 'Klub', path: '/admin/clubs', group: 'content', readPermission: 'content.clubs.read', writePermission: 'content.clubs.update', createPermission: 'content.clubs.create', accent: '#B7F34A', description: 'Klub profilləri, üzvlük scope-u və yayımlanma vəziyyəti', recordLabel: 'name', fields: [
    { source: 'name', label: 'Klub', editable: true }, { source: 'city', label: 'Şəhər', editable: true }, { source: 'members_count', label: 'Üzvlər', kind: 'number' }, { source: 'events_count', label: 'Tədbirlər', kind: 'number' }, { source: 'status', label: 'Status', kind: 'status' }, { source: 'updated_at', label: 'Yenilənib', kind: 'date' },
  ] }),
  contract({ name: 'events', label: 'Tədbirlər', singular: 'Tədbir', path: '/admin/events', group: 'content', readPermission: 'content.events.read', writePermission: 'content.events.update', createPermission: 'content.events.create', accent: '#8EDBFF', description: 'Tədbir təqvimi, tutum, qeydiyyat və publish axını', recordLabel: 'title', fields: [
    { source: 'title', label: 'Tədbir', editable: true }, { source: 'club_name', label: 'Klub' }, { source: 'club_id', label: 'Klub ID', editable: true, list: false }, { source: 'venue_id', label: 'Məkan ID', editable: true, list: false },
    { source: 'description', label: 'Açıqlama', editable: true, list: false }, { source: 'cover_url', label: 'Cover URL', editable: true, list: false },
    { source: 'starts_at', label: 'Başlayır', kind: 'date', editable: true }, { source: 'ends_at', label: 'Bitir', kind: 'date', editable: true, list: false },
    { source: 'registration_type', label: 'Qeydiyyat', editable: true }, { source: 'price_minor', label: 'Qiymət', kind: 'money', editable: true, list: false }, { source: 'currency', label: 'Valyuta', editable: true, list: false },
    { source: 'attendees_count', label: 'İştirakçı', kind: 'number' }, { source: 'capacity', label: 'Tutum', kind: 'number', editable: true }, { source: 'min_age', label: 'Minimum yaş', kind: 'number', editable: true, list: false }, { source: 'max_age', label: 'Maksimum yaş', kind: 'number', editable: true, list: false },
    { source: 'rules', label: 'Qaydalar', editable: true, list: false }, { source: 'status', label: 'Status', kind: 'status' },
  ] }),
  contract({ name: 'attendees', label: 'İştirakçılar', singular: 'İştirakçı', path: '/admin/attendees', group: 'content', readPermission: 'content.attendees.read', accent: '#8EDBFF', description: 'Tədbir iştirakçıları və check-in vəziyyəti', recordLabel: 'name', fields: [
    { source: 'name', label: 'İştirakçı' }, { source: 'event_title', label: 'Tədbir' }, { source: 'joined_at', label: 'Qoşulub', kind: 'date' }, { source: 'ticket_code', label: 'Bilet' }, { source: 'status', label: 'Status', kind: 'status' },
  ] }),
  contract({ name: 'join-requests', label: 'Qoşulma sorğuları', singular: 'Sorğu', path: '/admin/join-requests', group: 'content', readPermission: 'content.join_requests.read', writePermission: 'content.join_requests.review', accent: '#FFD66B', description: 'Gözləyən iştirak sorğularının təhlükəsiz icmalı', recordLabel: 'name', fields: [
    { source: 'name', label: 'İstifadəçi' }, { source: 'event_title', label: 'Tədbir' }, { source: 'created_at', label: 'Göndərilib', kind: 'date' }, { source: 'status', label: 'Status', kind: 'status' },
  ] }),
  contract({ name: 'campaigns', label: 'Kampaniyalar', singular: 'Kampaniya', path: '/admin/ambassador/campaigns', group: 'growth', readPermission: 'growth.campaigns.read_own', writePermission: 'growth.campaigns.manage_own', createPermission: 'growth.campaigns.manage_own', accent: '#C6A7FF', description: 'Referral kampaniyaları və promo kod nəticələri', recordLabel: 'name', fields: [
    { source: 'name', label: 'Kampaniya', editable: true }, { source: 'promo_code', label: 'Promo kod' }, { source: 'clicks', label: 'Klik', kind: 'number' }, { source: 'conversions', label: 'Konversiya', kind: 'number' }, { source: 'expires_at', label: 'Bitir', kind: 'date', editable: true }, { source: 'status', label: 'Status', kind: 'status' },
  ] }),
  contract({ name: 'referrals', label: 'Referral istifadəçilər', singular: 'Referral', path: '/admin/ambassador/referrals', group: 'growth', readPermission: 'growth.referrals.read_own', accent: '#C6A7FF', description: 'Minimum PII ilə öz referral kohortunuz', recordLabel: 'name', fields: [
    { source: 'name', label: 'İstifadəçi' }, { source: 'source', label: 'Mənbə' }, { source: 'created_at', label: 'Qeydiyyat', kind: 'date' }, { source: 'converted_at', label: 'Konversiya', kind: 'date' }, { source: 'status', label: 'Status', kind: 'status' },
  ] }),
  contract({ name: 'rewards', label: 'Mükafatlar', singular: 'Mükafat', path: '/admin/ambassador/rewards', group: 'growth', readPermission: 'growth.rewards.read_own', accent: '#C6A7FF', description: 'Dəyişməz komissiya və mükafat ledger-i', recordLabel: 'reference', fields: [
    { source: 'reference', label: 'İstinad' }, { source: 'description', label: 'Açıqlama' }, { source: 'amount_minor', label: 'Məbləğ', kind: 'money' }, { source: 'created_at', label: 'Tarix', kind: 'date' }, { source: 'status', label: 'Status', kind: 'status' },
  ] }),
  contract({ name: 'tasks', label: 'Tapşırıqlar', singular: 'Tapşırıq', path: '/admin/ambassador/tasks', group: 'growth', readPermission: 'growth.tasks.read_own', writePermission: 'growth.tasks.submit_own', accent: '#C6A7FF', description: 'Ambassador tapşırıqları və sübut timeline-ı', recordLabel: 'title', fields: [
    { source: 'title', label: 'Tapşırıq' }, { source: 'due_at', label: 'Son tarix', kind: 'date' }, { source: 'xp_reward', label: 'XP', kind: 'number' }, { source: 'status', label: 'Status', kind: 'status' },
  ] }),
  contract({ name: 'users', label: 'İstifadəçilər', singular: 'İstifadəçi', path: '/admin/users', group: 'operations', readPermission: 'ops.users.read', writePermission: 'ops.users.update', accent: '#FF9C77', description: 'Hesab statusu, risk siqnalları və əməliyyat dəstəyi', recordLabel: 'name', fields: [
    { source: 'name', label: 'İstifadəçi' }, { source: 'email', label: 'E-poçt', kind: 'email' }, { source: 'role', label: 'Rol' }, { source: 'created_at', label: 'Qoşulub', kind: 'date' }, { source: 'last_seen_at', label: 'Son aktivlik', kind: 'date' }, { source: 'active_sessions', label: 'Sessiyalar', kind: 'number' }, { source: 'events_count', label: 'Tədbirlər', kind: 'number' }, { source: 'status', label: 'Status', kind: 'status' },
  ] }),
  contract({ name: 'reports', label: 'Şikayətlər', singular: 'Şikayət', path: '/admin/reports', group: 'operations', readPermission: 'ops.reports.read', writePermission: 'ops.reports.review', accent: '#FF9C77', description: 'Moderasiya növbəsi və state machine', recordLabel: 'reference', fields: [
    { source: 'reference', label: 'İstinad' }, { source: 'reason', label: 'Səbəb' }, { source: 'reporter_name', label: 'Göndərən' }, { source: 'created_at', label: 'Tarix', kind: 'date' }, { source: 'priority', label: 'Prioritet', kind: 'status' }, { source: 'status', label: 'Status', kind: 'status' },
  ] }),
  contract({ name: 'ambassador-applications', label: 'Ambassador müraciətləri', singular: 'Müraciət', path: '/admin/ambassadors', group: 'operations', readPermission: 'ops.ambassadors.read', writePermission: 'ops.ambassadors.review', accent: '#FF9C77', description: 'Ambassador qəbul, referral nəticəsi və reward vəziyyəti', recordLabel: 'name', fields: [
    { source: 'name', label: 'Namizəd' }, { source: 'city', label: 'Şəhər' }, { source: 'referrals_count', label: 'Referral', kind: 'number' }, { source: 'qualified_count', label: 'Qualified', kind: 'number' }, { source: 'reward_balance_minor', label: 'Reward', kind: 'money' }, { source: 'created_at', label: 'Müraciət', kind: 'date' }, { source: 'status', label: 'Status', kind: 'status' },
  ] }),
  contract({ name: 'fraud-reviews', label: 'Referral fraud icmalı', singular: 'Fraud icmalı', path: '/admin/fraud-reviews', group: 'operations', readPermission: 'ops.referrals.read', writePermission: 'ops.referrals.review', supportsShow: false, accent: '#FF6F91', description: 'Maskalanmış referral məlumatı, izahlı risk xalı və manual qərar növbəsi', recordLabel: 'referral_id', fields: [
    { source: 'ambassador_name', label: 'Ambassador' }, { source: 'referred_user', label: 'Referral istifadəçi' }, { source: 'risk_score', label: 'Risk xalı', kind: 'number' }, { source: 'reason_codes', label: 'Səbəb kodları' }, { source: 'rule_version', label: 'Qayda versiyası' }, { source: 'created_at', label: 'Növbəyə düşüb', kind: 'date' }, { source: 'status', label: 'Status', kind: 'status' },
  ] }),
  contract({ name: 'partner-organizations', label: 'Partner təşkilatları', singular: 'Partner təşkilatı', path: '/admin/partner-organizations', group: 'operations', readPermission: 'ops.partners.read', writePermission: 'ops.partners.review', supportsShow: false, accent: '#72E6B1', description: 'Partner approval, owner və lifecycle vəziyyəti', recordLabel: 'name', fields: [
	{ source: 'name', label: 'Təşkilat' }, { source: 'slug', label: 'Slug' }, { source: 'owners_count', label: 'Owner', kind: 'number' }, { source: 'members_count', label: 'Üzvlər', kind: 'number' }, { source: 'status', label: 'Status', kind: 'status' }, { source: 'updated_at', label: 'Yenilənib', kind: 'date' },
  ] }),
  contract({ name: 'jobs', label: 'Fon işləri', singular: 'İş', path: '/admin/jobs', group: 'operations', readPermission: 'ops.jobs.read', writePermission: 'ops.jobs.retry', accent: '#FF9C77', description: 'Outbox, retry və background job müşahidəsi', recordLabel: 'name', fields: [
    { source: 'name', label: 'İş' }, { source: 'queue', label: 'Növbə' }, { source: 'attempts', label: 'Cəhd', kind: 'number' }, { source: 'updated_at', label: 'Yenilənib', kind: 'date' }, { source: 'status', label: 'Status', kind: 'status' },
  ] }),
  contract({ name: 'audit-events', label: 'Audit izi', singular: 'Audit hadisəsi', path: '/admin/audit-events', group: 'security', readPermission: 'security.audit.read', accent: '#FF6F91', description: 'Actor, əməl, target və request ID üzrə dəyişməz iz', recordLabel: 'action', fields: [
    { source: 'occurred_at', label: 'Vaxt', kind: 'date' }, { source: 'actor_name', label: 'İcraçı' }, { source: 'action', label: 'Əməl' }, { source: 'resource', label: 'Resurs' }, { source: 'request_id', label: 'Request ID' }, { source: 'outcome', label: 'Nəticə', kind: 'status' },
  ] }),
  contract({ name: 'roles', label: 'Rollar və icazələr', singular: 'Rol', path: '/admin/security/roles', group: 'security', readPermission: 'security.roles.read', writePermission: 'security.roles.assign', accent: '#FF6F91', description: 'Version-lu rol və capability xəritəsi', recordLabel: 'name', fields: [
    { source: 'name', label: 'Rol' }, { source: 'users_count', label: 'İstifadəçi', kind: 'number' }, { source: 'permissions_count', label: 'İcazə', kind: 'number' }, { source: 'risk_level', label: 'Risk', kind: 'status' }, { source: 'updated_at', label: 'Yenilənib', kind: 'date' },
  ] }),
  contract({ name: 'sessions', label: 'Aktiv sessiyalar', singular: 'Sessiya', path: '/admin/security/sessions', group: 'security', readPermission: 'security.sessions.read', writePermission: 'security.sessions.revoke', accent: '#FF6F91', description: 'Cihaz, assurance və session revoke nəzarəti', recordLabel: 'device', fields: [
    { source: 'user_name', label: 'İstifadəçi' }, { source: 'device', label: 'Cihaz' }, { source: 'ip_address', label: 'IP' }, { source: 'last_seen_at', label: 'Son aktivlik', kind: 'date' }, { source: 'mfa_level', label: 'MFA' }, { source: 'status', label: 'Status', kind: 'status' },
  ] }),
  contract({ name: 'payouts', label: 'Ödənişlər', singular: 'Ödəniş', path: '/admin/finance/payouts', group: 'system', readPermission: 'finance.payouts.read', writePermission: 'finance.payouts.approve', accent: '#72E6B1', description: 'Step-up və dual-control ilə payout növbəsi', recordLabel: 'reference', fields: [
    { source: 'reference', label: 'İstinad' }, { source: 'recipient_name', label: 'Alıcı' }, { source: 'amount_minor', label: 'Məbləğ', kind: 'money' }, { source: 'requested_at', label: 'Sorğu', kind: 'date' }, { source: 'risk', label: 'Risk', kind: 'status' }, { source: 'status', label: 'Status', kind: 'status' },
  ] }),
  contract({ name: 'settings', label: 'Sistem sazlamaları', singular: 'Sazlama', path: '/admin/system/settings', group: 'system', readPermission: 'system.settings.read', writePermission: 'system.settings.update', accent: '#72E6B1', description: 'Typed registry, feature flag və secret metadata', recordLabel: 'label', fields: [
    { source: 'label', label: 'Sazlama' }, { source: 'key', label: 'Açar' }, { source: 'category', label: 'Kateqoriya' }, { source: 'value_display', label: 'Dəyər' }, { source: 'updated_at', label: 'Yenilənib', kind: 'date' }, { source: 'status', label: 'Status', kind: 'status' },
  ] }),
  contract({ name: 'backups', label: 'Backup və bərpa', singular: 'Backup', path: '/admin/system/backups', group: 'system', readPermission: 'system.backups.read', writePermission: 'system.backups.execute', accent: '#72E6B1', description: 'Şifrəli backup, integrity və restore approval', recordLabel: 'reference', fields: [
    { source: 'reference', label: 'Backup' }, { source: 'size', label: 'Ölçü' }, { source: 'created_at', label: 'Yaradılıb', kind: 'date' }, { source: 'expires_at', label: 'Retention', kind: 'date' }, { source: 'integrity', label: 'Integrity', kind: 'status' }, { source: 'status', label: 'Status', kind: 'status' },
  ] }),
]

export const resourceContractMap = new Map(resourceContracts.map((item) => [item.name, item]))

// The panel has a larger design-time registry for demo mode. Only expose
// resources whose API endpoints are implemented in the production backend;
// otherwise React Admin interprets an API failure as an expired session and
// redirects the operator to login.
const implementedResourceNames = new Set(['clubs', 'events', 'users', 'ambassador-applications', 'partner-organizations', 'audit-events', 'fraud-reviews'])

export const implementedResourceContracts = resourceContracts
  .filter(({ name }) => implementedResourceNames.has(name))
  .map((contract) => ['clubs', 'fraud-reviews'].includes(contract.name) ? contract : contract.name === 'users' ? {
    ...contract,
    createPermission: undefined,
    writePermission: undefined,
    supportsShow: true,
  } : {
    ...contract,
    createPermission: undefined,
    writePermission: undefined,
    supportsShow: false,
  })

export function canAccess(permissions: string[] | undefined, permission: string): boolean {
  if (!permissions) return false
  return permissions.includes('*') || permissions.includes(permission)
}
