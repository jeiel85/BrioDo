import React, { useRef } from 'react'
import { useSwipeToDismiss } from '../hooks/useSwipeToDismiss'

export function NotificationsModal({ onClose, notifications, onShowAllAchievements, lang }) {
  const title = lang === 'ko' ? '알림 센터' : lang === 'ja' ? '通知センター' : lang === 'zh' ? '通知中心' : 'Notifications'
  const emptyText = lang === 'ko' ? '새로운 알림이 없습니다.' : lang === 'ja' ? '新しい通知はありません。' : lang === 'zh' ? '没有新通知。' : 'No new notifications.'
  const achLabel = lang === 'ko' ? '업적 달성!' : lang === 'ja' ? '実績解除！' : lang === 'zh' ? '成就解锁！' : 'Achievement Unlocked!'
  const allAchBtn = lang === 'ko' ? '모든 업적 보기' : lang === 'ja' ? '全実績を見る' : lang === 'zh' ? '查看所有成就' : 'View All Achievements'

  const headerRef = useRef(null)
  const { overlayRef, modalRef, swipeHandlers } = useSwipeToDismiss(onClose, { handleRef: headerRef })

  return (
    <div className="input-overlay" ref={overlayRef} onClick={onClose}>
      <div className="settings-modal notif-modal" ref={modalRef} onClick={e => e.stopPropagation()} {...swipeHandlers}>
        <div className="modal-drag-handle-zone" ref={headerRef}>
          <div className="modal-drag-handle" />
        </div>
        <div className="settings-header">
          <h2 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>💡</span> {title}
          </h2>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>

        <div className="notif-body">
          {notifications && notifications.length > 0 ? (
            <div className="notif-list">
              {notifications.map((ach, i) => (
                <div key={i} className="notif-item">
                  <div className="notif-item-icon">{ach.icon}</div>
                  <div className="notif-item-content">
                    <div className="notif-item-label">{achLabel}</div>
                    <div className="notif-item-name">{ach.name?.[lang] || ach.name?.ko}</div>
                    <div className="notif-item-desc">{ach.desc?.[lang] || ach.desc?.ko}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="notif-empty">{emptyText}</div>
          )}
        </div>

        <div className="notif-footer">
          <button className="notif-all-btn" onClick={() => { onClose(); onShowAllAchievements() }}>
            {allAchBtn}
          </button>
        </div>
      </div>
    </div>
  )
}
