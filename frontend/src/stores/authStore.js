import { create } from "zustand"

const useAuthStore = create((set) => ({
  user:           null,
  token:          localStorage.getItem("access_token") ?? null,
  isAuth:         !!localStorage.getItem("access_token"),
  lastResumeId:   null,
  lastResumeData: null,   
  lastAnalysis:   null,
  darkMode:       localStorage.getItem("darkMode") === "true",

  setLastResumeId:   (id)   => set({ lastResumeId: id }),
  setLastResumeData: (data) => set({ lastResumeData: data }), 
  setLastAnalysis:   (a)    => set({ lastAnalysis: a }),


  setAuth: (data, token) => {
    const savedName  = localStorage.getItem("user_display_name") ?? ""
    const savedPhoto = localStorage.getItem("user_photo") ?? ""
    localStorage.setItem("access_token", token)
    set({
      user: {
        id:          data.user_id ?? data.id ?? null,
        email:       data.email   ?? null,
        displayName: savedName,
        photo:       savedPhoto,
      },
      token,
      isAuth: true,
    })
  },


  updateProfile: ({ displayName, photo }) =>
    set((state) => {
      if (displayName !== undefined) localStorage.setItem("user_display_name", displayName)
      if (photo !== undefined)       localStorage.setItem("user_photo", photo)
      return {
        user: {
          ...state.user,
          displayName: displayName ?? state.user?.displayName,
          photo:       photo       ?? state.user?.photo,
        }
      }
    }),

  clearAuth: () => {
    localStorage.removeItem("access_token")
    set({ user: null, token: null, isAuth: false, lastResumeId: null, lastResumeData: null, lastAnalysis: null })
  },

  toggleDarkMode: () =>
    set((state) => {
      const next = !state.darkMode
      localStorage.setItem("darkMode", String(next))
      if (next) document.documentElement.classList.add("dark")
      else      document.documentElement.classList.remove("dark")
      return { darkMode: next }
    }),
}))

export default useAuthStore