"use client"

import styles from './loading.module.css'
import { AnimatedBuildings } from './AnimatedBuildings'
import { useState } from 'react'

export default function Loading({ onFinish }: { onFinish?: () => void }) {
  const [fadeOut, setFadeOut] = useState(false)

  // When AnimatedBuildings finishes, trigger fade out
  const handleFinish = () => {
    setFadeOut(true)
    setTimeout(() => {
      if (onFinish) onFinish()
    }, 500) // match fade duration
  }

  return (
    <div
      className={styles.reverlyLoaderContainer}
      style={{
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.5s cubic-bezier(.4,0,.2,1)',
        pointerEvents: fadeOut ? 'none' : undefined,
        background: fadeOut ? 'transparent' : undefined,
      }}
    >
      <div className={styles.reverlyLoader} role="status" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100vw', height: '100vh'}}>
        <AnimatedBuildings onFinish={handleFinish} />
      </div>
    </div>
  )
}
