import { useState, useRef, useEffect } from 'react'
import { Amplify } from 'aws-amplify'
import outputs from '../amplify_outputs.json'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../amplify/data/resource'
import {
  Shield,
  Settings,
  Video,
  AlertTriangle,
  PhoneCall,
  XCircle,
  Radio,
  Clock,
  CheckCircle2,
  ChevronDown
} from 'lucide-react'

// Configure Amplify with generated outputs
try {
  Amplify.configure(outputs)
} catch (e) {
  console.warn('Amplify configure notice:', e)
}

// Generate data client
const client = generateClient<Schema>()

type CountryCode = 'UK' | 'US' | 'EU' | 'AUS'

interface MockEvent {
  id: string
  time: string
  label: string
  detail: string
  type: 'info' | 'warn' | 'success'
}

const EMERGENCY_NUMBERS: Record<CountryCode, string> = {
  UK: '999',
  US: '911',
  EU: '112',
  AUS: '000',
}

const MOCK_EVENTS: MockEvent[] = [
  {
    id: '1',
    time: '14:24:12',
    label: 'Motion detected at North Perimeter',
    detail: 'Optical Sensor #04 - Confidence 92%',
    type: 'warn',
  },
  {
    id: '2',
    time: '13:58:05',
    label: 'Automated diagnostic passed',
    detail: 'All 8 cameras & radar nodes nominal',
    type: 'success',
  },
  {
    id: '3',
    time: '12:15:30',
    label: 'Driveway infrared boundary tripped',
    detail: 'Scheduled delivery vehicle departed',
    type: 'info',
  },
]

const MOCK_THREAT_IMAGE =
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80'

