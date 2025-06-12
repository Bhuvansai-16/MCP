/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'gradient-x': 'gradient-x 15s ease infinite',
        'gradient-y': 'gradient-y 15s ease infinite',
        'gradient-xy': 'gradient-xy 15s ease infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'spin-glow': 'spin-glow 1s linear infinite',
      },
      keyframes: {
        'gradient-y': {
          '0%, 100%': {
            'background-size': '400% 400%',
            'background-position': 'center top'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'center center'
          }
        },
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        },
        'gradient-xy': {
          '0%, 100%': {
            'background-size': '400% 400%',
            '
-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        },
        'float': {
          '0%, 100%': {
            transform: 'translateY(0px)'
          },
          '50%': {
            transform: 'translateY(-10px)'
          }
        },
        'pulse-glow': {
          '0%, 100%': {
            'box-shadow': '0 0 5px rgba(59, 130, 246, 0.5)'
          },
          '50%': {
            'box-shadow': '0 0 20px rgba(59, 130, 246, 0.8), 0 0 30px rgba(139, 92, 246, 0.6)'
          }
        },
        'spin-glow': {
          '0%': {
            transform: 'rotate(0deg)',
            filter: 'hue-rotate(0deg)'
          },
          '100%': {
            transform: 'rotate(360deg)',
            filter: 'hue-rotate(360deg)'
          }
        }
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-lg': '0 0 30px rgba(59, 130, 246, 0.4)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.3)',
        'glow-pink': '0 0 20px rgba(236, 72, 153, 0.3)',
        '3xl': '0 35px 60px -12px rgba(0, 0, 0, 0.25)',
      },
      colors: {
        gray: {
          850: '#1f2937',
          950: '#0f172a',
        }
      }
    },
  },
  plugins: [],
  safelist: [
    // Protocol colors
    'border-blue-200', 'border-blue-400', 'border-blue-500', 'border-blue-600',
    'bg-blue-50', 'bg-blue-100', 'bg-blue-500', 'bg-blue-600',
    'text-blue-400', 'text-blue-500', 'text-blue-600', 'text-blue-700',
    'from-blue-500', 'to-blue-600',
    
    'border-green-200', 'border-green-400', 'border-green-500', 'border-green-600',
    'bg-green-50', 'bg-green-100', 'bg-green-500', 'bg-green-600',
    'text-green-400', 'text-green-500', 'text-green-600', 'text-green-700',
    'from-green-500', 'to-green-600',
    
    'border-purple-200', 'border-purple-400', 'border-purple-500', 'border-purple-600',
    'bg-purple-50', 'bg-purple-100', 'bg-purple-500', 'bg-purple-600',
    'text-purple-400', 'text-purple-500', 'text-purple-600', 'text-purple-700',
    'from-purple-500', 'to-purple-600',
    
    'border-orange-200', 'border-orange-400', 'border-orange-500', 'border-orange-600',
    'bg-orange-50', 'bg-orange-100', 'bg-orange-500', 'bg-orange-600',
    'text-orange-400', 'text-orange-500', 'text-orange-600', 'text-orange-700',
    'from-orange-500', 'to-orange-600',
    
    // Shadow colors for protocols
    'shadow-blue-500/20', 'shadow-green-500/20', 'shadow-purple-500/20', 'shadow-orange-500/20',
    'shadow-blue-400/20', 'shadow-green-400/20', 'shadow-purple-400/20', 'shadow-orange-400/20',
  ]
};