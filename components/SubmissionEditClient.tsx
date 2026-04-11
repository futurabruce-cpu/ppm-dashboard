'use client'

import { useState } from 'react'

const QUESTION_LABELS: Record<string, string> = {
  '1': 'Manufacturer',
  '2': 'Model',
  '3': 'Type of System',
  '4': 'Location',
  '5': 'Battery Load Test',
  '6': 'Charging Voltage',
  '7': 'MCP Manual Call Point',
  '8': 'Panel Controls',
  '9': 'Heat Detector',
  '10': 'Circuit Monitoring',
  '11': 'Multi Sensor',
  '12': 'Relays & Shutdowns',
  '13': 'Optical Detector',
  '14': 'Audibility Test / Visual',
  '15': 'Indicator Lights & Fault',
  '16': 'Linked to Other Premises',
  '17': 'Batteries',
  '18': 'Battery Calculation',
  '19': 'ARC Monitoring',
  '20': 'Central Station Number',
  '21': 'ARC Contacted',
  '22': 'Testing Explained',
  '23': 'Photo – Fire Panel',
  '24': 'Additional Notes',
  '27': 'Comments / Recommendations',
  '28': 'Extent of System',
  '29': 'Variations',
  '30': 'Logbook Updated',
  '31': 'False Alarms (last 12 months)',
  '32': 'Automatic Detectors',
  '175': 'Battery Calculation',
  'c1': 'Work Carried Out',
  'c2': 'Picture',
  'c3': 'Equipment Used',
  'c4': 'Number of Engineers',
  'c6': 'System Current Status',
  'c7': 'Return Visit Required',
  'c8': 'Engineer Sign Off',
  'c8t': 'Time on Site',
  'c9': 'Customer Sign Off',
  'customer_name': 'Customer Name',
}

const PHOTO_KEYS = new Set(['c2', '23', '36', '37'])
const TEXTAREA_KEYS = new Set(['c1', '24', '27', '29', 'c3'])
const YES_NO_VALUES = new Set(['Yes', 'No', 'N/A'])

interface Submission {
  id: string
  site_name: string | null
  site_address: string | null
  service_date: string | null
  engineer_name: string | null
  company_name: string | null
  job_type: string | null
  follow_up_required: boolean | null
  answers: Record<string, unknown>
  sheet_type: string | null
  pdf_url: string | null
}