export default function App() {
  const [isAlertActive, setIsAlertActive] = useState<boolean>(false)
  const [threatType, setThreatType] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [country, setCountry] = useState<CountryCode>('UK')
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false)

  const emergencyNumber = EMERGENCY_NUMBERS[country]
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  // Secret keyboard listener: Press 'x' to trigger the alert UI
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Pressing 'x' secretly triggers the UI state
      if (e.key === 'x' || e.key === 'X') {
        setThreatType('BALACLAVA / FACE COVERING DETECTED')
        setImageUrl(MOCK_THREAT_IMAGE)
        setIsAlertActive(true)
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  // Real-time subscription to RingAlert.onCreate()
  useEffect(() => {
    try {
      if (!client?.models?.RingAlert) {
        console.warn('RingAlert model is not available yet. Ensure Amplify sandbox is deployed.')
        return
      }

      const subscription = client.models.RingAlert.onCreate().subscribe({
        next: (data) => {
          if (data && data.status === 'ACTIVE') {
            setThreatType(data.threatType || 'ACTIVE THREAT DETECTED')
            setImageUrl(data.imageUrl || null)
            setIsAlertActive(true)
          }
        },
        error: (err) => {
          console.error('Subscription error on RingAlert:', err)
        },
      })

      return () => {
        subscription.unsubscribe()
      }
    } catch (err) {
      console.warn('Failed to subscribe to RingAlert onCreate:', err)
    }
  }, [])

  // Audio trigger handling
  useEffect(() => {
    if (isAlertActive) {
      if (audioRef.current) {
        audioRef.current.play().catch((error) => {
          console.warn('Audio play was interrupted or prevented by browser:', error)
        })
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    }
  }, [isAlertActive])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const triggerSimulation = () => {
    setThreatType('BALACLAVA / FACE COVERING DETECTED')
    setImageUrl(MOCK_THREAT_IMAGE)
    setIsAlertActive(true)
  }

  const dismissAlert = () => {
    setIsAlertActive(false)
    setThreatType(null)
    setImageUrl(null)
  }

  return (
    <div
      className={`min-h-screen text-slate-100 transition-colors duration-200 ${
        isAlertActive
          ? 'bg-red-600 animate-[pulse_0.5s_ease-in-out_infinite]'
          : 'bg-slate-900'
      }`}
    >
      {/* Siren audio element */}
      <audio
        ref={audioRef}
        src="https://actions.google.com/sounds/v1/alarms/spaceship_alarm.ogg"
        loop
        preload="auto"
        className="hidden"
      />

      {/* Global Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-slate-800 border-b border-slate-700 px-4 sm:px-8 flex items-center justify-between shadow-lg">
        {/* Left: Shield & Title */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
            <Shield className="w-6 h-6 text-indigo-400" />
          </div>
          <span className="font-bold text-lg tracking-wide text-white">
            Perimeter Defense
          </span>
        </div>

        {/* Right: Country Settings Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsSettingsOpen((prev) => !prev)}
            aria-label="Emergency Region Settings"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 border border-slate-600 text-slate-200 text-sm font-medium transition cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Region:</span>
            <span className="font-semibold text-white">{country}</span>
            <span className="text-xs text-slate-400 font-mono">({emergencyNumber})</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isSettingsOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl py-2 z-50 text-sm">
              <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Emergency Dispatch
              </div>
              {(Object.keys(EMERGENCY_NUMBERS) as CountryCode[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCountry(c)
                    setIsSettingsOpen(false)
                  }}
                  className={`w-full px-4 py-2 text-left flex items-center justify-between hover:bg-slate-700/70 transition cursor-pointer ${
                    country === c ? 'text-indigo-400 font-bold bg-slate-700/40' : 'text-slate-300'
                  }`}
                >
                  <span>{c}</span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-900/60 text-slate-300 border border-slate-700">
                    {EMERGENCY_NUMBERS[c]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-24 pb-12 px-4 max-w-4xl mx-auto flex flex-col items-center">
        {!isAlertActive ? (
          /* ======================================================== */
          /* STATE 1: MONITORING (DEFAULT)                           */
          /* ======================================================== */
          <div className="w-full flex flex-col items-center space-y-6">
            {/* Status Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-800/90 border border-slate-700 shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-xs font-semibold tracking-wide text-slate-200 uppercase">
                System Online
              </span>
            </div>

            {/* Central 16:9 Camera Feed */}
            <div className="w-full aspect-video bg-slate-800 rounded-xl border border-slate-700 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center p-6 group">
              {/* Overlay Badges */}
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-slate-900/80 backdrop-blur px-3 py-1 rounded-md border border-slate-700/80 text-xs text-slate-300">
                <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                <span className="font-mono font-medium">CAM-01 • FRONT YARD</span>
              </div>
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded-md border border-slate-700/80 text-xs font-mono text-slate-400">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>1080P • 30FPS</span>
              </div>

              {/* Feed Placeholder Graphic */}
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700/60">
                  <Video className="w-12 h-12 text-slate-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-300">Live Camera Feed</p>
                  <p className="text-xs text-slate-500">Continuous optical surveillance active</p>
                </div>
              </div>

              {/* Subtle grid lines background overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:40px_40px]"></div>
            </div>

            {/* Event Log Section */}
            <div className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-3">
                <h2 className="text-sm font-semibold text-slate-200 tracking-wide uppercase flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  Recent Events
                </h2>
                <span className="text-xs text-slate-500">Last updated just now</span>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1">
                {MOCK_EVENTS.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-start justify-between gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition"
                  >
                    <div className="flex items-start gap-3">
                      {evt.type === 'warn' && (
                        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      )}
                      {evt.type === 'success' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      )}
                      {evt.type === 'info' && (
                        <Radio className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <p className="text-xs font-medium text-slate-300">{evt.label}</p>
                        <p className="text-xs text-slate-400">{evt.detail}</p>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400 shrink-0">
                      {evt.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulation Button */}
            <div className="pt-4 w-full flex justify-center">
              <button
                type="button"
                onClick={triggerSimulation}
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-500/40 text-amber-400 hover:text-amber-300 text-sm font-semibold tracking-wide flex items-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" />
                Simulate Threat
              </button>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* STATE 2: ACTIVE THREAT                                   */
          /* ======================================================== */
          <div className="w-full flex flex-col items-center space-y-8 animate-fadeIn">
            {/* Camera Feed Replacement with Threat Image */}
            <div className="w-full aspect-video rounded-xl overflow-hidden border-4 border-white shadow-2xl relative bg-black">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={threatType || 'Threat Detected'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-950 text-white">
                  <AlertTriangle className="w-16 h-16 text-yellow-400 animate-bounce" />
                </div>
              )}

              {/* Threat HUD watermark */}
              <div className="absolute top-4 left-4 bg-red-700/90 text-white font-mono text-xs px-3 py-1.5 rounded uppercase font-bold tracking-wider flex items-center gap-2 border border-white/40">
                <span className="h-2.5 w-2.5 rounded-full bg-white animate-ping"></span>
                ACTIVE INTRUSION EVENT
              </div>
            </div>

            {/* Threat Text */}
            <div className="space-y-1 text-center">
              <h2 className="text-4xl sm:text-5xl font-black text-white text-center tracking-tight uppercase drop-shadow-md">
                {threatType || 'SECURITY ALERT'}
              </h2>
              <p className="text-white/90 text-sm font-medium tracking-wide">
                Immediate response recommended. Region: {country} ({emergencyNumber})
              </p>
            </div>

            {/* Action Buttons */}
            <div className="w-full max-w-xl space-y-4 pt-2">
              {/* Primary Action: Emergency Call */}
              <a
                href={`tel:${emergencyNumber}`}
                className="h-24 bg-white text-red-600 rounded-2xl text-2xl font-bold shadow-2xl hover:scale-105 active:scale-95 transition-transform flex items-center justify-center gap-4 w-full uppercase tracking-wider text-center"
              >
                <PhoneCall className="w-8 h-8 text-red-600 animate-pulse shrink-0" />
                <span>CALL EMERGENCY SERVICES</span>
              </a>

              {/* Secondary Action: Dismiss */}
              <button
                type="button"
                onClick={dismissAlert}
                className="h-12 bg-transparent border-2 border-white text-white rounded-xl w-full hover:bg-white/10 active:scale-95 transition font-semibold text-sm tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
                <span>DISMISS / FALSE ALARM</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
