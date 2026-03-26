import { useRef, useCallback } from 'react'

const DISMISS_VELOCITY = 0.4  // px/ms — 빠르게 던지면 dismiss
const DISMISS_DISTANCE = 120  // px  — 충분히 내리면 dismiss

/**
 * 모달 스와이프 다운 닫기 훅
 *
 * @param {Function} onClose - 닫기 콜백
 * @param {Object} options
 * @param {boolean} [options.disabled] - 비활성화 여부
 * @param {React.RefObject} [options.scrollRef] - 스크롤 가능한 내부 컨테이너 ref
 *   제공 시 scrollTop > 0이면 스와이프 비활성화 (스크롤 중 오작동 방지)
 *
 * @returns {{ overlayRef, modalRef, swipeHandlers }}
 *   - overlayRef: 배경 어두운 overlay div에 붙일 ref
 *   - modalRef:   모달 컨테이너 div에 붙일 ref
 *   - swipeHandlers: { onTouchStart, onTouchMove, onTouchEnd } — 모달에 spread
 */
export function useSwipeToDismiss(onClose, { disabled = false, scrollRef = null } = {}) {
  const overlayRef = useRef(null)
  const modalRef = useRef(null)

  const startY = useRef(0)
  const startTime = useRef(0)
  const dragDelta = useRef(0)
  const active = useRef(false)

  const onTouchStart = useCallback((e) => {
    if (disabled) return
    // 스크롤 가능한 영역이 위로 올라가 있으면 스와이프 비활성
    if (scrollRef?.current && scrollRef.current.scrollTop > 0) return

    startY.current = e.touches[0].clientY
    startTime.current = Date.now()
    dragDelta.current = 0
    active.current = true

    // 드래그 중 CSS transition 끄기 (레이턴시 제거)
    if (modalRef.current) modalRef.current.style.transition = 'none'
    if (overlayRef.current) overlayRef.current.style.transition = 'none'
  }, [disabled, scrollRef])

  const onTouchMove = useCallback((e) => {
    if (!active.current) return

    const d = e.touches[0].clientY - startY.current
    if (d < 0) {
      // 위로 올리는 건 무시
      active.current = false
      return
    }

    dragDelta.current = d

    // 살짝 저항감 — 너무 쉽게 내려가지 않도록
    const travel = d * (1 - d / 1400)

    if (modalRef.current) {
      modalRef.current.style.transform = `translateY(${travel}px)`
    }
    if (overlayRef.current) {
      // 배경 어두움이 서서히 사라짐 (0.65 기준)
      const progress = Math.min(travel / 260, 1)
      overlayRef.current.style.opacity = String(Math.max(0.05, 1 - progress * 0.9))
    }
  }, [])

  const onTouchEnd = useCallback(() => {
    if (!active.current) return
    active.current = false

    const d = dragDelta.current
    const elapsed = Date.now() - startTime.current
    const velocity = elapsed > 0 ? d / elapsed : 0

    const shouldDismiss = velocity > DISMISS_VELOCITY || d > DISMISS_DISTANCE

    if (shouldDismiss) {
      // 빠르게 내려가며 사라짐
      if (modalRef.current) {
        modalRef.current.style.transition = 'transform 0.22s ease-in'
        modalRef.current.style.transform = 'translateY(100%)'
      }
      if (overlayRef.current) {
        overlayRef.current.style.transition = 'opacity 0.22s ease-in'
        overlayRef.current.style.opacity = '0'
      }
      setTimeout(onClose, 220)
    } else {
      // 충분하지 않으면 스프링 복귀
      if (modalRef.current) {
        modalRef.current.style.transition = 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)'
        modalRef.current.style.transform = 'translateY(0)'
      }
      if (overlayRef.current) {
        overlayRef.current.style.transition = 'opacity 0.35s ease'
        overlayRef.current.style.opacity = '1'
      }
    }
  }, [onClose])

  return {
    overlayRef,
    modalRef,
    swipeHandlers: { onTouchStart, onTouchMove, onTouchEnd },
  }
}
