"use client"

import { useState, useEffect } from "react"
import { Bell, User, LogOut, Settings, Clock, Trash2, Save, X, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/contexts/auth-context"

interface HeaderProps {
  title: string
}

// Mock notification data
const mockNotifications = [
  {
    id: 1,
    title: "Invoice Generated",
    message: "Invoice INV-2024-001 has been successfully generated",
    timestamp: "2 minutes ago",
    read: false,
  },
  {
    id: 2,
    title: "Payment Received",
    message: "Payment of $5,000 received from John Doe",
    timestamp: "15 minutes ago",
    read: false,
  },
  {
    id: 3,
    title: "Insurance Claim Updated",
    message: "Claim CLM-2024-045 status updated to 'Pending Review'",
    timestamp: "1 hour ago",
    read: true,
  },
]

// Settings schemas
const generalSettingsSchema = z.object({
  language: z.string(),
  dateFormat: z.string(),
  timeZone: z.string(),
})

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  inAppNotifications: z.boolean(),
  newInvoiceAlerts: z.boolean(),
  paymentConfirmations: z.boolean(),
})

const profileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  role: z.string(),
  department: z.string(),
})

type GeneralSettings = z.infer<typeof generalSettingsSchema>
type NotificationSettings = z.infer<typeof notificationSettingsSchema>
type ProfileData = z.infer<typeof profileSchema>

