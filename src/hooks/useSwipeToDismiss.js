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
 * @param {React.RefObject} [options.handleRef] - 스와이프를 허용할 핸들 영역 ref
 *   제공 시 해당 영역 안에서 시작한 터치만 스와이프 활성화 (헤더 전용 스와이프)
 *
 * @returns {{ overlayRef, modalRef, swipeHandlers }}
 *   - overlayRef: 배경 어두운 overlay div에 붙일 ref
 *   - modalRef:   모달 컨테이너 div에 붙일 ref
 *   - swipeHandlers: { onTouchStart, onTouchMove, onTouchEnd } — 모달에 spread
 */
export function useSwipeToDismiss(onClose, { disabled = false, scrollRef = null, handleRef = null } = {}) {
  const overlayRef = useRef(null)
  const modalRef = useRef(null)

  const startY = useRef(0)
  const startTime = useRef(0)
  const dragDelta = useRef(0)
  const active = useRef(false)

  const onTouchStart = useCallback((e) => {
    if (disabled) return
    // 핸들 영역 제한: handleRef가 있으면 그 안에서 시작한 터치만 활성화
    if (handleRef?.current && !handleRef.current.contains(e.target)) return
    // 스크롤 가능한 영역이 위로 올라가 있으면 스와이프 비활성
    if (scrollRef?.current && scrollRef.current.scrollTop > 0) return

    startY.current = e.touches[0].clientY
    startTime.current = Date.now()
    dragDelta.current = 0
    active.current = true

    // 드래그 중 CSS transition 끄기 (레이턴시 제거)
    if (modalRef.current) modalRef.current.style.transition = 'none'
    if (overlayRef.current) overlayRef.current.style.transition = 'none'
  }, [disabled, handleRef, scrollRef])

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
      // 80% 내려왔을 때부터 배경 밝아지기 시작
      const deadzone = DISMISS_DISTANCE * 0.8
      const progress = Math.min(Math.max(0, (travel - deadzone) / (260 - deadzone)), 1)
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
