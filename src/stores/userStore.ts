import { create } from 'zustand'
import { User } from '../types/auth.types'

interface UserStore {
  user: User | null
  setUser: (user: User) => void
  logout: () => void
  getUser: () => User | null
}

const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  setUser: (user: User) => set({ user }),
  logout: () => set({ user: null }),
  getUser: () => get().user
}))

export default useUserStore
