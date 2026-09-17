type IconProps = { className?: string }

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function UsersIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 5.5c1.4.4 2.5 1.7 2.5 3.2 0 1.5-1 2.7-2.4 3.2" />
      <path d="M21 19.5c0-2.6-1.9-4.7-4.4-5.4" />
    </svg>
  )
}

export function FolderIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 6.5c0-.8.7-1.5 1.5-1.5h4l2 2h9c.8 0 1.5.7 1.5 1.5v9.5c0 .8-.7 1.5-1.5 1.5h-15c-.8 0-1.5-.7-1.5-1.5z" />
    </svg>
  )
}

export function MailIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M3.5 6.5 12 13l8.5-6.5" />
    </svg>
  )
}

export function BriefcaseIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="8" width="18" height="11" rx="1.5" />
      <path d="M8 8V6c0-.8.7-1.5 1.5-1.5h5c.8 0 1.5.7 1.5 1.5v2" />
      <path d="M3 13h18" />
    </svg>
  )
}

export function TargetIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    </svg>
  )
}

export function FileIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 3.5h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1z" />
      <path d="M14 3.5V8h4" />
    </svg>
  )
}

export function LinkIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M9.5 14.5 14.5 9.5" />
      <path d="M11 7l1.5-1.5a3.5 3.5 0 0 1 5 5L16 12" />
      <path d="M13 17l-1.5 1.5a3.5 3.5 0 0 1-5-5L8 12" />
    </svg>
  )
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  )
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="5" width="17" height="15" rx="1.5" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v3.5" />
      <path d="M16 3v3.5" />
    </svg>
  )
}

export function KeyIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="8" cy="15" r="4" />
      <path d="M11 12l9-9" />
      <path d="M16 7l3 3" />
      <path d="M13 10l2.5 2.5" />
    </svg>
  )
}

export function HashIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M9 4l-2 16" />
      <path d="M17 4l-2 16" />
      <path d="M4 9h16" />
      <path d="M3 15h16" />
    </svg>
  )
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5.5" />
    </svg>
  )
}

export function AlertIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4.5" />
      <circle cx="12" cy="15.5" r="0.6" fill="currentColor" />
    </svg>
  )
}
