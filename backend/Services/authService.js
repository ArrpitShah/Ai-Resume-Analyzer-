import supabase from "../config/Supabaseclient.js"


export async function signUp({ email, password, fullName }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName }
    }
  })

  if (error) throw new Error(error.message)

  return {
    user_id: data.user?.id,
    email:   data.user?.email,
    message: "Signup successful! Please verify your email.",
  }
}



export async function login({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw new Error(error.message)

  return {
    user_id:       data.user?.id,
    email:         data.user?.email,
    access_token:  data.session?.access_token,
    refresh_token: data.session?.refresh_token,
    expires_at:    data.session?.expires_at,
  }
}



export async function logout(accessToken) {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
  return { message: "Logged out successfully." }
}



export async function getUserFromToken(accessToken) {
  const { data, error } = await supabase.auth.getUser(accessToken)
  if (error) throw new Error(error.message)
  return data.user
}



export async function refreshSession(refreshToken) {
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  })

  if (error) throw new Error(error.message)

  return {
    access_token:  data.session?.access_token,
    refresh_token: data.session?.refresh_token,
    expires_at:    data.session?.expires_at,
  }
}



export async function forgotPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: process.env.PASSWORD_RESET_URL ?? "http://localhost:3000/reset-password",
  })

  if (error) throw new Error(error.message)
  return { message: "Password reset email sent." }
}