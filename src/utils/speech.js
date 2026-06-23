/**
 * Cross-platform speech utility
 * H5: uses Web Speech API (window.speechSynthesis) with voice quality enhancement
 * Mini Program: TTS via innerAudioContext (placeholder)
 *
 * On Mac/Safari the native speechSynthesis can sound robotic/tinny.
 * On iOS Safari, calling speechSynthesis.cancel() before speak() causes silent audio -
 * this is a well-known iOS bug. iOS does not use network TTS (Google blocked in China).
 * Strategy:
 *   1) Prefer high-quality system voices by name (Samantha, Karen, Google US English, etc.)
 *   2) Fall back to a network-based TTS (Google Translate) for better quality
 *   3) Handle Safari's async voice loading quirks
 *   4) iOS: use native speechSynthesis only, skip cancel() before speak(), skip keepAlive
 */

// --- helpers ---

function isIOS() {
  if (typeof navigator === 'undefined') return false
  var ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua)
}

function isChineseText(text) {
  return /[\u4e00-\u9fff]/.test(text)
}

// High-quality voice names (preferred order) per locale.
const PREFERRED_VOICES_EN = [
  'Samantha', 'Google US English', 'Karen', 'Google UK English Female',
  'Daniel', 'Google UK English Male', 'Veena', 'Moira', 'Tessa',
  'Fiona', 'Alex', 'Fred',
]
const PREFERRED_VOICES_ZH = [
  'Ting-Ting', "Google 普通话", 'Sin-Ji', 'Mei-Jia', 'Yu-Shu',
  'Lili', "Google 粤语",
]

function findVoice(lang) {
  if (!window.speechSynthesis || typeof window.speechSynthesis.getVoices !== 'function') return null
  const voices = window.speechSynthesis.getVoices()
  if (!voices || voices.length === 0) return null

  const isEN = lang.startsWith('en')
  const preferred = isEN ? PREFERRED_VOICES_EN : PREFERRED_VOICES_ZH

  for (const name of preferred) {
    const match = voices.find(function(v) {
      return v.name === name && (v.lang === lang || v.lang.startsWith(lang.split('-')[0]))
    })
    if (match) return match
  }

  const exact = voices.find(function(v) { return v.lang === lang })
  if (exact) return exact

  const partial = voices.find(function(v) { return v.lang.startsWith(lang.split('-')[0]) })
  if (partial) return partial

  return voices[0] || null
}

// --- Initialisation ---

let _voicesLoaded = false
let _voiceInitCalled = false
let _voicePromises = []

export function initSpeech() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false
  if (_voiceInitCalled) return true
  _voiceInitCalled = true

  const v = window.speechSynthesis.getVoices()
  if (v && v.length > 0) {
    _voicesLoaded = true
  }

  window.speechSynthesis.onvoiceschanged = function () {
    window.speechSynthesis.getVoices()
    _voicesLoaded = true
    _voicePromises.forEach(function (p) { p() })
    _voicePromises = []
  }
  return true
}

function ensureVoices(callback) {
  if (_voicesLoaded) {
    var v = window.speechSynthesis.getVoices()
    if (v && v.length > 0) { callback(); return }
  }
  _voicePromises.push(callback)
  if (_voicePromises.length === 1) {
    setTimeout(function () {
      _voicesLoaded = true
      var pending = _voicePromises.slice()
      _voicePromises = []
      pending.forEach(function (p) { p() })
    }, 2000)
  }
}

// --- Network TTS fallback (Google Translate) ---

function getNetworkVoiceUrl(text, lang) {
  const tl = lang.startsWith('en') ? 'en' : 'zh-CN'
  return 'https://translate.google.com/translate_tts?ie=UTF-8&q='
    + encodeURIComponent(text)
    + '&tl=' + tl
    + '&client=tw-ob'
    + '&ttsspeed=0.85'
}

function playNetworkVoice(text, lang, onDone) {
  var audio = new Audio()
  var src = getNetworkVoiceUrl(text, lang)
  audio.src = src
  audio.volume = 1
  audio.onended = function () { if (onDone) onDone() }
  audio.onerror = function () { if (onDone) onDone() }
  try { audio.play().catch(function () { if (onDone) onDone() }) } catch (e) { if (onDone) onDone() }
  return audio
}

// --- Main speak functions ---

function shouldUseNetworkTTS() {
  if (isIOS()) return false
  var ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  var isSafari = /^((?!chrome|android).)*safari/i.test(ua)
  var isFirefoxMac = /Firefox/.test(ua) && /Mac/.test(ua)
  return isSafari || isFirefoxMac
}

var _useNetworkTTS = null
function decideTTSStrategy() {
  if (_useNetworkTTS !== null) return _useNetworkTTS
  _useNetworkTTS = shouldUseNetworkTTS()
  return _useNetworkTTS
}

export function speakText(text, onDone) {
  if (!text) {
    if (onDone) onDone()
    return
  }

  // iOS Safari bug: cancel() before speak() in the same execution context
  // causes silent audio. Skip cancel() on iOS.
  if (!isIOS()) {
    window.speechSynthesis.cancel()
  }

  if (decideTTSStrategy()) {
    playNetworkVoice(text, isChineseText(text) ? 'zh-CN' : 'en-US', onDone)
    return
  }

  if (!window.speechSynthesis) {
    if (onDone) onDone()
    return
  }

  var u = new SpeechSynthesisUtterance(text)
  if (isChineseText(text)) {
    u.lang = 'zh-CN'
    u.rate = 0.82
  } else {
    u.lang = 'en-US'
    u.rate = 0.80
  }
  u.pitch = 1
  u.volume = 1

  ensureVoices(function () {
    var voice = findVoice(u.lang)
    if (voice) u.voice = voice
    window.speechSynthesis.speak(u)
  })

  u.onend = function() { if (onDone) onDone() }
  u.onerror = function() { if (onDone) onDone() }

  // iOS does not need the keepAlive pause/resume hack - it may interfere
  if (!isIOS()) {
    var keepAlive = setInterval(function () {
      if (window.speechSynthesis.speaking === false) {
        clearInterval(keepAlive)
      } else {
        window.speechSynthesis.pause()
        window.speechSynthesis.resume()
      }
    }, 10000)
  }
}

export function speakSequence(texts, onDone, onStep) {
  if (!texts || texts.length === 0) {
    if (onDone) onDone()
    return
  }
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

export { isIOS }
