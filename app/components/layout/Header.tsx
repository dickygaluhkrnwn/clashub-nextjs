import Link from 'next/link';
import { BellIcon, SearchIcon, UserIcon, SunIcon, MoonIcon } from '@/components/icons';

// Data navigasi sementara
const navItems = [
  { name: 'Home', href: '/', active: true },
  { name: 'Team Hub', href: '/teamhub', active: false },
  { name: 'Tournament', href: '/tournament', active: false },
  { name: 'Knowledge Hub', href: '/knowledge-hub', active: false },
];

const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-coc-stone/80 backdrop-blur-sm border-b-2 border-coc-gold-dark/50 shadow-lg">
      <div className="container mx-auto flex items-center justify-between p-4">
        {/* Logo */}
        <Link href="/" className="font-supercell text-3xl text-coc-gold" style={{ textShadow: '2px 2px 5px rgba(0,0,0,0.8)' }}>
          CLASHUB
        </Link>

        {/* Navigasi Utama */}
        <nav className="hidden md:flex items-center gap-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`
                px-4 py-2 rounded-md text-sm font-bold transition-all duration-300
                ${item.active
                  ? 'bg-coc-gold text-coc-stone shadow-inner'
                  : 'text-gray-300 hover:bg-coc-stone-light/50 hover:text-white'
                }
              `}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Aksi Pengguna */}
        <div className="flex items-center gap-4">
          <button className="text-gray-300 hover:text-coc-gold transition-colors">
            <SearchIcon className="h-6 w-6" />
          </button>
          
          <div className="relative">
            <button className="text-gray-300 hover:text-coc-gold transition-colors">
              <BellIcon className="h-6 w-6" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-coc-red text-xs font-bold text-white">
                2
              </span>
            </button>
          </div>
          
          <div className="w-px h-6 bg-coc-gold-dark/50"></div>

          <button className="h-9 w-9 flex items-center justify-center rounded-full bg-coc-stone-light hover:ring-2 hover:ring-coc-gold transition-all">
            <UserIcon className="h-6 w-6 text-gray-400" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
