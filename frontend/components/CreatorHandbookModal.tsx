import { Fragment } from 'react'

interface CreatorHandbookModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function CreatorHandbookModal({ isOpen, onClose }: CreatorHandbookModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} aria-hidden="true"></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full sm:p-6">
                    <div className="absolute top-0 right-0 pt-4 pr-4">
                        <button
                            type="button"
                            className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                            onClick={onClose}
                        >
                            <span className="sr-only">Close</span>
                            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="sm:flex sm:items-start">
                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                            <span className="text-xl">📘</span>
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                            <h3 className="text-xl leading-6 font-bold text-gray-900" id="modal-title">
                                The Creator Handbook
                            </h3>
                            <div className="mt-4 space-y-5 text-sm">

                                {/* Section 1 */}
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <h4 className="font-bold text-indigo-700 mb-1">1. Editor Assignment & Payment</h4>
                                    <p className="text-gray-600">
                                        Once you select an Editor, you must fund the <strong>Escrow</strong>. Your money is held safely by Cutflow and only released to the Editor after your final approval.
                                    </p>
                                </div>

                                {/* Section 2 */}
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-1 text-base">2. Raw Footage Upload</h4>
                                    <p className="text-gray-600 mb-1">Provide your footage immediately after ordering.</p>
                                    <ul className="list-disc pl-5 text-gray-500 space-y-1">
                                        <li><strong>Formats:</strong> .MP4, .MOV, .AVI, etc.</li>
                                        <li><strong>Methods:</strong> Direct upload (Small files) or Google Drive/Dropbox links.</li>
                                        <li><strong>Access:</strong> Ensure Drive links are set to "Anyone with the link".</li>
                                    </ul>
                                </div>

                                {/* Section 3 */}
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-1 text-base">3. The 48-Hour Review Rule</h4>
                                    <p className="text-gray-600">
                                        When the Editor submits a draft, you have <strong>48 hours</strong> to provide feedback. This prevents project delays and keeps the workflow efficient.
                                    </p>
                                </div>

                                {/* Section 4 */}
                                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                                    <h4 className="font-bold text-yellow-800 mb-1">4. Revision Policy</h4>
                                    <p className="text-gray-700 mb-1">Every order includes <strong>2 Free Revisions</strong>.</p>
                                    <ul className="list-disc pl-5 text-gray-600 space-y-1">
                                        <li>Be specific with your feedback to get the best results.</li>
                                        <li>Additional revisions after the first two may incur extra costs.</li>
                                    </ul>
                                </div>

                                {/* Section 5 */}
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-1 text-base">5. Final Approval & Release</h4>
                                    <p className="text-gray-600">
                                        Once satisfied, click <strong>"Approve & Mark Complete"</strong>.
                                    </p>
                                    <ul className="list-disc pl-5 text-gray-500 mt-1 space-y-1">
                                        <li>The high-resolution download link will be unlocked for you.</li>
                                        <li>Payment is instantly released to the Editor’s wallet.</li>
                                    </ul>
                                </div>

                                {/* Pro Tip */}
                                <div className="border-t border-gray-200 pt-3">
                                    <p className="text-indigo-600 text-xs">
                                        <strong>🚀 Pro-Tip:</strong> keep all communication on the platform to ensure your Escrow protection and to use the Timestamped Review Player for faster edits.
                                    </p>
                                </div>

                            </div>
                        </div>
                    </div>

                    <div className="mt-5 sm:mt-6">
                        <button
                            type="button"
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:text-sm"
                            onClick={onClose}
                        >
                            Got it, let's create!
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
