import React from 'react';
import { Clock, CheckCircle } from 'lucide-react';

interface AvailabilityBadgeProps {
    status: 'AVAILABLE' | 'BUSY';
    nextAvailableAt?: string | null;
    activeCount?: number;
    maxSlots?: number;
}

export default function AvailabilityBadge({ status, nextAvailableAt, activeCount, maxSlots }: AvailabilityBadgeProps) {
    if (status === 'AVAILABLE') {
        return (
            <div className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full border border-green-200 text-xs font-semibold shadow-sm">
                <CheckCircle className="w-3 h-3 mr-1.5" />
                Available Now
            </div>
        );
    }

    // Busy State
    const formatDate = (dateString?: string | null) => {
        if (!dateString) return 'approx. 2 days';
        const date = new Date(dateString);
        const now = new Date();
        const diffHours = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60));

        if (diffHours <= 0) return 'Available Soon';
        if (diffHours < 24) return `in ${diffHours} hours`;
        if (diffHours < 48) return 'tomorrow';
        return `on ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
    };

    return (
        <div className="flex flex-col items-start gap-1">
            <div className="flex items-center px-3 py-1 bg-orange-100 text-orange-700 rounded-full border border-orange-200 text-xs font-semibold shadow-sm">
                <Clock className="w-3 h-3 mr-1.5" />
                Busy
            </div>
            <span className="text-[10px] text-gray-500 font-medium ml-1">
                Slot opens {formatDate(nextAvailableAt)}
            </span>
        </div>
    );
}
