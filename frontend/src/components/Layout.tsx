import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
    children: React.ReactNode;
    showHeader?: boolean;
    showFooter?: boolean;
    className?: string;
}

export default function Layout({
    children,
    showHeader = true,
    showFooter = true,
    className = ''
}: LayoutProps) {
    return (
        <div className={`min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 font-sans flex flex-col ${className}`}>
            {showHeader && <Header />}
            <main className="flex-1">
                {children}
            </main>
            {showFooter && <Footer />}
        </div>
    );
}
