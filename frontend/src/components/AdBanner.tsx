export default function AdBanner({ format = 'banner', className = '', imageSrc }: { format?: 'square' | 'banner', className?: string, imageSrc?: string }) {
    if (imageSrc) {
        return (
            <div className={`overflow-hidden rounded-lg shadow-sm group relative bg-white ${format === 'banner' ? 'w-full max-w-lg mx-auto' : 'h-64 w-full md:w-64'} ${className}`}>
                <span className="absolute top-2 right-2 text-[10px] bg-white/90 text-gray-500 border border-gray-200 px-1 rounded uppercase tracking-wider z-10 font-bold">Publicité</span>
                <img
                    src={imageSrc}
                    alt="Publicité"
                    className="w-full h-auto object-cover transition-transform duration-700 hover:scale-105"
                />
            </div>
        );
    }

    return (
        <div className={`bg-gray-100 border border-gray-200 rounded-lg flex flex-col items-center justify-center relative overflow-hidden group ${format === 'banner' ? 'h-32 w-full' : 'h-64 w-full md:w-64'} ${className}`}>
            <span className="absolute top-2 right-2 text-[10px] text-gray-400 border border-gray-300 px-1 rounded uppercase tracking-wider">Publicité</span>
            <div className="text-gray-400 font-bold text-xl group-hover:scale-105 transition-transform">
                Espace Publicitaire
            </div>
            <div className="text-gray-400 text-sm mt-1">
                Disponible pour votre entreprise
            </div>
            <div className="text-gray-400 text-xs mt-2">
                Contacter Florian : florian@voisigo.com
            </div>
        </div>
    );
}
