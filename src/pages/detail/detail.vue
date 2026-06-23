<template>  <div class="page">    <div class="header">      <span class="back-btn" @click="goBack"><span class="back-arrow">‹</span></span><span class="header-title">词根详情</span>    </div>    <view class="main">      <view :key="renderKey">      <!-- Root Header -->      <div class="root-header">        <div class="root-row">          <span class="root-icon">{{ rootData.icon }}</span>          <span class="root-name">-{{ rootData.root }}-</span>          <span class="root-meaning-tag">{{ rootData.meaning }}</span>          <button class="btn btn-sm" style="background:#2b6f9b;margin-left:auto;color:#fff" @click="goQuizRoot">✎ 记忆测试</button>        </div>        <span class="root-origin">词源: {{ rootData.origin }}</span>      </div>      <!-- Affixes -->      <div class="section">        <span class="section-title">前后缀</span>        <div class="affix-list">          <div            v-for="a in affixes"            :key="a[0] + a[1]"            class="affix-tag"            :class="a[0] === 'prefix' ? 'pre' : 'suf'"          >            <span class="affix-morpheme">{{ a[1] }}</span>            <span class="affix-meaning">{{ a[2] }}</span>          </div>        </div>      </div>      <!-- Word List -->      <div class="section">        <span class="section-title">单词 ({{ words.length }})</span>        <div class="word-list">                    <div v-for="(w, wi) in words" :key="wi" class="word-card" :class="{ 'card-playing': playingCardIndex === wi }" @click="speakCard(w, wi)">
            <div class="word-top">
              <span class="word-text">{{ w[0] }}</span>
              <span class="word-pos">{{ w[1] }}</span>
              <span class="word-phonetic">{{ w[5] }}</span>
              <span v-if="playingCardIndex === wi" class="speaking-indicator">🔊</span>
            </div>
            <div class="word-meaning-row">
            <div class="word-morph">
              <template v-for="(p, pi) in w[2]" :key="pi">
              <span class="morph-part" :class="{ prefix: p.endsWith('-'), suffix: p.startsWith('-'), root: !p.endsWith('-') && !p.startsWith('-') }">{{ p }}</span>
              <span v-if="pi < w[2].length-1" class="morph-sep">+</span>
              </template>
            </div>
            <span class="word-meaning">{{ w[3] }}</span>
            </div>
            <div class="word-example">
              <span class="example-en">{{ w[4] }}</span>
            </div>
            <span class="example-cn">{{ w[6] }}</span>          </div>        </div>      </div>      <!-- Navigation -->      <div class="root-nav">        <div class="nav-btn" :class="{ disabled: currentIndex <= 0 }" @click="goPrev">◀ 上一个</div>        <span class="nav-mid">{{ currentIndex + 1 }}/{{ DATA.length }} -{{ rootData.root }}-</span>        <div class="nav-btn" :class="{ disabled: currentIndex >= DATA.length - 1 }" @click="goNext">下一个 ▶</div>      </div>     <div class="footer">        <span>©merfy</span>      </div>      </view>    </view>  </div></template>
<script setup>
 import { ref } from 'vue'
 import { onLoad, onShow } from '@dcloudio/uni-app'
 import DATA from '@/utils/data'
 import { speakSequence, cancelSpeech, initSpeech, isIOS } from '@/utils/speech'
 import { getAffixMeaning } from '@/utils/affixes'
