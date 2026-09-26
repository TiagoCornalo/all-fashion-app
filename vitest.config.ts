import { defineConfig, mergeConfig } from 'vitest/config'
import vite from './vite.config'
export default mergeConfig(vite, defineConfig({ test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'], include: ['src/**/*.test.{ts,tsx}'], restoreMocks: true } }))
