<template>
  <view class="page">
    <!-- Header -->
    <view class="header">
      <text class="header-title">RootWords - 词根记单词</text>
    </view>

    <!-- Main Content -->
    <scroll-view class="main" scroll-y scroll-with-animation enable-back-to-top :style="'height:' + mainHeight">
      <view class="main-inner">
      
      <!-- Stats bar -->
      <view v-if="sections.length" class="stats-bar">
        <text>{{ sections.length }} 类 · {{ filteredCount }} 个词根 · {{ buildVersion }}</text>
      </view>

      

      <!-- Sectioned List -->
      <view v-for="section in sections" :key="section.letter" :id="'section-' + section.letter" class="section-group">
        <view class="section-header">{{ section.letter }}</view>
        <view
          v-for="item in section.items"
          :key="item.root"
          class="root-item"
          @tap="goDetail(item.originalIndex)"
        >
          <view class="card-row">
            <view class="card-left">
              <text class="card-root">-{{ item.root }}-</text>
              <text class="card-meaning">{{ item.meaning }}</text>
            </view>
            <text class="card-icon">{{ item.icon }}</text>
          </view>
          <view class="card-meta">
            {{ item.words.length }}词 · {{ item.origin }}
          </view>
          <view class="card-progress">
            <view class="progress-segs">
              <view v-for="(_, si) in item.words" :key="'prog-' + item.root + '-' + si + '-' + progressVersion" class="seg" :class="getSegClass(item.root, si, item.words.length)"></view>
            </view>
          </view>
        </view>
      </view>

      <!-- Footer -->
      <view class="footer">
        <text>&copy;merfy</text>
      </view>
      </view>
    </scroll-view>

    <!-- A-Z Letter Sidebar -->
    <view v-if="availableLetters.length > 1" class="letter-sidebar">
      <view
        v-for="l in availableLetters"
        :key="l"
       class="letter-item"

        @tap="scrollToLetter(l)"
     >
        <text>{{ l }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getSegClass } from '@/utils/progress'
import DATA from '@/utils/data'

const DATA_VERSION = '2'  // v2 = sorted alphabetically; clears stale lastRootIndex from v1

const mainHeight = ref('100vh')

// Force progress bar re-render when page becomes visible
const progressVersion = ref(0)

// Use browser-native events instead of uni-app onShow to avoid module issues
onMounted(() => {
  const refresh = () => { progressVersion.value++ }
  window.addEventListener('popstate', refresh)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refresh()
  })
  window.addEventListener('pageshow', refresh)
})

onMounted(() => {
  try {
    const hd = document.querySelector('.header')
    if (hd) {
      mainHeight.value = 'calc(100vh - ' + hd.offsetHeight + 'px)'
    }
  } catch(e) {}
})

onMounted(() => {
  try {
    if (!sessionStorage.getItem('_rootAutoNav')) {
      sessionStorage.setItem('_rootAutoNav', '1')
      // Migration: if data was re-sorted, clear stale saved index
      try {
        if (localStorage.getItem('dataVersion') !== DATA_VERSION) {
          localStorage.removeItem('lastRootIndex')
          localStorage.setItem('dataVersion', DATA_VERSION)
        }
      } catch(e) {}
      const lastIdx = localStorage.getItem('lastRootIndex')
      if (lastIdx !== null) {
        const idx = parseInt(lastIdx)
        if (!isNaN(idx) && idx >= 0 && idx < DATA.length) {
          setTimeout(() => {
            uni.navigateTo({ url: '/pages/detail/detail?index=' + idx })
          }, 300)
        }
      }
    }
  } catch(e) {
    // storage access may fail in some contexts
  }
})

// --- Sort and group alphabetically ---
const sortedData = computed(() => {
  return DATA
    .map((item, idx) => ({ ...item, originalIndex: idx }))
    .sort((a, b) => a.root.localeCompare(b.root))
})

function groupByLetter(data) {
  const map = {}
  data.forEach(item => {
    const letter = (item.root[0] || '').toUpperCase()
    if (!map[letter]) map[letter] = []
    map[letter].push(item)
  })
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letter, items]) => ({ letter, items }))
}

const sections = computed(() => groupByLetter(sortedData.value))

const filteredCount = computed(() => {
  return sections.value.reduce((sum, s) => sum + s.items.length, 0)
})

const availableLetters = computed(() => [...new Set(sections.value.map(s => s.letter))])

// --- A-Z sidebar scroll ---
function scrollToLetter(letter) {
  try {
    const el = document.getElementById('section-' + letter)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  } catch(e) {}
}

const buildVersion = ref('v1')
try {
  if (typeof __APP_VERSION__ !== 'undefined') {
    buildVersion.value = __APP_VERSION__
  }
} catch(e) {}

function goDetail(index) {
  uni.navigateTo({ url: '/pages/detail/detail?index=' + index })
}
</script>

<style scoped>
.page { display: flex; flex-direction: column; min-height: 100vh; position: relative; }
.header { background: #1e3a5f; color: #fff; padding: 10px 20px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 50; gap: 10px; }
.header-title { font-size: 15px; font-weight: 600; flex-shrink: 0; }

.main { flex: 1; }
.main-inner { padding: 10px 20px 24px; }
.stats-bar { font-size: 11px; color: #5a6a7a; margin-bottom: 10px; letter-spacing: 0.03em; }

.section-group { margin-bottom: 2px; }
.section-header { font-size: 11px; font-weight: 700; color: #1e3a5f; letter-spacing: 0.06em; padding: 10px 0 6px; text-transform: uppercase; }

.root-item { background: #fff; border: 1px solid #dde3ea; border-radius: 6px; padding: 12px 16px; transition: all 0.15s; margin-bottom: 6px; }
.root-item:active { border-color: #2b6f9b; box-shadow: 0 2px 12px rgba(0,0,0,0.07); transform: translateY(-1px); }
.card-row { display: flex; align-items: center; gap: 14px; margin-bottom: 6px; }
.card-left { flex: 1; }
.card-root { font-size: 18px; font-weight: 700; color: #1e3a5f; font-family: Georgia, serif; font-style: italic; line-height: 1.2; }
.card-meaning { font-size: 14px; color: #5a6a7a; margin-top: 4px; }
.card-icon { font-size: 28px; line-height: 1; flex-shrink: 0; }
.card-meta { font-size: 12px; color: #5a6a7a; margin-top: 2px; }
.card-progress { padding: 0; margin: 6px 0 0; }
.progress-segs { display: flex; gap: 2px; height: 3px; }
.progress-segs .seg { flex: 1; border-radius: 1px; background: #e4e7eb; }
.progress-segs .seg.seg-filled-partial { background: rgba(196, 69, 54, 0.35); }
.progress-segs .seg.seg-filled-all { background: rgba(45, 106, 79, 0.35); }

.letter-sidebar { position: fixed; right: 0; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4px 2px; z-index: 60; background: rgba(255,255,255,0.6); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); border-radius: 10px 0 0 10px; box-shadow: -1px 0 6px rgba(0,0,0,0.04); }
.letter-item { display: flex; align-items: center; justify-content: center; width: 22px; height: 18px; font-size: 10px; font-weight: 600; color: #2b6f9b; border-radius: 3px; user-select: none; -webkit-user-select: none; }
.letter-item:active { background: #2b6f9b; color: #fff; }

.footer { text-align: center; padding: 20px 16px; font-size: 11px; color: #5a6a7a; border-top: 1px solid #dde3ea; margin-top: 20px; line-height: 1.6; }
</style>


