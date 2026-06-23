<template>
  <view class="page">
    <view class="header">
      <span class="back-btn" @tap="goBack"><span class="back-arrow">‹</span></span><text class="header-title">记忆测试</text>
    </view>

    <view class="main">
      <!-- Loading -->
      <view v-if="state === 'loading'" class="loading-state">
        <text class="loading-text">加载中...</text>
      </view>

      <!-- Playing -->
      <view v-else-if="state === 'playing'">
        <view class="quiz-status">
          <view class="quiz-meta">
            <text>词根: {{ scope === 'all' ? '全部' : scope }}</text>
            <text>进度: {{ currentIndex + 1 }} / {{ words.length }}</text>
            <text>正确: {{ correctCount }}</text>
          </view>
        </view>
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progressPct + '%' }"></view>
        </view>

        <view class="question-area">
          <text class="question-label">请选择 "{{ currentWord.word }}" 的中文含义：</text>
        </view>

        <view class="options" :key="'opts-' + quizRenderKey">
          <view
            v-for="(opt, oi) in options"
            :key="'opt-' + quizRenderKey + '-' + oi"
            class="option-view"
            @tap="handleOptionClick(oi)"
          >
            <text class="option-text">{{ opt }}</text>
          </view>
        </view>
      </view>

      <!-- Answered -->
      <view v-else-if="state === 'answered'">
        <view class="quiz-status">
          <view class="quiz-meta">
            <text>词根: {{ scope === 'all' ? '全部' : scope }}</text>
            <text>进度: {{ currentIndex + 1 }} / {{ words.length }}</text>
            <text>正确: {{ correctCount }}</text>
          </view>
        </view>
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progressPct + '%' }"></view>
        </view>

        <view class="question-area">
          <text class="question-label">请选择 "{{ currentWord.word }}" 的中文含义：</text>
        </view>

        <view class="options" :key="'opts-ans-' + quizRenderKey">
          <view
            v-for="(opt, oi) in options"
            :key="'opt-' + quizRenderKey + '-' + oi"
            class="option-view"
            :class="{
              'option-correct': opt === currentWord.meaning,
              'option-wrong': selectedIndex === oi && opt !== currentWord.meaning,
              'option-dimmed': selectedIndex !== oi && opt !== currentWord.meaning
            }"
          >
            <text class="option-text">{{ opt }}</text>
          </view>
        </view>

        <view class="feedback" :class="lastCorrect ? 'fb-ok' : 'fb-no'">
          <text>{{ lastCorrect ? '✓  回答正确！' : '✗  错误！正确答案：「' + currentWord.meaning + '」' }}</text>
        </view>

        <view class="next-btn" @tap="handleNext">
          <text>{{ isLastQuestion ? '查看结果' : '下一题' }}</text>
        </view>
      </view>

      <!-- Results -->
      <view v-else-if="state === 'results'">
        <view class="results">
          <text class="result-icon">{{ resultIcon }}</text>
          <text class="score">{{ correctCount }}/{{ words.length }}</text>
          <text class="score-detail">正确: {{ correctCount }}  ·  错误: {{ words.length - correctCount }}</text>
          <text class="score-label">正确率 {{ scorePct }}% · {{ scoreGrade }}</text>
          <text class="encourage-text">{{ encourageText }}</text>
          <view class="result-btns">
            <view class="action-view" @tap="restartQuiz">↻ 再试一次</view>
            <view class="action-view result-back" @tap="goBack">← 返回</view>
          </view>
        </view>
      </view>
    </view>
  
      <view class="footer">
        <text>&copy;merfy</text>
      </view>
    </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import DATA from '@/utils/data'
import { speakText, cancelSpeech } from '@/utils/speech'
import { saveProgress } from '@/utils/progress'

const state = ref('loading')
const words = ref([])
const currentIndex = ref(0)
const correctCount = ref(0)
const scope = ref('all')
const fromIndex = ref(-1)
const options = ref([])
const selectedIndex = ref(-1)
const scopeMeanings = ref([])
const quizRenderKey = ref(0)
const lastCorrect = ref(false)

