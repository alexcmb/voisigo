import { useState, useRef, useEffect } from 'react';

interface AddressSuggestion {
    label: string;
    lat: number;
    lon: number;
}

interface AddressInputProps {
    value: string;
    onChange: (address: string, lat?: number, lon?: number) => void;
    placeholder?: string;
    required?: boolean;
}

export default function AddressInput({ value, onChange, placeholder, required }: AddressInputProps) {
    const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchSuggestions = async (query: string) => {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`);
            const data = await res.json();
            const results: AddressSuggestion[] = data.features.map((f: any) => ({
                label: f.properties.label,
                lat: f.geometry.coordinates[1],
                lon: f.geometry.coordinates[0],
            }));
            setSuggestions(results);
            setShowDropdown(results.length > 0);
        } catch {
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onChange(val);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
    };

    const handleSelect = (suggestion: AddressSuggestion) => {
        onChange(suggestion.label, suggestion.lat, suggestion.lon);
        setShowDropdown(false);
        setSuggestions([]);
    };

    return (
        <div ref={containerRef} className="relative">
            <input
                type="text"
                value={value}
                onChange={handleInputChange}
                onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                placeholder={placeholder}
                required={required}
                className="w-full text-lg p-3 border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-colors"
                autoComplete="off"
            />
            {isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    ...
                </div>
            )}
            {showDropdown && suggestions.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {suggestions.map((s, i) => (
                        <li
                            key={i}
                            onClick={() => handleSelect(s)}
                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-gray-800 border-b border-gray-100 last:border-b-0 flex items-center gap-2"
                        >
                            <span className="text-blue-500">📍</span>
                            <span>{s.label}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
