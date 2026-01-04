import { vintageFilters, type VintageFilter } from '../lib/filters';
import './FilterSelector.css';

interface FilterSelectorProps {
    selectedFilter: string;
    onFilterChange: (filter: VintageFilter) => void;
}

export const FilterSelector = ({ selectedFilter, onFilterChange }: FilterSelectorProps) => {
    return (
        <div className="filter-selector">
            {vintageFilters.map((filter) => (
                <button
                    key={filter.id}
                    className={`filter-btn ${selectedFilter === filter.id ? 'active' : ''}`}
                    onClick={() => onFilterChange(filter)}
                    style={{
                        filter: filter.cssFilter
                    }}
                >
                    <div className="filter-preview"></div>
                    <span className="filter-name">{filter.name}</span>
                </button>
            ))}
        </div>
    );
};