const currentWord = computed(() => {
  const w = words.value[currentIndex.value]
  return w || { word: '', phonetic: '', meaning: '' }
})

const progressPct = computed(() => {
  return words.value.length > 0 ? (currentIndex.value / words.value.length * 100) : 0
})

const scorePct = computed(() => {
  return words.value.length > 0 ? Math.round(correctCount.value / words.value.length * 100) : 0
})

const scoreGrade = computed(() => {
  const p = scorePct.value
  return p >= 90 ? '优秀' : p >= 70 ? '良好' : p >= 50 ? '一般' : '继续加油'
})

const wrongCount = computed(() => {
  return words.value.length - correctCount.value
})

const resultIcon = computed(() => {
  const p = scorePct.value
  return p >= 90 ? '🎉' : p >= 70 ? '👍' : p >= 50 ? '💪' : '📚'
})

const encourageText = computed(() => {
  const p = scorePct.value
  const correct = correctCount.value
  const total = words.value.length
  const wrong = total - correct
  if (p >= 90) return '太棒了！你对这些词根的掌握非常扎实！'
  if (p >= 70) return '不错哦！再巩固一下就能更好了！'
  if (p >= 50) return '继续加油！多复习几遍就能记住！'
  return '别灰心！词根记忆需要反复练习，再来一次吧！'
})

const isLastQuestion = computed(() => {
  return currentIndex.value >= words.value.length - 1
})

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function initQuiz(sc) {
  scope.value = sc || 'all'
  let pool = []
  if (scope.value && scope.value !== 'all') {
    const r = DATA.find(item => item.root === scope.value)
    if (r) pool = r.words
  } else {
    DATA.forEach(r => { r.words.forEach(w => pool.push(w)) })
  }
  if (pool.length < 2) {
    uni.showToast({ title: '单词太少，无法测试', icon: 'none' })
    uni.navigateBack()
    return
  }
  const wordList = pool.map(w => ({ word: w[0], phonetic: w[5] || '', meaning: w[3] }))
  words.value = shuffle(wordList)
  const meaningSet = new Set()
  pool.forEach(w => meaningSet.add(w[3]))
  scopeMeanings.value = [...meaningSet]
  if (scopeMeanings.value.length < 2) {
    uni.showToast({ title: '词根词汇太少，无法测试', icon: 'none' })
    uni.navigateBack()
    return
  }
  currentIndex.value = 0
  correctCount.value = 0
  selectedIndex.value = -1
  state.value = 'playing'
  refreshOptions()
}

function refreshOptions() {
  const w = currentWord.value
  if (!w || !w.meaning) return

  const correct = w.meaning
  let distractors = scopeMeanings.value.filter(m => m !== correct)
  distractors = shuffle(distractors).slice(0, 3)
  while (distractors.length < 3) {
    distractors.push(correct + '...')
  }
  const opts = shuffle([correct, ...distractors])
  options.value = opts
  quizRenderKey.value++
}

function handleOptionClick(oi) {
  if (state.value !== 'playing') return
  const correctMeaning = currentWord.value.meaning
  const selectedOption = options.value[oi]
  const correct = selectedOption === correctMeaning
  lastCorrect.value = correct
  selectedIndex.value = oi
  if (correct) correctCount.value++
  state.value = 'answered'
  if (correct) {
    speakText(currentWord.value.word)
  }
}

function handleNext() {
  nextQuestion()
}

function nextQuestion() {
  if (currentIndex.value >= words.value.length - 1) {
    if (scope.value && scope.value != 'all') {
      saveProgress(scope.value, correctCount.value)
    }
    state.value = 'results'
    cancelSpeech()
    return
  }
  currentIndex.value++
  selectedIndex.value = -1
  state.value = 'playing'
  refreshOptions()
}

function restartQuiz() {
  initQuiz(scope.value)
}

