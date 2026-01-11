'use client'

type CreatorEditorIllustrationsProps = {
  className?: string
}

export default function CreatorEditorIllustrations({ className }: CreatorEditorIllustrationsProps) {
  return (
    <div className={className ?? ''}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-morphism p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M5 7.5C5 6.11929 6.11929 5 7.5 5H16.5C17.8807 5 19 6.11929 19 7.5V16.5C19 17.8807 17.8807 19 16.5 19H7.5C6.11929 19 5 17.8807 5 16.5V7.5Z"
                  stroke="rgba(0,0,0,0.75)"
                  strokeWidth="1.5"
                />
                <path
                  d="M10 9.5L15 12L10 14.5V9.5Z"
                  fill="rgba(129,140,248,0.95)"
                />
                <path
                  d="M8 18.5H16"
                  stroke="rgba(192,132,252,0.85)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div>
              <div className="text-gray-900 font-semibold">For creators</div>
              <div className="text-sm text-gray-600">Upload briefs, review cuts, approve fast.</div>
            </div>
          </div>
        </div>

        <div className="glass-morphism p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M7 8C7 6.89543 7.89543 6 9 6H15C16.1046 6 17 6.89543 17 8V16C17 17.1046 16.1046 18 15 18H9C7.89543 18 7 17.1046 7 16V8Z"
                  stroke="rgba(0,0,0,0.75)"
                  strokeWidth="1.5"
                />
                <path
                  d="M9.5 10H14.5"
                  stroke="rgba(0,0,0,0.55)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M9.5 13H12.5"
                  stroke="rgba(0,0,0,0.55)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M18.5 8.5L20 7M18.5 15.5L20 17"
                  stroke="rgba(129,140,248,0.95)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div>
              <div className="text-gray-900 font-semibold">For editors</div>
              <div className="text-sm text-gray-600">Deliver previews, manage revisions, ship finals.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
