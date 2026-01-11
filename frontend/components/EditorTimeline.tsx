'use client'

import { Order } from '@/lib/api'

interface EditorTimelineProps {
  order: Order
}

const editorTimelineStages = [
  { key: 'APPLIED', label: 'Applied', description: 'Application submitted to creator' },
  { key: 'APPROVED', label: 'Approved by Creator', description: 'Creator has approved your application' },
  { key: 'ASSIGNED', label: 'Deposit Locked', description: 'Security deposit has been locked' },
  { key: 'RAW_FILES_AVAILABLE', label: 'Raw Files Available', description: 'Raw video files are ready for download' },
  { key: 'IN_PROGRESS', label: 'Work Started', description: 'You have started working on the project' },
  { key: 'PREVIEW_DEADLINE', label: 'Preview Deadline', description: 'Submit preview before this deadline' },
  { key: 'PREVIEW_SUBMITTED', label: 'Preview Submitted', description: 'Preview video submitted for review' },
  { key: 'REVISION_REQUESTED', label: 'Revision Window Open', description: 'Creator requested revisions' },
  { key: 'FINAL_DEADLINE', label: 'Final Deadline', description: 'Submit final video before this deadline' },
  { key: 'FINAL_SUBMITTED', label: 'Final Submitted', description: 'Final video submitted to creator' },
  { key: 'COMPLETED', label: 'Payment Released', description: 'Payment released and deposit refunded' }
]

export default function EditorTimeline({ order }: EditorTimelineProps) {
  const currentStageIndex = editorTimelineStages.findIndex(stage => stage.key === order.status)
  const isCompleted = order.status === 'COMPLETED'
  
  // Calculate revision count if applicable
  const revisionCount = order.messages?.filter(msg => msg.type === 'TIMESTAMP_COMMENT' && !msg.resolved).length || 0

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="font-semibold text-lg mb-6">Project Timeline</h3>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200"></div>
        
        {editorTimelineStages.map((stage, index) => {
          const isActive = index <= currentStageIndex
          const isCurrent = index === currentStageIndex
          const isCompletedStage = index < currentStageIndex || (isCompleted && index <= currentStageIndex)
          
          // Skip some stages based on order status
          if (stage.key === 'RAW_FILES_AVAILABLE' && !order.files?.some(f => f.type === 'RAW_VIDEO')) {
            return null
          }
          
          if (stage.key === 'PREVIEW_DEADLINE' && order.status !== 'IN_PROGRESS') {
            return null
          }
          
          if (stage.key === 'FINAL_DEADLINE' && order.status !== 'PREVIEW_SUBMITTED' && order.status !== 'REVISION_REQUESTED') {
            return null
          }
          
          if (stage.key === 'REVISION_REQUESTED' && order.status !== 'REVISION_REQUESTED') {
            return null
          }
          
          return (
            <div key={stage.key} className="relative flex items-start mb-8 last:mb-0">
              {/* Timeline dot */}
              <div className={`
                relative z-10 w-8 h-8 rounded-full flex items-center justify-center
                ${isCompletedStage ? 'bg-green-500' : isCurrent ? 'bg-indigo-500' : 'bg-gray-300'}
              `}>
                {isCompletedStage ? (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
              
              {/* Timeline content */}
              <div className="ml-6 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className={`font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                    {stage.label}
                  </h4>
                  {isCurrent && (
                    <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                      Current
                    </span>
                  )}
                  {isCompletedStage && !isCurrent && (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Completed
                    </span>
                  )}
                </div>
                <p className={`text-sm mt-1 ${isActive ? 'text-gray-600' : 'text-gray-400'}`}>
                  {stage.description}
                </p>
                
                {/* Additional info for specific stages */}
                {stage.key === 'APPROVED' && (
                  <div className="mt-2 text-xs text-gray-600">
                    Deposit: ₹{order.amount ? (order.amount * 0.1).toLocaleString() : '0'} locked
                  </div>
                )}
                
                {stage.key === 'RAW_FILES_AVAILABLE' && (
                  <div className="mt-2">
                    <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                      Download Raw Files →
                    </button>
                  </div>
                )}
                
                {stage.key === 'PREVIEW_DEADLINE' && (
                  <div className="mt-2">
                    <p className="text-xs text-orange-600 font-medium">
                      Deadline: {new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </p>
                    <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-1">
                      Submit Preview →
                    </button>
                  </div>
                )}
                
                {stage.key === 'REVISION_REQUESTED' && (
                  <div className="mt-2">
                    <p className="text-xs text-orange-600 font-medium">
                      {revisionCount} revision{revisionCount !== 1 ? 's' : ''} requested
                    </p>
                    <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-1">
                      View Revision Details →
                    </button>
                  </div>
                )}
                
                {stage.key === 'FINAL_DEADLINE' && (
                  <div className="mt-2">
                    <p className="text-xs text-orange-600 font-medium">
                      Deadline: {new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </p>
                    <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-1">
                      Submit Final Video →
                    </button>
                  </div>
                )}
                
                {stage.key === 'FINAL_SUBMITTED' && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600">Waiting for creator approval</p>
                  </div>
                )}
                
                {stage.key === 'COMPLETED' && (
                  <div className="mt-2">
                    <p className="text-xs text-green-600 font-medium">
                      Payment: ₹{order.amount?.toLocaleString()} received
                    </p>
                    <p className="text-xs text-green-600 font-medium">
                      Deposit refunded: ₹{order.amount ? (order.amount * 0.1).toLocaleString() : '0'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Progress bar */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-medium text-gray-700">
            {currentStageIndex >= 0 ? Math.round(((currentStageIndex + 1) / editorTimelineStages.length) * 100) : 0}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${currentStageIndex >= 0 ? ((currentStageIndex + 1) / editorTimelineStages.length) * 100 : 0}%` 
            }}
          ></div>
        </div>
      </div>
    </div>
  )
}
