import { useMemo, useState } from 'react'
import {
  AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, Clock3,
  CreditCard, Mail, ShieldCheck, WalletCards
} from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import { useRescue } from '../../context/RescueContext'

const riskStyles = {
  High: 'bg-rose-50 text-rose-700 border-rose-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

const signalStyles = {
  rose: 'bg-rose-50 text-rose-700',
  amber: 'bg-amber-50 text-amber-700',
}

const money = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(value || 0)

export default function FinancialStress() {
  const { customers } = useRescue()
  const [selectedId, setSelectedId] = useState(customers[1]?.id || customers[0]?.id)
  const [sentReminders, setSentReminders] = useState([])
  const [offeredSchedules, setOfferedSchedules] = useState([])

  const alerts = useMemo(
    () => customers.filter((customer) => customer.financialStressLevel !== 'Low')
      .sort((a, b) => b.financialStressScore - a.financialStressScore),
    [customers]
  )
  const selected = customers.find((customer) => customer.id === selectedId) || alerts[0]
  const highRisk = alerts.filter((customer) => customer.financialStressLevel === 'High').length
  const outstanding = alerts.reduce((total, customer) => total + (customer.outstandingBalance || 0), 0)

  function sendReminder(customer) {
    setSentReminders((current) => [...new Set([...current, customer.id])])
  }

  function offerSchedule(customer) {
    setOfferedSchedules((current) => [...new Set([...current, customer.id])])
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Stress Alerts"
        description="Spot payment strain early, before an invoice becomes overdue."
        action={
          <div className="flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Explainable payment signals
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Metric icon={AlertTriangle} label="Customers needing attention" value={alerts.length} detail={`${highRisk} high stress accounts`} tone="rose" />
        <Metric icon={WalletCards} label="Open balance at risk" value={money(outstanding)} detail="Across flagged customers" tone="amber" />
        <Metric icon={CalendarClock} label="Signals monitored" value="5" detail="Delays, partials, invoices, timing, frequency" tone="blue" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-7">
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-800">Payment alerts</h2>
                <p className="mt-1 text-xs text-slate-500">Prioritized by the likelihood of payment difficulty.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{alerts.length} alerts</span>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {alerts.map((customer) => (
              <button
                type="button"
                key={customer.id}
                onClick={() => setSelectedId(customer.id)}
                className={`flex w-full items-center gap-4 p-5 text-left transition hover:bg-slate-50 ${selected?.id === customer.id ? 'bg-blue-50/60' : ''}`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                  {customer.name.replace(/^Customer [A-Z] \(/, '').charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-800">{customer.name}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${riskStyles[customer.financialStressLevel]}`}>
                      {customer.financialStressLevel} stress
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{customer.financialRecommendation}</p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-bold text-slate-800">{money(customer.outstandingBalance)}</p>
                  <p className="text-[11px] text-slate-400">open balance</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-300" />
              </button>
            ))}
          </div>
        </section>

        {selected && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Selected customer</p>
                <h2 className="mt-1 text-lg font-bold text-slate-800">{selected.name}</h2>
                <p className="text-xs text-slate-500">{selected.contact}</p>
              </div>
              <div className={`rounded-xl border px-3 py-2 text-center ${riskStyles[selected.financialStressLevel]}`}>
                <p className="text-xl font-extrabold">{selected.financialStressScore}</p>
                <p className="text-[10px] font-bold uppercase">stress score</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <Signal icon={Clock3} label="Delayed payments" value={selected.delayedPayments} />
              <Signal icon={CreditCard} label="Partial payments" value={selected.partialPayments} />
              <Signal icon={WalletCards} label="Outstanding invoices" value={selected.outstandingInvoices} />
              <Signal icon={CalendarClock} label="Payment frequency" value={selected.paymentFrequency} />
            </div>

            <div className="mt-5">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Why this alert fired</h3>
              <div className="space-y-2">
                {selected.financialSignals.map((signal) => (
                  <div key={signal.label} className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${signalStyles[signal.tone]}`}>
                    <span className="font-semibold">{signal.label}</span>
                    <span>{signal.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Recommended next step</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{selected.financialRecommendation}</p>
              <p className="mt-1 text-xs text-slate-500">A flexible schedule can protect the relationship while recovering the balance.</p>
              <button
                type="button"
                onClick={() => sendReminder(selected)}
                disabled={sentReminders.includes(selected.id)}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:bg-emerald-600"
              >
                {sentReminders.includes(selected.id) ? <CheckCircle2 className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                {sentReminders.includes(selected.id) ? 'Reminder queued' : 'Send payment reminder'}
              </button>
              {selected.financialStressLevel === 'High' && (
                <button
                  type="button"
                  onClick={() => offerSchedule(selected)}
                  disabled={offeredSchedules.includes(selected.id)}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-50 disabled:border-emerald-200 disabled:text-emerald-700"
                >
                  {offeredSchedules.includes(selected.id) ? <CheckCircle2 className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />}
                  {offeredSchedules.includes(selected.id) ? 'Flexible schedule offered' : 'Offer flexible payment schedule'}
                </button>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function Metric({ icon: Icon, label, value, detail, tone }) {
  const colors = { rose: 'text-rose-600 bg-rose-50', amber: 'text-amber-600 bg-amber-50', blue: 'text-blue-600 bg-blue-50' }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
        <span className={`rounded-lg p-2 ${colors[tone]}`}><Icon className="h-4 w-4" /></span>
      </div>
      <p className="mt-3 text-2xl font-extrabold text-slate-800">{value}</p>
      <p className="mt-1 text-[11px] text-slate-400">{detail}</p>
    </div>
  )
}

function Signal({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <Icon className="h-4 w-4 text-slate-400" />
      <p className="mt-2 text-lg font-bold text-slate-800">{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  )
}
