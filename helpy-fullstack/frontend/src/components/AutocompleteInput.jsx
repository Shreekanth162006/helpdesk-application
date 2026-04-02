import { useState, useEffect, useRef } from 'react';
import { Input, Box, VStack, Text, useColorModeValue } from '@chakra-ui/react';
import { getFilteredSuggestions, saveEntry } from '../utils/autocompleteStorage';

/**
 * AutocompleteInput component that shows limited previous entries
 * @param {string} fieldType - 'email' or 'userId'
 * @param {object} props - All Input props from Chakra UI
 */
export default function AutocompleteInput({ fieldType = 'email', value, onChange, onBlur, ...props }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const menuBg = props.bg === 'gray.800' ? 'gray.800' : useColorModeValue('white','gray.800');
  const menuBorder = props.bg === 'gray.800' ? 'gray.700' : useColorModeValue('gray.200','gray.700');
  const hoverBg = props.bg === 'gray.800' ? 'gray.700' : useColorModeValue('blue.50','gray.700');
  const itemTextColor = props.bg === 'gray.800' ? 'gray.100' : useColorModeValue('gray.700','gray.300');

  useEffect(() => {
    if (value) {
      const filtered = getFilteredSuggestions(fieldType, value);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0 && value.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value, fieldType]);

  const handleInputChange = (e) => {
    onChange(e);
    setHighlightedIndex(-1);
  };

  const handleSuggestionSelect = (suggestion) => {
    const syntheticEvent = {
      target: { value: String(suggestion) },
    };
    onChange(syntheticEvent);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSuggestionSelect(suggestions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  const handleBlur = (e) => {
    // Delay hiding suggestions to allow click events
    setTimeout(() => {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
      if (onBlur) onBlur(e);
    }, 200);
  };

  const handleFocus = () => {
    if (value && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <Box position="relative" width="100%">
      <Input
        {...props}
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={handleFocus}
      />
      {showSuggestions && suggestions.length > 0 && (
        <Box
          ref={suggestionsRef}
          position="absolute"
          top="100%"
          left="0"
          right="0"
          zIndex={1000}
          mt="1"
          bg={menuBg}
          borderWidth="1px"
          borderColor={menuBorder}
          borderRadius="md"
          shadow="lg"
          maxH="200px"
          overflowY="auto"
        >
          <VStack align="stretch" spacing={0}>
            {suggestions.map((suggestion, index) => (
              <Box
                key={index}
                px="3"
                py="2"
                cursor="pointer"
                bg={highlightedIndex === index ? hoverBg : menuBg}
                _hover={{ bg: hoverBg }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSuggestionSelect(suggestion);
                }}
                onClick={() => handleSuggestionSelect(suggestion)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <Text fontSize="sm" color={itemTextColor}>
                  {String(suggestion)}
                </Text>
              </Box>
            ))}
          </VStack>
        </Box>
      )}
    </Box>
  );
}
