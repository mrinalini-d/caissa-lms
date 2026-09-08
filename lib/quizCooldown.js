// Quiz retry cooldown is disabled — trainees can retake a failed quiz
// immediately. Kept as a function (rather than deleted) so every call site
// in the main app and the JS block API keeps working with zero changes.
export async function getQuizCooldown() {
  return null
}
