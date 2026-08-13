import { supabaseAdmin } from './supabase'

const COOLDOWN_MS = 4 * 60 * 60 * 1000 // 4 hours

// Returns null if the trainee can attempt now, or { retryAtIso, minutesRemaining } if still cooling down.
export async function getQuizCooldown(userEmail, moduleId) {
  const { data: lastAttempt } = await supabaseAdmin
    .from('quiz_attempts')
    .select('passed, created_at')
    .eq('user_email', userEmail)
    .eq('module_id', moduleId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!lastAttempt || lastAttempt.passed) return null

  const elapsed = Date.now() - new Date(lastAttempt.created_at).getTime()
  if (elapsed >= COOLDOWN_MS) return null

  const retryAt = new Date(new Date(lastAttempt.created_at).getTime() + COOLDOWN_MS)
  return {
    retryAtIso: retryAt.toISOString(),
    minutesRemaining: Math.ceil((COOLDOWN_MS - elapsed) / 60000),
  }
}
