/**
 * Cross-platform speech utility
 * H5: uses Web Speech API (window.speechSynthesis)
 * Mini Program: TTS via innerAudioContext (placeholder)
 */

function isChineseText(text) {
  return /[\u4e00-\u9fff]/.test(text)
}

function findVoice(lang) {
  if (!window.speechSynthesis) return null
  const voices = window.speechSynthesis.getVoices()
  const exact = voices.find(v => v.lang === lang)
  if (exact) return exact
  const partial = voices.find(v => v.lang.startsWith(lang.split('-')[0]))
  if (partial) return partial
  return voices[0] || null
}

let voicesLoaded = false

export function initSpeech() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false
  window.speechSynthesis.getVoices()
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices()
    voicesLoaded = true
  }
  if (window.speechSynthesis.getVoices().length > 0) voicesLoaded = true
  return true
}

function getVoicesWithRetry(retries) {
  if (retries === undefined) retries = 5
  if (voicesLoaded) return
  var v = window.speechSynthesis.getVoices()
  if (v.length > 0) { voicesLoaded = true; return }
  if (retries > 0) {
    setTimeout(function() { getVoicesWithRetry(retries - 1) }, 300)
  }
}

export function speakText(text, onDone) {
  if (!window.speechSynthesis) {
    if (onDone) onDone()
    return
  }
  getVoicesWithRetry()
  window.speechSynthesis.cancel()
  var u = new SpeechSynthesisUtterance(text)
  if (isChineseText(text)) {
    u.lang = 'zh-CN'
    u.rate = 0.85
  } else {
    u.lang = 'en-US'
    u.rate = 0.82
  }
  u.pitch = 1
  u.volume = 1
  var voice = findVoice(u.lang)
  if (voice) u.voice = voice
  u.onend = function() { if (onDone) onDone() }
  u.onerror = function() { if (onDone) onDone() }
  window.speechSynthesis.speak(u)
}

export function speakSequence(texts, onDone, onStep) {
  var idx = 0
  function next() {
    if (idx >= texts.length) {
      if (onDone) onDone()
      return
    }
    speakText(texts[idx], function() {
      idx++
      if (onStep) onStep(idx)
      next()
    })
  }
  next()
}

export function cancelSpeech() {
  if (window.speechSynthesis) window.speechSynthesis.cancel()
}