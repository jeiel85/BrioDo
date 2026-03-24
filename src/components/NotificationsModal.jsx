import React from 'react'

export function NotificationsModal({ onClose, notifications, onShowAllAchievements, lang }) {
  const title = lang === 'ko' ? '알림 센터' : 'Notifications'
  const emptyText = lang === 'ko' ? '새로운 알림이 없습니다.' : 'No new notifications.'
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="settings-modal flex-col" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <div className="settings-title">💡 {title}</div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        
        <div className="notifications-body" style={{ padding: '20px', minHeight: '150px' }}>
          {notifications && notifications.length > 0 ? (
            <div className="notifications-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notifications.map((ach, i) => (
                <div key={i} className="notification-item" style={{
                  display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--color-surface-container)', padding: '12px', borderRadius: '12px'
                }}>
                  <div style={{ fontSize: '24px' }}>{ach.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                      {lang === 'ko' ? '업적 달성!' : 'Achievement Unlocked!'}
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--color-text)' }}>
                      {ach.name?.[lang] || ach.name?.ko}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-dim)' }}>
                      {ach.desc?.[lang] || ach.desc?.ko}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--color-text-dim)', marginTop: '40px' }}>
              {emptyText}
            </div>
          )}
        </div>
        
        <div className="settings-footer" style={{ borderTop: '1px solid var(--color-surface-container)', padding: '20px' }}>
          <button className="settings-logout-btn" style={{ width: '100%' }} onClick={() => { onClose(); onShowAllAchievements() }}>
            {lang === 'ko' ? '모든 업적 보기' : 'View All Achievements'}
          </button>
        </div>
      </div>
    </div>
  )
}
