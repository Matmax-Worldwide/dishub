'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';

// Country codes data with translation keys
const COUNTRY_CODES = [
  { code: 'ES', nameKey: 'countries.spain', dialCode: '+34', flag: '🇪🇸' },
  { code: 'US', nameKey: 'countries.unitedStates', dialCode: '+1', flag: '🇺🇸' },
  { code: 'MX', nameKey: 'countries.mexico', dialCode: '+52', flag: '🇲🇽' },
  { code: 'CO', nameKey: 'countries.colombia', dialCode: '+57', flag: '🇨🇴' },
  { code: 'AR', nameKey: 'countries.argentina', dialCode: '+54', flag: '🇦🇷' },
  { code: 'CL', nameKey: 'countries.chile', dialCode: '+56', flag: '🇨🇱' },
  { code: 'PE', nameKey: 'countries.peru', dialCode: '+51', flag: '🇵🇪' },
  { code: 'VE', nameKey: 'countries.venezuela', dialCode: '+58', flag: '🇻🇪' },
  { code: 'EC', nameKey: 'countries.ecuador', dialCode: '+593', flag: '🇪🇨' },
  { code: 'BO', nameKey: 'countries.bolivia', dialCode: '+591', flag: '🇧🇴' },
  { code: 'UY', nameKey: 'countries.uruguay', dialCode: '+598', flag: '🇺🇾' },
  { code: 'PY', nameKey: 'countries.paraguay', dialCode: '+595', flag: '🇵🇾' },
  { code: 'BR', nameKey: 'countries.brazil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'FR', nameKey: 'countries.france', dialCode: '+33', flag: '🇫🇷' },
  { code: 'DE', nameKey: 'countries.germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'IT', nameKey: 'countries.italy', dialCode: '+39', flag: '🇮🇹' },
  { code: 'GB', nameKey: 'countries.unitedKingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'CA', nameKey: 'countries.canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'AU', nameKey: 'countries.australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'JP', nameKey: 'countries.japan', dialCode: '+81', flag: '🇯🇵' },
  { code: 'KR', nameKey: 'countries.southKorea', dialCode: '+82', flag: '🇰🇷' },
  { code: 'CN', nameKey: 'countries.china', dialCode: '+86', flag: '🇨🇳' },
  { code: 'IN', nameKey: 'countries.india', dialCode: '+91', flag: '🇮🇳' },
  { code: 'RU', nameKey: 'countries.russia', dialCode: '+7', flag: '🇷🇺' },
  { code: 'ZA', nameKey: 'countries.southAfrica', dialCode: '+27', flag: '🇿🇦' },
  { code: 'EG', nameKey: 'countries.egypt', dialCode: '+20', flag: '🇪🇬' },
  { code: 'NG', nameKey: 'countries.nigeria', dialCode: '+234', flag: '🇳🇬' },
  { code: 'KE', nameKey: 'countries.kenya', dialCode: '+254', flag: '🇰🇪' },
  { code: 'MA', nameKey: 'countries.morocco', dialCode: '+212', flag: '🇲🇦' },
  { code: 'TN', nameKey: 'countries.tunisia', dialCode: '+216', flag: '🇹🇳' },
  { code: 'DZ', nameKey: 'countries.algeria', dialCode: '+213', flag: '🇩🇿' },
  { code: 'LY', nameKey: 'countries.libya', dialCode: '+218', flag: '🇱🇾' },
  { code: 'SD', nameKey: 'countries.sudan', dialCode: '+249', flag: '🇸🇩' },
  { code: 'ET', nameKey: 'countries.ethiopia', dialCode: '+251', flag: '🇪🇹' },
  { code: 'GH', nameKey: 'countries.ghana', dialCode: '+233', flag: '🇬🇭' },
  { code: 'UG', nameKey: 'countries.uganda', dialCode: '+256', flag: '🇺🇬' },
  { code: 'TZ', nameKey: 'countries.tanzania', dialCode: '+255', flag: '🇹🇿' },
  { code: 'ZW', nameKey: 'countries.zimbabwe', dialCode: '+263', flag: '🇿🇼' },
  { code: 'ZM', nameKey: 'countries.zambia', dialCode: '+260', flag: '🇿🇲' },
  { code: 'MW', nameKey: 'countries.malawi', dialCode: '+265', flag: '🇲🇼' },
  { code: 'MZ', nameKey: 'countries.mozambique', dialCode: '+258', flag: '🇲🇿' },
  { code: 'BW', nameKey: 'countries.botswana', dialCode: '+267', flag: '🇧🇼' },
  { code: 'NA', nameKey: 'countries.namibia', dialCode: '+264', flag: '🇳🇦' },
  { code: 'SZ', nameKey: 'countries.eswatini', dialCode: '+268', flag: '🇸🇿' },
  { code: 'LS', nameKey: 'countries.lesotho', dialCode: '+266', flag: '🇱🇸' },
  { code: 'NL', nameKey: 'countries.netherlands', dialCode: '+31', flag: '🇳🇱' },
  { code: 'BE', nameKey: 'countries.belgium', dialCode: '+32', flag: '🇧🇪' },
  { code: 'CH', nameKey: 'countries.switzerland', dialCode: '+41', flag: '🇨🇭' },
  { code: 'AT', nameKey: 'countries.austria', dialCode: '+43', flag: '🇦🇹' },
  { code: 'PT', nameKey: 'countries.portugal', dialCode: '+351', flag: '🇵🇹' },
  { code: 'SE', nameKey: 'countries.sweden', dialCode: '+46', flag: '🇸🇪' },
  { code: 'NO', nameKey: 'countries.norway', dialCode: '+47', flag: '🇳🇴' },
  { code: 'DK', nameKey: 'countries.denmark', dialCode: '+45', flag: '🇩🇰' },
  { code: 'FI', nameKey: 'countries.finland', dialCode: '+358', flag: '🇫🇮' },
  { code: 'PL', nameKey: 'countries.poland', dialCode: '+48', flag: '🇵🇱' },
  { code: 'CZ', nameKey: 'countries.czechRepublic', dialCode: '+420', flag: '🇨🇿' },
  { code: 'HU', nameKey: 'countries.hungary', dialCode: '+36', flag: '🇭🇺' },
  { code: 'RO', nameKey: 'countries.romania', dialCode: '+40', flag: '🇷🇴' },
  { code: 'BG', nameKey: 'countries.bulgaria', dialCode: '+359', flag: '🇧🇬' },
  { code: 'GR', nameKey: 'countries.greece', dialCode: '+30', flag: '🇬🇷' },
  { code: 'TR', nameKey: 'countries.turkey', dialCode: '+90', flag: '🇹🇷' },
  { code: 'IL', nameKey: 'countries.israel', dialCode: '+972', flag: '🇮🇱' },
  { code: 'AE', nameKey: 'countries.uae', dialCode: '+971', flag: '🇦🇪' },
  { code: 'SA', nameKey: 'countries.saudiArabia', dialCode: '+966', flag: '🇸🇦' },
  { code: 'QA', nameKey: 'countries.qatar', dialCode: '+974', flag: '🇶🇦' },
  { code: 'KW', nameKey: 'countries.kuwait', dialCode: '+965', flag: '🇰🇼' },
  { code: 'BH', nameKey: 'countries.bahrain', dialCode: '+973', flag: '🇧🇭' },
  { code: 'OM', nameKey: 'countries.oman', dialCode: '+968', flag: '🇴🇲' },
  { code: 'JO', nameKey: 'countries.jordan', dialCode: '+962', flag: '🇯🇴' },
  { code: 'LB', nameKey: 'countries.lebanon', dialCode: '+961', flag: '🇱🇧' },
  { code: 'SY', nameKey: 'countries.syria', dialCode: '+963', flag: '🇸🇾' },
  { code: 'IQ', nameKey: 'countries.iraq', dialCode: '+964', flag: '🇮🇶' },
  { code: 'IR', nameKey: 'countries.iran', dialCode: '+98', flag: '🇮🇷' },
  { code: 'AF', nameKey: 'countries.afghanistan', dialCode: '+93', flag: '🇦🇫' },
  { code: 'PK', nameKey: 'countries.pakistan', dialCode: '+92', flag: '🇵🇰' },
  { code: 'BD', nameKey: 'countries.bangladesh', dialCode: '+880', flag: '🇧🇩' },
  { code: 'LK', nameKey: 'countries.sriLanka', dialCode: '+94', flag: '🇱🇰' },
  { code: 'NP', nameKey: 'countries.nepal', dialCode: '+977', flag: '🇳🇵' },
  { code: 'BT', nameKey: 'countries.bhutan', dialCode: '+975', flag: '🇧🇹' },
  { code: 'MV', nameKey: 'countries.maldives', dialCode: '+960', flag: '🇲🇻' },
  { code: 'TH', nameKey: 'countries.thailand', dialCode: '+66', flag: '🇹🇭' },
  { code: 'VN', nameKey: 'countries.vietnam', dialCode: '+84', flag: '🇻🇳' },
  { code: 'MY', nameKey: 'countries.malaysia', dialCode: '+60', flag: '🇲🇾' },
  { code: 'SG', nameKey: 'countries.singapore', dialCode: '+65', flag: '🇸🇬' },
  { code: 'ID', nameKey: 'countries.indonesia', dialCode: '+62', flag: '🇮🇩' },
  { code: 'PH', nameKey: 'countries.philippines', dialCode: '+63', flag: '🇵🇭' },
  { code: 'NZ', nameKey: 'countries.newZealand', dialCode: '+64', flag: '🇳🇿' },
];

interface PhoneInputProps {
  id: string;
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  defaultCountry?: string;
}

export function PhoneInput({
  id,
  name,
  value = '',
  onChange,
  placeholder = '',
  required = false,
  disabled = false,
  className = '',
  defaultCountry = 'ES'
}: PhoneInputProps) {
  const { t } = useI18n();
  const [selectedCountry, setSelectedCountry] = useState(() => {
    return COUNTRY_CODES.find(country => country.code === defaultCountry) || COUNTRY_CODES[0];
  });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Parse existing value on mount
  useEffect(() => {
    if (value) {
      const country = COUNTRY_CODES.find(c => value.startsWith(c.dialCode));
      if (country) {
        setSelectedCountry(country);
        setPhoneNumber(value.substring(country.dialCode.length).trim());
      } else {
        setPhoneNumber(value);
      }
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setSearchTerm('');
        setSelectedLetter('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isDropdownOpen]);

  const handleCountryChange = (country: typeof COUNTRY_CODES[0]) => {
    setSelectedCountry(country);
    const fullNumber = `${country.dialCode} ${phoneNumber}`.trim();
    onChange?.(fullNumber);
    setIsDropdownOpen(false);
    setSearchTerm('');
    setSelectedLetter('');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const number = e.target.value;
    setPhoneNumber(number);
    const fullNumber = `${selectedCountry.dialCode} ${number}`.trim();
    onChange?.(fullNumber);
  };

  // Filter countries based on search term and selected letter
  const filteredCountries = COUNTRY_CODES.filter(country => {
    const countryName = t(country.nameKey).toLowerCase();
    const matchesSearch = searchTerm === '' || 
      countryName.includes(searchTerm.toLowerCase()) ||
      country.dialCode.includes(searchTerm) ||
      country.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLetter = selectedLetter === '' || 
      countryName.charAt(0).toLowerCase() === selectedLetter.toLowerCase();
    
    return matchesSearch && matchesLetter;
  });

  // Get unique first letters for navigation
  const availableLetters = Array.from(new Set(
    COUNTRY_CODES.map(country => t(country.nameKey).charAt(0).toUpperCase())
  )).sort();

  const baseInputClasses = "flex-1 backdrop-blur-xl bg-white/5 border border-white/10 text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent hover:bg-white/10 transition-all duration-300 rounded-r-xl";
  const countryButtonClasses = "backdrop-blur-xl bg-white/5 border border-white/10 border-r-0 text-white rounded-l-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent hover:bg-white/10 transition-all duration-300 flex items-center justify-between";

  return (
    <div className={`relative ${className}`}>
      <div className="flex">
        {/* Country Selector Button */}
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={disabled}
          className={`${countryButtonClasses} px-3 py-3 min-w-[120px] sm:min-w-[140px]`}
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">{selectedCountry.flag}</span>
            <span className="text-sm font-medium hidden sm:inline">{selectedCountry.dialCode}</span>
            <span className="text-sm font-medium sm:hidden">{selectedCountry.dialCode}</span>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Phone Number Input */}
        <input
          type="tel"
          id={id}
          name={name}
          value={phoneNumber}
          onChange={handlePhoneChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`${baseInputClasses} px-4 py-3`}
        />
      </div>

      {/* Dropdown */}
      {isDropdownOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl shadow-2xl z-50 max-h-80 overflow-hidden"
        >
          {/* Search Bar */}
          <div className="p-3 border-b border-white/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedLetter('');
                }}
                placeholder={t('phoneInput.searchCountry') || 'Search country...'}
                className="w-full pl-10 pr-10 py-2 backdrop-blur-xl bg-white/5 border border-white/10 text-white placeholder-white/50 focus:ring-2 focus:ring-purple-400 focus:border-transparent rounded-lg transition-all duration-300"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Letter Navigation */}
          <div className="p-2 border-b border-white/20">
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => {
                  setSelectedLetter('');
                  setSearchTerm('');
                }}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  selectedLetter === '' 
                    ? 'bg-purple-500/30 text-purple-200' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {t('phoneInput.all') || 'All'}
              </button>
              {availableLetters.map(letter => (
                <button
                  key={letter}
                  onClick={() => {
                    setSelectedLetter(letter);
                    setSearchTerm('');
                  }}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    selectedLetter === letter 
                      ? 'bg-purple-500/30 text-purple-200' 
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>

          {/* Countries List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => handleCountryChange(country)}
                  className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center space-x-3 border-b border-white/5 last:border-b-0"
                >
                  <span className="text-lg">{country.flag}</span>
                  <span className="flex-1 text-sm font-medium text-white">
                    {t(country.nameKey)}
                  </span>
                  <span className="text-sm text-white/70">{country.dialCode}</span>
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-center text-white/50">
                {t('phoneInput.noCountriesFound') || 'No countries found'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 