import { useState } from 'react';

interface StarRatingProps {
    rating: number;
    maxStars?: number;
    size?: 'sm' | 'md' | 'lg';
    interactive?: boolean;
    onChange?: (rating: number) => void;
}

export default function StarRating({ rating, maxStars = 5, size = 'md', interactive = false, onChange }: StarRatingProps) {
    const [hovered, setHovered] = useState(0);

    const sizeClass = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-lg';

    return (
        <div className={`flex items-center gap-0.5 ${sizeClass}`}>
            {Array.from({ length: maxStars }, (_, i) => {
                const starValue = i + 1;
                const filled = interactive ? starValue <= (hovered || rating) : starValue <= rating;
                const halfFilled = !interactive && !filled && starValue - 0.5 <= rating;

                return (
                    <span
                        key={i}
                        className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''} select-none`}
                        onClick={() => interactive && onChange?.(starValue)}
                        onMouseEnter={() => interactive && setHovered(starValue)}
                        onMouseLeave={() => interactive && setHovered(0)}
                    >
                        {filled ? '⭐' : halfFilled ? '⭐' : '☆'}
                    </span>
                );
            })}
        </div>
    );
}
