import { AlertCircle } from 'lucide-react'

export default function ErrorMessage({ message = 'An error occurred. Please try again.' }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  )
}
