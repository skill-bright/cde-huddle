import { Sun, Moon, Monitor } from 'lucide-react';
import { useColorScheme } from '../hooks/useColorScheme';

export function ColorSchemeToggle() {
  const { colorScheme, setColorScheme } = useColorScheme();

  const handleToggle = () => {
    const nextScheme = colorScheme === 'light' ? 'dark' : colorScheme === 'dark' ? 'system' : 'light';
    setColorScheme(nextScheme);
  };

  const getIcon = () => {
    switch (colorScheme) {
      case 'light':
        return <Sun className="w-4 h-4" />;
      case 'dark':
        return <Moon className="w-4 h-4" />;
      case 'system':
        return <Monitor className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const getLabel = () => {
    switch (colorScheme) {
      case 'light':
        return 'Light mode';
      case 'dark':
        return 'Dark mode';
      case 'system':
        return 'System preference';
      default:
        return 'System preference';
    }
  };

  return (
    <button
      onClick={handleToggle}
      className="flex items-center justify-center w-10 h-10 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      title={`Current: ${getLabel()}. Click to cycle through light, dark, and system.`}
    >
      {getIcon()}
    </button>
  );
}
