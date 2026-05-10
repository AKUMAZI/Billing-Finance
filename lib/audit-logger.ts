/**
 * Comprehensive audit logging system for API key operations
 * Tracks all authentication attempts, API usage, and security events
 */

export interface AuditLogEntry {
  timestamp: string
  event_id: string
  level: "info" | "warn" | "error" | "critical"
  action: string
  route: string
  method: string
  key_identifier: string
  key_type: "primary" | "secondary" | "legacy" | "unknown" | "none"
  http_status?: number
  success: boolean
  client_ip?: string
  user_agent?: string
  request_id?: string
  details?: Record<string, any>
  error_message?: string
  deprecated?: boolean
  response_time_ms?: number
}

/**
 * In-memory audit log storage (for development)
 * In production, replace with persistent storage (database, cloud logging, etc.)
 */
class AuditLogger {
  private logs: AuditLogEntry[] = []
  private maxLogs = 10000 // Keep last 10k logs in memory
  private enableLogging = process.env.API_KEY_USAGE_LOG_ENABLED !== "false"

  /**
   * Log an audit event
   */
  log(entry: Partial<AuditLogEntry>): void {
    if (!this.enableLogging) return

    const auditEntry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      event_id: this.generateEventId(),
      level: entry.level || "info",
      action: entry.action || "unknown",
      route: entry.route || "unknown",
      method: entry.method || "UNKNOWN",
      key_identifier: entry.key_identifier || "none",
      key_type: entry.key_type || "unknown",
      success: entry.success ?? false,
      ...entry
    }

    // Log to console (structured format)
    this.logToConsole(auditEntry)

    // Store in memory
    this.logs.push(auditEntry)

