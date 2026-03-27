import { useState } from 'react'

const ONBOARDING_KEY = 'briodo-onboarding-done'

const SCREENS = [
  {
    // Screen 0: Language selection
    render: ({ lang, setLangPref, onNext, onSkip }) => {
      const title = lang === 'ko' ? '언어를 선택해주세요' : lang === 'ja' ? '言語を選択してください' : lang === 'zh' ? '请选择语言' : 'Choose your language'
      const subtitle = lang === 'ko' ? 'BrioDo를 더 편하게 사용할 수 있어요' : lang === 'ja' ? 'BrioDoをより快適にご利用いただけます' : lang === 'zh' ? '让BrioDo更好地服务您' : 'Get a better experience with BrioDo'
      const skipLabel = lang === 'ko' ? '건너뛰기' : lang === 'ja' ? 'スキップ' : lang === 'zh' ? '跳过' : 'Skip'
      const nextLabel = lang === 'ko' ? '다음' : lang === 'ja' ? '次へ' : lang === 'zh' ? '下一步' : 'Next'
      return (
        <div className="onboarding-screen">
          <div className="onboarding-icon" style={{ fontSize: '56px' }}>🌏</div>
          <h2 className="onboarding-title">{title}</h2>
          <p className="onboarding-subtitle">{subtitle}</p>
          <div className="onboarding-lang-grid">
            {[
              { val: 'ko', label: '한국어', flag: '🇰🇷' },
              { val: 'en', label: 'English', flag: '🇺🇸' },
              { val: 'ja', label: '日本語', flag: '🇯🇵' },
              { val: 'zh', label: '中文', flag: '🇨🇳' },
            ].map(({ val, label, flag }) => (
              <button
                key={val}
                className={`onboarding-lang-btn${lang === val ? ' active' : ''}`}
                onClick={() => setLangPref(val)}
              >
                <span style={{ fontSize: '22px' }}>{flag}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
          <div className="onboarding-actions">
            <button className="onboarding-next-btn" onClick={onNext}>{nextLabel}</button>
            <button className="onboarding-skip-btn" onClick={onSkip}>{skipLabel}</button>
          </div>
        </div>
      )
    }
  },
  {
    // Screen 1: AI smart input intro
    render: ({ lang, onNext, onSkip }) => {
      const title = lang === 'ko' ? 'AI가 할 일을 똑똑하게 분석해요' : lang === 'ja' ? 'AIがタスクをスマートに分析します' : lang === 'zh' ? 'AI智能分析您的任务' : 'AI understands your tasks'
      const subtitle = lang === 'ko' ? '"내일 오후 3시에 팀 회의" 처럼 자연스럽게 입력하면\nAI가 날짜, 시간, 태그를 자동으로 추출해요.' : lang === 'ja' ? '「明日の午後3時にチームミーティング」のように自然に入力すると\nAIが日付・時間・タグを自動抽出します。' : lang === 'zh' ? '像"明天下午3点开团队会议"一样自然输入，\nAI自动提取日期、时间和标签。' : 'Type naturally like "Team meeting tomorrow at 3pm" and AI will automatically extract the date, time, and tags.'
      const demo = lang === 'ko'
        ? [
            { input: '다음 주 월요일 오전 10시 치과 예약', output: '📅 월요일 · ⏰ 10:00 · 🏷 건강' },
            { input: '오늘 저녁 7시 헬스장 가기', output: '📅 오늘 · ⏰ 19:00 · 🏷 건강' },
          ]
        : lang === 'ja'
        ? [
            { input: '来週月曜日の午前10時に歯医者の予約', output: '📅 月曜日 · ⏰ 10:00 · 🏷 健康' },
            { input: '今日の夜7時にジムへ行く', output: '📅 今日 · ⏰ 19:00 · 🏷 健康' },
          ]
        : lang === 'zh'
        ? [
            { input: '下周一上午10点牙科预约', output: '📅 周一 · ⏰ 10:00 · 🏷 健康' },
            { input: '今天晚上7点去健身房', output: '📅 今天 · ⏰ 19:00 · 🏷 健康' },
          ]
        : [
            { input: 'Dentist appointment next Monday 10am', output: '📅 Monday · ⏰ 10:00 · 🏷 health' },
            { input: 'Go to gym tonight at 7pm', output: '📅 Today · ⏰ 19:00 · 🏷 health' },
          ]
      const nextLabel = lang === 'ko' ? '다음' : lang === 'ja' ? '次へ' : lang === 'zh' ? '下一步' : 'Next'
      const skipLabel = lang === 'ko' ? '건너뛰기' : lang === 'ja' ? 'スキップ' : lang === 'zh' ? '跳过' : 'Skip'
      return (
        <div className="onboarding-screen">
          <div className="onboarding-icon" style={{ fontSize: '56px' }}>✨</div>
          <h2 className="onboarding-title">{title}</h2>
          <p className="onboarding-subtitle" style={{ whiteSpace: 'pre-line' }}>{subtitle}</p>
          <div className="onboarding-demo-list">
            {demo.map(({ input, output }, i) => (
              <div key={i} className="onboarding-demo-item">
                <div className="onboarding-demo-input">"{input}"</div>
                <div className="onboarding-demo-arrow">→</div>
                <div className="onboarding-demo-output">{output}</div>
              </div>
            ))}
          </div>
          <div className="onboarding-actions">
            <button className="onboarding-next-btn" onClick={onNext}>{nextLabel}</button>
            <button className="onboarding-skip-btn" onClick={onSkip}>{skipLabel}</button>
          </div>
        </div>
      )
    }
  },
  {
    // Screen 2: Achievements system intro
    render: ({ lang, onNext, onSkip }) => {
      const title = lang === 'ko' ? '업적을 달성하며 성장을 느껴보세요' : lang === 'ja' ? '実績を達成して成長を感じよう' : lang === 'zh' ? '达成成就，感受成长' : 'Grow by unlocking achievements'
      const subtitle = lang === 'ko' ? '할 일을 완료하고 습관을 만들어 나가면\n다양한 업적을 잠금 해제할 수 있어요!' : lang === 'ja' ? 'タスクを完了して習慣を作ると\nさまざまな実績を解除できます！' : lang === 'zh' ? '完成任务、养成习惯，\n解锁各种成就！' : 'Complete tasks and build habits\nto unlock all kinds of achievements!'
      const examples = lang === 'ko'
        ? [
            { icon: '🔥', name: '불꽃 습관', desc: '7일 연속 완료' },
            { icon: '⚡', name: '스피드 러너', desc: '하루 10개 완료' },
            { icon: '🏆', name: '마스터 플래너', desc: '총 100개 완료' },
          ]
        : lang === 'ja'
        ? [
            { icon: '🔥', name: '炎の習慣', desc: '7日連続完了' },
            { icon: '⚡', name: 'スピードランナー', desc: '1日10個完了' },
            { icon: '🏆', name: 'マスタープランナー', desc: '合計100個完了' },
          ]
        : lang === 'zh'
        ? [
            { icon: '🔥', name: '火焰习惯', desc: '连续7天完成' },
            { icon: '⚡', name: '速度跑者', desc: '一天完成10个' },
            { icon: '🏆', name: '规划大师', desc: '共完成100个' },
          ]
        : [
            { icon: '🔥', name: 'Blazing Habit', desc: '7-day streak' },
            { icon: '⚡', name: 'Speed Runner', desc: '10 tasks in a day' },
            { icon: '🏆', name: 'Master Planner', desc: '100 total completions' },
          ]
      const countLabel = lang === 'ko' ? '100개 이상의 업적이 기다리고 있어요' : lang === 'ja' ? '100以上の実績があなたを待っています' : lang === 'zh' ? '100多个成就等待你来解锁' : 'Over 100 achievements waiting to be unlocked'
      const nextLabel = lang === 'ko' ? '다음' : lang === 'ja' ? '次へ' : lang === 'zh' ? '下一步' : 'Next'
      const skipLabel = lang === 'ko' ? '건너뛰기' : lang === 'ja' ? 'スキップ' : lang === 'zh' ? '跳过' : 'Skip'
      return (
        <div className="onboarding-screen">
          <div className="onboarding-icon" style={{ fontSize: '56px' }}>🏆</div>
          <h2 className="onboarding-title">{title}</h2>
          <p className="onboarding-subtitle" style={{ whiteSpace: 'pre-line' }}>{subtitle}</p>
          <div className="onboarding-feature-list">
            {examples.map(({ icon, name, desc }, i) => (
              <div key={i} className="onboarding-feature-row">
                <span style={{ fontSize: '20px', marginRight: '8px' }}>{icon}</span>
                <span><strong>{name}</strong> — {desc}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '12px 0 0', textAlign: 'center' }}>{countLabel}</p>
          <div className="onboarding-actions">
            <button className="onboarding-next-btn" onClick={onNext}>{nextLabel}</button>
            <button className="onboarding-skip-btn" onClick={onSkip}>{skipLabel}</button>
          </div>
        </div>
      )
    }
  },
  {
    // Screen 3: Account / cloud sync
    render: ({ lang, onLogin, onSkip }) => {
      const title = lang === 'ko' ? '어디서든 내 할 일을' : lang === 'ja' ? 'どこでも自分のタスクを' : lang === 'zh' ? '随时随地访问您的任务' : 'Your tasks, everywhere'
      const subtitle = lang === 'ko' ? 'Google 로그인으로 클라우드 백업과\nGoogle 캘린더 연동을 즉시 사용해보세요.' : lang === 'ja' ? 'Googleログインでクラウドバックアップと\nGoogleカレンダー連携をすぐにお使いいただけます。' : lang === 'zh' ? '使用Google登录，立即体验\n云端备份和Google日历同步。' : 'Sign in with Google to enable cloud backup and Google Calendar sync.'
      const loginLabel = lang === 'ko' ? 'Google 계정으로 로그인' : lang === 'ja' ? 'Googleアカウントでサインイン' : lang === 'zh' ? '使用Google账号登录' : 'Sign in with Google'
      const laterLabel = lang === 'ko' ? '나중에 연결할게요' : lang === 'ja' ? '後で設定する' : lang === 'zh' ? '稍后再说' : 'Maybe later'
      return (
        <div className="onboarding-screen">
          <div className="onboarding-icon" style={{ fontSize: '56px' }}>☁️</div>
          <h2 className="onboarding-title">{title}</h2>
          <p className="onboarding-subtitle" style={{ whiteSpace: 'pre-line' }}>{subtitle}</p>
          <div className="onboarding-feature-list">
            {(lang === 'ko'
              ? ['☁️ 클라우드 자동 백업', '📅 Google 캘린더 연동', '🔄 기기간 동기화']
              : lang === 'ja'
              ? ['☁️ クラウド自動バックアップ', '📅 Googleカレンダー連携', '🔄 デバイス間同期']
              : lang === 'zh'
              ? ['☁️ 云端自动备份', '📅 Google日历同步', '🔄 跨设备同步']
              : ['☁️ Automatic cloud backup', '📅 Google Calendar sync', '🔄 Sync across devices']
            ).map((f, i) => (
              <div key={i} className="onboarding-feature-row">{f}</div>
            ))}
          </div>
          <div className="onboarding-actions">
            <button className="onboarding-login-btn" onClick={onLogin}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="currentColor"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="currentColor"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="currentColor"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="currentColor"/>
              </svg>
              {loginLabel}
            </button>
            <button className="onboarding-skip-btn" onClick={onSkip}>{laterLabel}</button>
          </div>
        </div>
      )
    }
  },
]

export function OnboardingModal({ lang, setLangPref, handleLogin, onDone }) {
  const [step, setStep] = useState(0)
  const total = SCREENS.length

  const complete = () => {
    localStorage.setItem(ONBOARDING_KEY, '1')
    onDone()
  }

  const handleLogin_ = () => {
    complete()
    handleLogin()
  }

  const Screen = SCREENS[step]

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        {/* 진행 표시 */}
        <div className="onboarding-progress">
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className={`onboarding-dot${i === step ? ' active' : i < step ? ' done' : ''}`} />
          ))}
        </div>

        <Screen.render
          lang={lang}
          setLangPref={setLangPref}
          onNext={() => step < total - 1 ? setStep(step + 1) : complete()}
          onSkip={complete}
          onLogin={handleLogin_}
        />
      </div>
    </div>
  )
}

export function shouldShowOnboarding() {
  return !localStorage.getItem(ONBOARDING_KEY)
}
