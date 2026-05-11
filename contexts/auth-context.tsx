"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  fullName: string
  role: string
  department: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated on mount
    const checkAuth = () => {
      const storedUser = localStorage.getItem('user')
      const isAuthenticated = localStorage.getItem('isAuthenticated')

      if (storedUser && isAuthenticated === 'true') {
        setUser(JSON.parse(storedUser))
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, subsystem: "Billing" }),
      })

      if (!response.ok) {
        setIsLoading(false)
        return false
      }

      const result = await response.json()

      // Best-effort mapping: if the admin API returns user details, store them.
      const apiUser = result?.data?.user
      const resolvedUserId =
        apiUser?.user_id ||
        apiUser?.id ||
        (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : "00000000-0000-0000-0000-000000000000")
      const mockUser: User = {
        id: String(resolvedUserId),
        email: String(apiUser?.email ?? username),
        fullName: String(apiUser?.fullName ?? apiUser?.full_name ?? "Billing & Finance Admin"),
        role: String(apiUser?.role ?? "Admin"),
        department: String(apiUser?.department ?? "Billing"),
      }

      setUser(mockUser)
      localStorage.setItem("user", JSON.stringify(mockUser))
      localStorage.setItem("isAuthenticated", "true")

      // Persist token if present (optional usage elsewhere)
      const token = result?.data?.token ?? result?.data?.accessToken ?? result?.data?.access_token
      if (token) {
        localStorage.setItem("authToken", String(token))
      }

      // Notify admin subsystem audit trail for successful logins.
      const billingApiKey = process.env.NEXT_PUBLIC_BILLING_API_KEY
      await fetch("/api/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(billingApiKey ? { "x-api-key": billingApiKey } : {}),
        },
        body: JSON.stringify({
          user_id: mockUser.id,
          action_type: "LOGIN",
          details: `User ${username} logged in to Billing subsystem`,
          subsystem: "Billing",
        }),
      }).catch(() => {
        // Login should still succeed even if audit logging is temporarily unavailable.
      })

      setIsLoading(false)
      return true
    } catch {
      setIsLoading(false)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
    localStorage.removeItem('isAuthenticated')
    router.push('/')
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}