    // Maintain max log size
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // In production, send to external service
    if (process.env.NODE_ENV === "production") {
      this.sendToExternalService(auditEntry).catch(error => {
        console.error("[audit] Failed to send audit log:", error)
      })
    }
  }

  /**
   * Log successful authentication
   */
  logAuthSuccess(data: {
    route: string
    method: string
    key_identifier: string
    key_type: "primary" | "secondary" | "legacy"
    client_ip?: string
    user_agent?: string
    request_id?: string
    deprecated?: boolean
    response_time_ms?: number
  }): void {
    this.log({
      level: data.deprecated ? "warn" : "info",
      action: "api_key_validation_success",
      route: data.route,
      method: data.method,
      key_identifier: data.key_identifier,
      key_type: data.key_type,
      success: true,
      client_ip: data.client_ip,
      user_agent: data.user_agent,
      request_id: data.request_id,
      deprecated: data.deprecated,
      response_time_ms: data.response_time_ms,
      details: {
        ...(data.deprecated && {
          warning: "Using deprecated API key. Please migrate to production key."
        })
      }
    })
  }

  /**
   * Log failed authentication attempts
   */
  logAuthFailure(data: {
    route: string
    method: string
    key_identifier: string
    reason: string
    client_ip?: string
    user_agent?: string
    request_id?: string
    response_time_ms?: number
  }): void {
    this.log({
      level: "warn",
      action: "api_key_validation_failure",
      route: data.route,
      method: data.method,
      key_identifier: data.key_identifier,
      key_type: "unknown",
      success: false,
      client_ip: data.client_ip,
      user_agent: data.user_agent,
      request_id: data.request_id,
      response_time_ms: data.response_time_ms,
      error_message: data.reason,
      details: {
        reason: data.reason
      }
    })
  }

  /**
   * Log API key rotation events
   */
  logKeyRotation(data: {
    old_key_id: string
    new_key_id: string
    rotated_by: string
    request_id?: string
  }): void {
    this.log({
      level: "info",
      action: "api_key_rotation",
      route: "api_key_management",
      method: "ADMIN",
      key_identifier: data.new_key_id,
      key_type: "primary",
      success: true,
      request_id: data.request_id,
      details: {
        old_key_id: data.old_key_id,
        new_key_id: data.new_key_id,
        rotated_by: data.rotated_by
      }
    })
  }

  /**
   * Log suspicious activity (multiple failed attempts, etc.)
   */
  logSuspiciousActivity(data: {
    route: string
    reason: string
    client_ip?: string
    attempt_count?: number
    request_id?: string
  }): void {
    this.log({
      level: "critical",
      action: "suspicious_api_activity",
      route: data.route,
      method: "UNKNOWN",
      key_identifier: "suspicious",
      key_type: "unknown",
      success: false,
      client_ip: data.client_ip,
      request_id: data.request_id,
      error_message: data.reason,
      details: {
        reason: data.reason,
        attempt_count: data.attempt_count
      }
    })
  }

  /**
   * Get audit logs (for dashboard/monitoring)
   */
  getLogs(options?: {
    limit?: number
    offset?: number
    action?: string
    level?: string
    since?: Date
  }): AuditLogEntry[] {
    let filtered = [...this.logs]

    if (options?.action) {
      filtered = filtered.filter(log => log.action === options.action)
    }

    if (options?.level) {
      filtered = filtered.filter(log => log.level === options.level)
    }

    if (options?.since) {
      const sinceTime = options.since.getTime()
      filtered = filtered.filter(log => new Date(log.timestamp).getTime() >= sinceTime)
    }

    // Sort by timestamp descending (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    const offset = options?.offset ?? 0
    const limit = options?.limit ?? 100

    return filtered.slice(offset, offset + limit)
  }

  /**
   * Get audit statistics
   */
  getStats(since?: Date): {
    total_events: number
    successful_auths: number
    failed_auths: number
    legacy_key_usage: number
    suspicious_activity: number
  } {
    const logs = since ? this.getLogs({ since }) : this.logs

    return {
      total_events: logs.length,
      successful_auths: logs.filter(l => l.action === "api_key_validation_success" && l.success).length,
      failed_auths: logs.filter(l => l.action === "api_key_validation_failure" && !l.success).length,
      legacy_key_usage: logs.filter(l => l.key_type === "legacy").length,
      suspicious_activity: logs.filter(l => l.level === "critical").length
    }
  }

  /**
   * Clear old logs (retention management)
   */
  clearOldLogs(beforeDate: Date): number {
    const beforeTime = beforeDate.getTime()
    const originalLength = this.logs.length

    this.logs = this.logs.filter(log => new Date(log.timestamp).getTime() >= beforeTime)

    return originalLength - this.logs.length
  }

  /**
   * Export logs for external analysis/storage
   */
  exportLogs(since?: Date): string {
    const logs = since ? this.getLogs({ since, limit: Infinity }) : this.logs
    return JSON.stringify(logs, null, 2)
  }

  /**
   * Private method: Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Private method: Log to console in structured format
   */
  private logToConsole(entry: AuditLogEntry): void {
    const prefix = `[audit-${entry.level}]`
    const message = `${entry.action} on ${entry.route} - Key: ${entry.key_identifier} (${entry.key_type})`

    switch (entry.level) {
      case "critical":
        console.error(prefix, message, entry.details)
        break
      case "error":
        console.error(prefix, message, entry.details)
        break
      case "warn":
        console.warn(prefix, message, entry.details)
        break
      default:
        console.log(prefix, message, entry.details)
    }
  }

  /**
   * Private method: Send to external service in production
   * Replace with your logging service (CloudWatch, Datadog, Sentry, etc.)
   */
  private async sendToExternalService(entry: AuditLogEntry): Promise<void> {
    // Placeholder for external logging service integration
    // In production, implement actual integration:
    // - AWS CloudWatch
    // - Google Cloud Logging
    // - Datadog
    // - Sentry
    // - Splunk
    // - ELK Stack
    // etc.

    if (process.env.AUDIT_LOG_ENDPOINT) {
      try {
        const response = await fetch(process.env.AUDIT_LOG_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.AUDIT_LOG_TOKEN}` || ""
          },
          body: JSON.stringify(entry)
        })

        if (!response.ok) {
          console.error("[audit] Failed to send to external service:", response.status)
        }
      } catch (error) {
        console.error("[audit] Error sending to external service:", error)
      }
    }
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger()

/**
 * Convenience function to log auth success
 */
export function logAuthSuccess(data: Parameters<typeof auditLogger.logAuthSuccess>[0]): void {
  auditLogger.logAuthSuccess(data)
}

/**
 * Convenience function to log auth failure
 */
export function logAuthFailure(data: Parameters<typeof auditLogger.logAuthFailure>[0]): void {
  auditLogger.logAuthFailure(data)
}

/**
 * Convenience function to get logs
 */
export function getAuditLogs(options?: Parameters<typeof auditLogger.getLogs>[0]): AuditLogEntry[] {
  return auditLogger.getLogs(options)
}

/**
 * Convenience function to get stats
 */
export function getAuditStats(since?: Date) {
  return auditLogger.getStats(since)
}
