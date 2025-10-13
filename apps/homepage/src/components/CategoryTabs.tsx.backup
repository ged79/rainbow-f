'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const categories = [
  { id: 'wedding', name: '결혼식', path: '/category/wedding' },
  { id: 'funeral', name: '장례식', path: '/category/funeral' },
  { id: 'opening', name: '개업·행사', path: '/category/opening' },
  { id: 'celebration', name: '승진·기념일', path: '/category/celebration' },
]

interface CategoryTabsProps {
  activeCategory?: string;
}

export default function CategoryTabs({ activeCategory }: CategoryTabsProps = {}) {
  const pathname = usePathname()
  
  return (
    <div className="sticky top-[60px] z-40 bg-white border-b md:top-16">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex gap-8 overflow-x-auto scrollbar-hide">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={category.path}
              className={`
                py-4 px-1 text-sm font-medium whitespace-nowrap
                border-b-2 transition-colors
                ${pathname === category.path
                  ? 'text-rose-500 border-rose-500'
                  : 'text-neutral-600 border-transparent hover:text-neutral-900 hover:border-neutral-300'
                }
              `}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
