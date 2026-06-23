const STORAGE_KEY = 'root-progress'

/**
 * Get all saved progress data
 * @returns {Object} map of rootName -> bestCorrectCount
 */
export function getProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

/**
 * Save quiz result for a root, keeping the best score
 * @param {string} rootName
 * @param {number} correctCount
 */
export function saveProgress(rootName, correctCount) {
  const progress = getProgress()
  const prev = progress[rootName]
  if (prev === undefined || correctCount > prev) {
    progress[rootName] = correctCount
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  }
}

/**
 * Get segment class for a given position in a root's progress bar
 * @param {string} rootName
 * @param {number} wordIndex - position of this segment (0-based)
 * @param {number} totalWords - total words in this root
 * @returns {string} CSS class: '' (unfilled), 'filled-partial', 'filled-all'
 */
export function getSegClass(rootName, wordIndex, totalWords) {
  const progress = getProgress()
  const correct = progress[rootName]
  if (correct === undefined) return 'seg-empty'
  if (wordIndex < correct) {
    return correct >= totalWords ? 'seg-filled-all' : 'seg-filled-partial'
  }
  return 'seg-empty'
}

/**
 * Get overall status for a root's progress bar
 * @param {string} rootName
 * @param {number} totalWords
 * @returns {string} 'none' | 'partial' | 'all'
 */
export function getProgressStatus(rootName, totalWords) {
  const progress = getProgress()
  const correct = progress[rootName]
  if (correct === undefined) return 'none'
  if (correct >= totalWords) return 'all'
  return 'partial'
}
