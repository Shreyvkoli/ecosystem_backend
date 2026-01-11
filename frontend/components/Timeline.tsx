'use client'

import { Order } from '@/lib/api'

interface TimelineProps {
  order: Order
}

const timelineStages = [
  { key: 'ASSIGNED', label: 'Editor Assigned', description: 'Editor has been assigned to your project' },
  { key: 'IN_PROGRESS', label: 'Work Started', description: 'Editor has started working on your video' },
  { key: 'PREVIEW_SUBMITTED', label: 'Preview Ready', description: 'Editor has submitted a preview for review' },
  { key: 'FINAL_SUBMITTED', label: 'Final Delivery', description: 'Final video has been submitted' },
  { key: 'COMPLETED', label: 'Project Completed', description: 'Project has been successfully completed' }
]

export default function Timeline({ order }: TimelineProps) {
  const currentStageIndex = timelineStages.findIndex(stage => stage.key === order.status)
  const isCompleted = order.status === 'COMPLETED'

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="font-semibold text-lg mb-6">Project Timeline</h3>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-200"></div>
        
        {timelineStages.map((stage, index) => {
          const isActive = index <= currentStageIndex
          const isCurrent = index === currentStageIndex
          const isCompletedStage = index < currentStageIndex || (isCompleted && index <= currentStageIndex)
          
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
                      In Progress
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
                {stage.key === 'ASSIGNED' && order.editor && (
                  <div className="mt-2 flex items-center space-x-2">
                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-bold text-xs">
                        {order.editor.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs text-gray-600">{order.editor.name}</span>
                  </div>
                )}
                
                {stage.key === 'PREVIEW_SUBMITTED' && (
                  <div className="mt-2">
                    <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                      View Preview →
                    </button>
                  </div>
                )}
                
                {stage.key === 'FINAL_SUBMITTED' && (
                  <div className="mt-2">
                    <button className="text-xs text-green-600 hover:text-green-800 font-medium">
                      Download Final Video →
                    </button>
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
            {currentStageIndex >= 0 ? Math.round(((currentStageIndex + 1) / timelineStages.length) * 100) : 0}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${currentStageIndex >= 0 ? ((currentStageIndex + 1) / timelineStages.length) * 100 : 0}%` 
            }}
          ></div>
        </div>
      </div>
    </div>
  )
}
