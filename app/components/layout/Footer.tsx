const Footer = () => {
    return (
      <footer className="bg-coc-stone border-t-2 border-coc-gold-dark/30 mt-20">
        <div className="container mx-auto py-8 px-4 text-center text-gray-400">
          <p className="font-supercell text-lg text-coc-gold-dark mb-2">CLASHUB</p>
          <p className="text-sm">
            Platform Komunitas E-sports Clash of Clans.
          </p>
          <p className="text-xs mt-4">
            © {new Date().getFullYear()} Clashub. Dibuat oleh Komunitas untuk Komunitas.
          </p>
        </div>
      </footer>
    );
  };
  
  export default Footer;