function goBack() {
  cancelSpeech()
  uni.navigateBack()
}

onLoad((query) => {
  const sc = query.scope || 'all'
  if (query.fromIndex !== undefined) {
    fromIndex.value = parseInt(query.fromIndex) || 0
  }
  initQuiz(sc)
})
</script>

<style scoped>
.page { display: flex; flex-direction: column; min-height: 100vh; background: #f8f9fb; }
.header { background: #1e3a5f; color: #fff; padding: 10px 16px; display: flex; align-items: center; justify-content: center; position: sticky; top: 0; z-index: 50; }
.header-title { font-size: 16px; font-weight: 600; }
.main { flex: 1; padding: 16px 20px; overflow-y: auto; }
.loading-state { text-align: center; padding: 60px 20px; }
.loading-text { font-size: 14px; color: #5a6a7a; }
.quiz-status { margin-bottom: 2px; }
.quiz-meta { font-size: 13px; color: #5a6a7a; display: flex; gap: 14px; margin-bottom: 10px; }
.progress-bar { height: 4px; background: #dde3ea; border-radius: 2px; margin-bottom: 18px; overflow: hidden; }
.progress-fill { height: 100%; background: #2b6f9b; border-radius: 2px; transition: width 0.3s; }
.question-area { margin-bottom: 14px; }
.question-label { font-size: 16px; }
.options { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-bottom: 14px; }
.option-view {
  padding: 10px 24px;
  border: 1.5px solid #dde3ea; border-radius: 6px;
  background: #fff; font-size: 14px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; max-width: 280px; box-sizing: border-box;
  transition: all 0.15s;
}
.option-correct {
  border-color: #2d6a4f !important; background: #edf7f1 !important; color: #2d6a4f !important;
}
.option-wrong {
  border-color: #c44536 !important; background: #fdf0ed !important; color: #c44536 !important;
}
.option-dimmed { opacity: 0.45; }
.feedback {
  padding: 8px 24px; border-radius: 6px; font-size: 13px;
  display: flex; align-items: center; gap: 8px; justify-content: center;
  width: 100%; max-width: 280px; box-sizing: border-box; margin: 0 auto 10px;
}
.fb-ok { background: #edf7f1; color: #2d6a4f; border: 1px solid rgba(45,106,79,0.25); }
.fb-no { background: #fdf0ed; color: #c44536; border: 1px solid rgba(196,69,54,0.25); }
.next-btn {
  background: #2b6f9b; color: #fff;
  padding: 10px 24px; border-radius: 6px; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
  max-width: 280px; margin: 0 auto 12px;
}
.results { text-align: center; padding: 80px 20px 50px; }
.score { font-size: 52px; font-weight: 700; color: #1e3a5f; margin-bottom: 20px; display: block; }
.score-label { font-size: 15px; color: #5a6a7a; margin-bottom: 32px; line-height: 1.8; display: block; }
.score-detail { font-size: 16px; color: #5a6a7a; margin-bottom: 14px; display: block; }
.result-icon { font-size: 64px; margin-bottom: 24px; display: block; }
.encourage-text { font-size: 16px; color: #2b6f9b; margin: 36px 0 48px; font-weight: 500; line-height: 1.8; display: block; }
.result-btns { display: flex; justify-content: center; gap: 16px; }
.action-view {
  background: #2b6f9b; color: #fff;
  padding: 10px 28px; border-radius: 8px; font-size: 15px;
}
.action-view.result-back { background: #5a6a7a; }
.footer { text-align: center; padding: 20px 16px; font-size: 11px; color: #5a6a7a; border-top: 1px solid #dde3ea; margin-top: 20px; line-height: 1.6; }</style>




 .back-btn { background: none; border: none; color: #fff; display: flex; align-items: center; justify-content: center; position: absolute; left: 6px; top: 50%; transform: translateY(-50%); padding: 6px 8px; cursor: pointer; opacity: 0.85; line-height: 1; font-size: 26px; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; } .back-btn:active { opacity: 0.5; }
