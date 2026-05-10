import { useEffect, useRef, useState } from 'react'

export default function CursorGlow() {
  const ref = useRef(null)
  const [enabled, setEnabled] = useState(false)

  // Only render on hover-capable, fine-pointer devices and respect reduced motion.
  useEffect(() => {
    const hover = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setEnabled(hover.matches && !reduce.matches)
    update()
    hover.addEventListener('change', update)
    reduce.addEventListener('change', update)
    return () => {
      hover.removeEventListener('change', update)
      reduce.removeEventListener('change', update)
    }
  }, [])

  // Smooth-follow animation with rAF; mutates DOM directly to avoid re-render thrash.
  useEffect(() => {
    if (!enabled) return
    const el = ref.current
    if (!el) return

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    const pos = { ...target }
    let raf = 0

    const onMove = (e) => {
      target.x = e.clientX
      target.y = e.clientY
      el.style.opacity = '1'
    }
    const onLeave = () => { el.style.opacity = '0' }

    const tick = () => {
      pos.x += (target.x - pos.x) * 0.18
      pos.y += (target.y - pos.y) * 0.18
      el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`
      raf = requestAnimationFrame(tick)
    }
    tick()

    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('mouseenter', onMove)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mouseenter', onMove)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <>
      {/* Outer soft halo */}
      <div
        ref={ref}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[60] h-[520px] w-[520px] rounded-full opacity-0 mix-blend-screen transition-opacity duration-300"
        style={{
          background:
            'radial-gradient(circle, rgba(237,40,40,0.22) 0%, rgba(237,40,40,0.10) 35%, rgba(237,40,40,0) 70%)',
          willChange: 'transform, opacity',
        }}
      />
    </>
  )
}
