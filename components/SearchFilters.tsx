import React, { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '~/components/nativewindui/Text';
import { Button } from '~/components/nativewindui/Button';
// Removed Toggle import - no longer used
import { SearchFilters as SearchFiltersType } from '~/lib/types/cocktail';
import { cn } from '~/lib/cn';

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: SearchFiltersType) => void;
  categories: string[];
  glassTypes: string[];
  isVisible: boolean;
  onClose: () => void;
}

interface FilterSectionProps {
  title: string;
  value: string | undefined;
  options: { label: string; value: string }[];
  onSelect: (value: string | undefined) => void;
}

function FilterSection({ title, value, options, onSelect }: FilterSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : `All ${title}`;

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-medium text-foreground">{title}</Text>

      {/* Selected Value Display */}
      <Pressable
        onPress={() => setIsExpanded(!isExpanded)}
        className="flex-row items-center justify-between rounded-lg border border-border bg-background p-3">
        <Text className={cn('flex-1', value ? 'text-foreground' : 'text-muted-foreground')}>
          {displayValue}
        </Text>
        <FontAwesome
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="#9CA3AF"
          style={{ marginLeft: 8 }}
        />
      </Pressable>

      {/* Options List */}
      {isExpanded && (
        <View className="mt-2 rounded-lg border border-border bg-card">
          <ScrollView className="max-h-48">
            {options.map((option, index) => (
              <Pressable
                key={option.value}
                onPress={() => {
                  onSelect(option.value === '' ? undefined : option.value);
                  setIsExpanded(false);
                }}
                className={cn(
                  'ios:active:opacity-70 flex-row items-center justify-between p-3',
                  index !== options.length - 1 && 'border-b border-border'
                )}>
                <Text
                  className={cn(
                    'flex-1',
                    option.value === value ? 'font-medium text-primary' : 'text-foreground'
                  )}>
                  {option.label}
                </Text>
                {option.value === value && <FontAwesome name="check" size={16} color="#0066CC" />}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

export function SearchFilters({
  filters,
  onFiltersChange,
  categories,
  glassTypes,
  isVisible,
  onClose,
}: SearchFiltersProps) {
  if (!isVisible) return null;

  const clearFilters = () => {
    onFiltersChange({});
  };

  const alcoholicOptions = [
    { label: 'All Types', value: '' },
    { label: 'Alcoholic', value: 'Alcoholic' },
    { label: 'Non Alcoholic', value: 'Non alcoholic' },
  ];

  const categoryOptions = [
    { label: 'All Categories', value: '' },
    ...categories.map((cat) => ({ label: cat, value: cat })),
  ];

  const glassOptions = [
    { label: 'All Glass Types', value: '' },
    ...glassTypes.map((glass) => ({ label: glass, value: glass })),
  ];

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    return value !== undefined && value !== '';
  });

  return (
    <View className="border-t border-border bg-card">
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border p-4">
        <Text className="text-lg font-semibold text-foreground">Filters</Text>
        <View className="flex-row items-center gap-2">
          <Button variant="secondary" size="sm" onPress={clearFilters}>
            <Text>Reset to Defaults</Text>
          </Button>
          <Button variant="primary" size="sm" onPress={onClose}>
            <Text>Done</Text>
          </Button>
        </View>
      </View>

      {/* Filter Options */}
      <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
        <FilterSection
          title="Type"
          value={filters.alcoholic}
          options={alcoholicOptions}
          onSelect={(value) => onFiltersChange({ ...filters, alcoholic: value })}
        />

        <FilterSection
          title="Category"
          value={filters.category}
          options={categoryOptions}
          onSelect={(value) => onFiltersChange({ ...filters, category: value })}
        />

        <FilterSection
          title="Glass Type"
          value={filters.glass}
          options={glassOptions}
          onSelect={(value) => onFiltersChange({ ...filters, glass: value })}
        />

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <View className="bg-primary/5 border-primary/20 mt-4 rounded-lg border p-3">
            <Text className="mb-2 text-sm font-medium text-primary">Active Filters:</Text>
            <View className="flex-row flex-wrap gap-2">
              {filters.alcoholic && (
                <View className="bg-primary/10 rounded-full px-2 py-1">
                  <Text className="text-xs text-primary">Type: {filters.alcoholic}</Text>
                </View>
              )}
              {filters.category && (
                <View className="bg-primary/10 rounded-full px-2 py-1">
                  <Text className="text-xs text-primary">Category: {filters.category}</Text>
                </View>
              )}
              {filters.glass && (
                <View className="bg-primary/10 rounded-full px-2 py-1">
                  <Text className="text-xs text-primary">Glass: {filters.glass}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