export default function SubmissionEditClient({ submission }: { submission: Submission }) {
  const [siteName, setSiteName] = useState(submission.site_name ?? '')
  const [siteAddress, setSiteAddress] = useState(submission.site_address ?? '')
  const [serviceDate, setServiceDate] = useState(
    submission.service_date ? submission.service_date.slice(0, 10) : ''
  )
  const [engineerName, setEngineerName] = useState(submission.engineer_name ?? '')
  const [companyName, setCompanyName] = useState(submission.company_name ?? '')
  const [jobType, setJobType] = useState(submission.job_type ?? '')
  const [followUpRequired, setFollowUpRequired] = useState(submission.follow_up_required ?? false)
  const [answers, setAnswers] = useState<Record<string, unknown>>({ ...submission.answers })

  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  function setAnswer(key: string, value: unknown) {
    setAnswers(prev => ({ ...prev, [key]: value }))
  }

  function isPhotoKey(key: string) {
    return PHOTO_KEYS.has(key)
  }

  function isSigKey(key: string) {
    return key.startsWith('sig_')
  }

  function renderAnswerField(key: string, value: unknown) {
    const label = QUESTION_LABELS[key] ?? key

    if (isSigKey(key)) {
      return (
        <div key={key} className="px-6 py-3 flex gap-4 items-center">
          <span className="text-sm text-gray-500 w-1/3 shrink-0">{label}</span>
          <span className="text-sm text-gray-400 italic">[Signature — cannot edit]</span>
        </div>
      )
    }

    if (isPhotoKey(key) || Array.isArray(value)) {
      return (
        <div key={key} className="px-6 py-3 flex gap-4 items-center">
          <span className="text-sm text-gray-500 w-1/3 shrink-0">{label}</span>
          <span className="text-sm text-gray-400 italic">[Photo — cannot edit]</span>
        </div>
      )
    }

    const strVal = value !== null && value !== undefined ? String(value) : ''

    if (YES_NO_VALUES.has(strVal)) {
      return (
        <div key={key} className="px-6 py-3 flex gap-4 items-center">
          <span className="text-sm text-gray-500 w-1/3 shrink-0">{label}</span>
          <select
            value={strVal}
            onChange={e => setAnswer(key, e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A800] bg-white"
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
            <option value="N/A">N/A</option>
          </select>
        </div>
      )
    }

    if (TEXTAREA_KEYS.has(key) || strVal.length > 50) {
      return (
        <div key={key} className="px-6 py-3 flex gap-4">
          <span className="text-sm text-gray-500 w-1/3 shrink-0 pt-1">{label}</span>
          <textarea
            value={strVal}
            onChange={e => setAnswer(key, e.target.value)}
            rows={3}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A800] resize-y"
          />
        </div>
      )
    }

    if (!isNaN(Number(strVal)) && strVal.trim() !== '') {
      return (
        <div key={key} className="px-6 py-3 flex gap-4 items-center">
          <span className="text-sm text-gray-500 w-1/3 shrink-0">{label}</span>
          <input
            type="number"
            value={strVal}
            onChange={e => setAnswer(key, e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A800]"
          />
        </div>
      )
    }

    return (
      <div key={key} className="px-6 py-3 flex gap-4 items-center">
        <span className="text-sm text-gray-500 w-1/3 shrink-0">{label}</span>
        <input
          type="text"
          value={strVal}
          onChange={e => setAnswer(key, e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A800]"
        />
      </div>
    )
  }

  async function handleSave() {
    setSaving(true)
    setToast(null)
    try {
      const res = await fetch(`/api/submissions/${submission.id}/edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_name: siteName,
          site_address: siteAddress,
          service_date: serviceDate,
          engineer_name: engineerName,
          company_name: companyName,
          job_type: jobType,
          follow_up_required: followUpRequired,
          answers,
          sheet_type: submission.sheet_type ?? 'voca',
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Save failed')
      }
      setToast({ msg: '✅ Saved — PDF regenerating...', type: 'success' })
      setTimeout(() => setToast({ msg: '✅ PDF updated', type: 'success' }), 2000)
    } catch (err) {
      setToast({ msg: `❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const answerEntries = Object.entries(answers)

  return (
    <div className="max-w-4xl">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold ${
            toast.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-100 px-6 py-3">
          <h2 className="font-semibold text-gray-700 text-sm">Site Details</h2>
        </div>
        <div className="divide-y divide-gray-50">
          <div className="px-6 py-3 flex gap-4 items-center">
            <span className="text-sm text-gray-500 w-1/3 shrink-0">Site Name</span>
            <input
              type="text"
              value={siteName}
              onChange={e => setSiteName(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A800]"
            />
          </div>
          <div className="px-6 py-3 flex gap-4">
            <span className="text-sm text-gray-500 w-1/3 shrink-0 pt-1">Site Address</span>
            <textarea
              value={siteAddress}
              onChange={e => setSiteAddress(e.target.value)}
              rows={2}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A800] resize-y"
            />
          </div>
          <div className="px-6 py-3 flex gap-4 items-center">
            <span className="text-sm text-gray-500 w-1/3 shrink-0">Service Date</span>
            <input
              type="date"
              value={serviceDate}
              onChange={e => setServiceDate(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A800]"
            />
          </div>
          <div className="px-6 py-3 flex gap-4 items-center">
            <span className="text-sm text-gray-500 w-1/3 shrink-0">Engineer Name</span>
            <input
              type="text"
              value={engineerName}
              onChange={e => setEngineerName(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A800]"
            />
          </div>
          <div className="px-6 py-3 flex gap-4 items-center">
            <span className="text-sm text-gray-500 w-1/3 shrink-0">Company Name</span>
            <select
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A800] bg-white"
            >
              <option value="">— Select —</option>
              <option value="GOW Systems">GOW Systems</option>
              <option value="Ladrillos">Ladrillos</option>
              <option value="MS Webb">MS Webb</option>
            </select>
          </div>
          <div className="px-6 py-3 flex gap-4 items-center">
            <span className="text-sm text-gray-500 w-1/3 shrink-0">Job Type</span>
            <select
              value={jobType}
              onChange={e => setJobType(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A800] bg-white"
            >
              <option value="">— Select —</option>
              <option value="PPM">PPM</option>
              <option value="Callout">Callout</option>
              <option value="Small Works">Small Works</option>
              <option value="Return Visit">Return Visit</option>
            </select>
          </div>
          <div className="px-6 py-3 flex gap-4 items-center">
            <span className="text-sm text-gray-500 w-1/3 shrink-0">Follow Up Required</span>
            <input
              type="checkbox"
              checked={followUpRequired}
              onChange={e => setFollowUpRequired(e.target.checked)}
              className="w-4 h-4 accent-[#F5A800]"
            />
          </div>
        </div>
      </div>

      {/* Answers section */}
      {answerEntries.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-100 px-6 py-3">
            <h2 className="font-semibold text-gray-700 text-sm">Inspection Answers</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {answerEntries.map(([key, value]) => renderAnswerField(key, value))}
          </div>
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-[#F5A800] hover:bg-yellow-500 disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold py-3 px-6 rounded-xl transition text-sm"
      >
        {saving ? 'Saving...' : 'Save & Regenerate PDF'}
      </button>
    </div>
  )
}