export function Header({ title }: HeaderProps) {
  const { logout } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState(mockNotifications)
  const [openNotifications, setOpenNotifications] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)

  // Settings state
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    language: "English",
    dateFormat: "MM/DD/YYYY",
    timeZone: "UTC - 5 (EST)",
  })

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    inAppNotifications: true,
    newInvoiceAlerts: true,
    paymentConfirmations: true,
  })

  // Profile state
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: "Admin User",
    email: "admin@healthcare.com",
    role: "System Administrator",
    department: "Finance & Billing",
  })

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedGeneral = localStorage.getItem("generalSettings")
    const savedNotifications = localStorage.getItem("notificationSettings")
    const savedProfile = localStorage.getItem("profileData")

    if (savedGeneral) {
      setGeneralSettings(JSON.parse(savedGeneral))
    }
    if (savedNotifications) {
      setNotificationSettings(JSON.parse(savedNotifications))
    }
    if (savedProfile) {
      setProfileData(JSON.parse(savedProfile))
    }
  }, [])

  // Save settings to localStorage
  const saveGeneralSettings = (settings: GeneralSettings) => {
    setGeneralSettings(settings)
    localStorage.setItem("generalSettings", JSON.stringify(settings))
  }

  const saveNotificationSettings = (settings: NotificationSettings) => {
    setNotificationSettings(settings)
    localStorage.setItem("notificationSettings", JSON.stringify(settings))
  }

  const saveProfileData = (data: ProfileData) => {
    setProfileData(data)
    localStorage.setItem("profileData", JSON.stringify(data))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  return (
    <header className="sticky top-0 z-50 h-16 bg-card border-b border-border flex items-center justify-between px-6 shadow-sm">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <Popover open={openNotifications} onOpenChange={setOpenNotifications}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="font-semibold">Notifications</h2>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs h-auto px-2 py-1"
                >
                  Mark all as read
                </Button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`border-b border-border p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                      !notification.read ? "bg-accent/5" : ""
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{notification.title}</p>
                          {!notification.read && (
                            <Badge variant="default" className="h-1.5 w-1.5 p-0 rounded-full" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {notification.timestamp}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(notification.id)
                        }}
                        className="h-auto p-1"
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Profile & Settings */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  AD
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">Admin User</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => {
                setProfileOpen(true)
                setSettingsOpen(false)
              }}
            >
              <User className="w-4 h-4 mr-2" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => {
                setSettingsOpen(true)
                setProfileOpen(false)
              }}
            >
              <Settings className="w-4 h-4 mr-2" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile Dialog */}
        <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>User Profile</DialogTitle>
              <DialogDescription>
                {isEditingProfile ? "Edit your account information" : "Manage your account information"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="flex justify-center">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {profileData.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              {isEditingProfile ? (
                <ProfileEditForm
                  profileData={profileData}
                  onSave={(data) => {
                    saveProfileData(data)
                    setIsEditingProfile(false)
                  }}
                  onCancel={() => setIsEditingProfile(false)}
                />
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Full Name</Label>
                    <Input value={profileData.fullName} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Email Address</Label>
                    <Input value={profileData.email} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Role</Label>
                    <Input value={profileData.role} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Department</Label>
                    <Input value={profileData.department} readOnly className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Member Since</Label>
                    <Input value="January 15, 2024" readOnly className="bg-muted" />
                  </div>
                  <Button
                    onClick={() => setIsEditingProfile(true)}
                    className="w-full"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Settings Dialog */}
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Settings</DialogTitle>
              <DialogDescription>
                Manage your account settings and preferences
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <GeneralSettingsTab
                  settings={generalSettings}
                  onSave={saveGeneralSettings}
                />
              </TabsContent>

              <TabsContent value="notifications" className="space-y-4">
                <NotificationSettingsTab
                  settings={notificationSettings}
                  onSave={saveNotificationSettings}
                />
              </TabsContent>

              <TabsContent value="security" className="space-y-4">
                <SecuritySettingsTab />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  )
}

function ProfileEditForm({ profileData, onSave, onCancel }: {
  profileData: ProfileData
  onSave: (data: ProfileData) => void
  onCancel: () => void
}) {
  const form = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: profileData,
  })

  const onSubmit = (data: ProfileData) => {
    onSave(data)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          {...form.register("fullName")}
          className={form.formState.errors.fullName ? "border-destructive" : ""}
        />
        {form.formState.errors.fullName && (
          <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          {...form.register("email")}
          className={form.formState.errors.email ? "border-destructive" : ""}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Input
          id="role"
          {...form.register("role")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="department">Department</Label>
        <Input
          id="department"
          {...form.register("department")}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </DialogFooter>
    </form>
  )
}

function GeneralSettingsTab({ settings, onSave }: {
  settings: GeneralSettings
  onSave: (settings: GeneralSettings) => void
}) {
  const [localSettings, setLocalSettings] = useState(settings)

  const handleSave = () => {
    onSave(localSettings)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Language</Label>
        <select
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
          value={localSettings.language}
          onChange={(e) => setLocalSettings(prev => ({ ...prev, language: e.target.value }))}
        >
          <option>English</option>
          <option>Spanish</option>
          <option>French</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Date Format</Label>
        <select
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
          value={localSettings.dateFormat}
          onChange={(e) => setLocalSettings(prev => ({ ...prev, dateFormat: e.target.value }))}
        >
          <option>MM/DD/YYYY</option>
          <option>DD/MM/YYYY</option>
          <option>YYYY-MM-DD</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium">Time Zone</Label>
        <select
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
          value={localSettings.timeZone}
          onChange={(e) => setLocalSettings(prev => ({ ...prev, timeZone: e.target.value }))}
        >
          <option>UTC - 5 (EST)</option>
          <option>UTC - 6 (CST)</option>
          <option>UTC - 7 (MST)</option>
          <option>UTC - 8 (PST)</option>
        </select>
      </div>
      <Button onClick={handleSave} className="w-full">
        <Save className="w-4 h-4 mr-2" />
        Save General Settings
      </Button>
    </div>
  )
}

function NotificationSettingsTab({ settings, onSave }: {
  settings: NotificationSettings
  onSave: (settings: NotificationSettings) => void
}) {
  const [localSettings, setLocalSettings] = useState(settings)

  const handleSave = () => {
    onSave(localSettings)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">Email Notifications</Label>
          <p className="text-xs text-muted-foreground">Receive updates via email</p>
        </div>
        <Switch
          checked={localSettings.emailNotifications}
          onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, emailNotifications: checked }))}
        />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">In-App Notifications</Label>
          <p className="text-xs text-muted-foreground">Show alerts in the system</p>
        </div>
        <Switch
          checked={localSettings.inAppNotifications}
          onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, inAppNotifications: checked }))}
        />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">New Invoice Alerts</Label>
          <p className="text-xs text-muted-foreground">Notify on invoice generation</p>
        </div>
        <Switch
          checked={localSettings.newInvoiceAlerts}
          onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, newInvoiceAlerts: checked }))}
        />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">Payment Confirmations</Label>
          <p className="text-xs text-muted-foreground">Notify on payment received</p>
        </div>
        <Switch
          checked={localSettings.paymentConfirmations}
          onCheckedChange={(checked) => setLocalSettings(prev => ({ ...prev, paymentConfirmations: checked }))}
        />
      </div>
      <Button onClick={handleSave} className="w-full">
        <Save className="w-4 h-4 mr-2" />
        Save Notification Settings
      </Button>
    </div>
  )
}

function SecuritySettingsTab() {
  return (
    <div className="space-y-4">
      <Button variant="outline" className="w-full justify-start">
        Change Password
      </Button>
      <Button variant="outline" className="w-full justify-start">
        Two-Factor Authentication
      </Button>
      <Button variant="outline" className="w-full justify-start">
        Active Sessions
      </Button>
      <Button variant="outline" className="w-full justify-start">
        View Login History
      </Button>
    </div>
  )
}