const currentIndex = ref(0)
const renderKey = ref(0)
const playingCardIndex = ref(-1)
const rootData = ref({})
const words = ref([])
const affixes = ref([])
function saveLastRoot() {
  try { localStorage.setItem('lastRootIndex', currentIndex.value.toString()) } catch (e) {}
}
 function loadData(idx) {
   const d = DATA[idx]
   if (d) {
     rootData.value = d
     words.value = d.words || []
     if (d.affixes) {
       const copy = JSON.parse(JSON.stringify(d.affixes))
       copy.forEach(a => {
         if (!a[2]) {
           const m = getAffixMeaning(a[1])
           if (m) a[2] = m
         }
       })
       copy.sort((a, b) => (a[0] === b[0] ? 0 : a[0] === 'prefix' ? -1 : 1))
       affixes.value = copy
     } else {
       affixes.value = []
     }
   }
 }
 onLoad((options) => {
   initSpeech()
   if (options.index !== undefined) {
     currentIndex.value = parseInt(options.index) || 0
   }
   loadData(currentIndex.value)
    saveLastRoot()
  })
  onShow(() => {
    saveLastRoot()
  })
 function goBack() {
  cancelSpeech()
  uni.navigateBack()
}
function goPrev() {
  if (currentIndex.value > 0) {
    playingCardIndex.value = -1
    currentIndex.value--
    renderKey.value++
    loadData(currentIndex.value)
    saveLastRoot()
  }
}
function goNext() {
  if (currentIndex.value < DATA.length - 1) {
    playingCardIndex.value = -1
    currentIndex.value++
    renderKey.value++
    loadData(currentIndex.value)
    saveLastRoot()
  }
}
function goQuizRoot() {
  cancelSpeech()
  uni.navigateTo({ url: `/pages/quiz/quiz?scope=${encodeURIComponent(rootData.value.root)}&fromIndex=${currentIndex.value}` })
}
function speakCard(w, wi) {
  // iOS Safari bug: cancel() followed by speak() in the same execution context
  // makes audio silent. Skip explicit cancel on iOS; let the new utterance play
  // after the current one finishes naturally.
  if (!isIOS()) {
    cancelSpeech()
  }
  if (playingCardIndex.value === wi) {
    playingCardIndex.value = -1
    return
  }
  playingCardIndex.value = wi
  const texts = [w[0], w[4]].filter(Boolean)
  speakSequence(texts, () => {
    playingCardIndex.value = -1
  })
}
</script><style scoped>.page { display: flex; flex-direction: column; min-height: 100vh; }.header { background: #1e3a5f; color: #fff; padding: 10px 16px; display: flex; align-items: center; justify-content: center; position: sticky; top: 0; z-index: 50; gap: 10px; }
.back-btn { background: none; border: none; color: #fff; display: flex; align-items: center; justify-content: center; position: absolute; left: 6px; top: 50%; transform: translateY(-50%); padding: 6px 8px; cursor: pointer; opacity: 0.85; line-height: 1; font-size: 26px; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; } .back-btn:active { opacity: 0.5; }.header-title { font-size: 16px; font-weight: 600; }.main { flex: 1; padding: 16px 20px; overflow-y: auto; max-height: 100vh; }.root-header { margin-bottom: 20px; }.root-row { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }.root-icon { font-size: 28px; }.root-name { font-size: 30px; font-weight: 700; color: #1e3a5f; font-family: Georgia, serif; font-style: italic; line-height: 1.2; }.root-meaning-tag { font-size: 14px; color: #5a6a7a; background: #e8f0f8; padding: 3px 9px; border-radius: 6px; }.root-origin { font-size: 12px; color: #5a6a7a; margin-top: 3px; }.btn { border: none; padding: 5px 11px; border-radius: 6px; font-size: 12px; font-family: inherit; line-height: 1.4; }.btn-sm { font-size: 12px; padding: 3px 8px; }.section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: #5a6a7a; margin-bottom: 6px; font-weight: 600; }.section { margin-bottom: 18px; }.affix-list { display: flex; flex-wrap: wrap; gap: 6px; }.affix-tag {  display: inline-flex; align-items: center; gap: 4px;  padding: 3px 8px; border-radius: 20px; font-size: 12px;  border: 1px solid #dde3ea;}.affix-tag.pre { border-color: rgba(196,69,54,0.25); background: #fdf0ed; }.affix-tag.suf { border-color: rgba(45,106,79,0.25); background: #edf7f1; }.affix-morpheme { font-weight: 600; font-family: Georgia, serif; }.affix-tag.pre .affix-morpheme { color: #c44536; }.affix-tag.suf .affix-morpheme { color: #2d6a4f; }.word-list { display: flex; flex-direction: column; gap: 12px; }.word-card {  background: #fff; border: 1px solid #dde3ea; border-radius: 6px;  padding: 12px 16px;}.card-playing { border-color: #2b6f9b; box-shadow: 0 0 0 1px #2b6f9b; }.speaking-indicator { font-size: 14px; margin-left: 4px; animation: pulse 1s ease-in-out infinite; }@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }.word-top { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; margin-bottom: 5px; }.word-text { font-size: 17px; font-weight: 600; color: #1e3a5f; }.word-pos { font-size: 12px; color: #5a6a7a; font-style: italic; }.word-phonetic { font-size: 13px; color: #888; font-family: "Times New Roman", serif; letter-spacing: 0.02em; }.morph-part { font-size: 12px; color: #5a6a7a; }.morph-part.prefix { color: #c44536; }.morph-part.suffix { color: #2d6a4f; }.morph-part.root { color: #1e3a5f; font-weight: 600; } .word-morph { display: inline-flex; flex-wrap: wrap; gap: 4px; align-items: baseline; }.word-meaning-row { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; margin-bottom: 4px; }.morph-sep { color: #ccc; margin: 0 1px; }.word-meaning { font-size: 14px; }.word-example { font-size: 13px; color: #5a6a7a; border-left: 3px solid #dde3ea; padding-left: 10px; line-height: 1.5; display: flex; align-items: center; gap: 4px; }.example-cn { font-size: 13px; color: #888; border-left: 3px solid #ddd; padding-left: 10px; margin-top: 2px; line-height: 1.5; }.root-nav {  display: flex; justify-content: space-between; align-items: center;  margin: 20px 0 8px; padding-top: 14px; border-top: 1px solid #dde3ea;}.nav-btn {  background: #fff; border: 1px solid #dde3ea; border-radius: 6px;  padding: 6px 12px; font-size: 13px; font-family: inherit; color: #2b6f9b;  min-width: 90px; text-align: center;}.nav-btn.disabled { opacity: 0.35; pointer-events: none; touch-action: none; cursor: not-allowed; background: #f5f5f5; border-color: #e8e8e8; color: #aab; user-select: none; }.nav-mid { font-size: 12px; color: #5a6a7a; }.footer { text-align: center; padding: 20px 16px; font-size: 11px; color: #5a6a7a; border-top: 1px solid #dde3ea; margin-top: 20px; line-height: 1.6; }</style>







