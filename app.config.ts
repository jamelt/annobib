export default defineAppConfig({
  ui: {
    primary: 'indigo',
    gray: 'slate',

    button: {
      default: {
        size: 'md',
      },
    },

    card: {
      base: 'overflow-hidden',
      background: 'bg-white dark:bg-gray-800',
      divide: 'divide-y divide-gray-200 dark:divide-gray-700',
      ring: 'ring-1 ring-gray-200 dark:ring-gray-700',
      rounded: 'rounded-lg',
      shadow: 'shadow-sm',
    },

    input: {
      default: {
        size: 'md',
      },
    },

    select: {
      default: {
        size: 'md',
      },
    },

    textarea: {
      default: {
        size: 'md',
      },
    },

    notification: {
      position: 'top-0 bottom-auto',
    },

    table: {
      th: {
        base: 'text-left rtl:text-right',
        padding: 'px-4 py-3',
        color: 'text-gray-900 dark:text-white',
        font: 'font-semibold',
        size: 'text-sm',
      },
      td: {
        base: '',
        padding: 'px-4 py-3',
        color: 'text-gray-500 dark:text-gray-400',
        font: '',
        size: 'text-sm',
      },
    },
  },
})
