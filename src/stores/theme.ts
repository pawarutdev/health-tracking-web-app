import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'app-theme'

function detectInitial(): ThemeMode {
  const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function apply(mode: ThemeMode) {
  const root = document.documentElement
  if (mode === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
  root.dataset.theme = mode
}

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>(detectInitial())
  apply(mode.value)

  watch(mode, (m) => {
    localStorage.setItem(STORAGE_KEY, m)
    apply(m)
  })

  function toggle() {
    mode.value = mode.value === 'dark' ? 'light' : 'dark'
  }

  function set(m: ThemeMode) {
    mode.value = m
  }

  return { mode, toggle, set }
})
