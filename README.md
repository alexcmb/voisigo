# VoisiGO

Application d'entraide et de covoiturage local.

## Fonctionnalités
- **Covoiturage** : Proposez ou recherchez des trajets.
- **Entraide (Services)** : Demandes et offres de services (bricolage, courses, etc.).
- **Géolocalisation** : Recherche par rayon et carte interactive.
- **Messagerie** : Discutez avec vos voisins.
- **Système de Réservation** : Gérez les places et les demandes.

## Installation

### Prérequis
- Node.js (v18+)
- SQLite (géré via `better-sqlite3`)

### Démarrage

1. **Backend**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   Le serveur démarre sur `http://localhost:3000`.

2. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   L'application est accessible sur `http://localhost:5173` (ou votre IP locale).

---

## Gestion des Publicités

L'application intègre des espaces publicitaires de démonstration ("encarts").
Pour personnaliser ces publicités (ajouter une vraie image, changer le texte ou le lien), modifiez le composant `AdBanner`.

### Fichier à modifier
`frontend/src/components/AdBanner.tsx`

### Exemple de personnalisation

Pour afficher une image à la place du bloc gris :

```tsx
export default function AdBanner({ format = 'banner', className = '' }: { format?: 'square' | 'banner', className?: string }) {
    // URL de votre image publicitaire
    const adImageUrl = "https://example.com/ma-pub.jpg";
    const adLink = "https://mon-partenaire.com";

    return (
        <a href={adLink} target="_blank" rel="noopener noreferrer" className={`block relative overflow-hidden group rounded-lg ${format === 'banner' ? 'h-32 w-full' : 'h-64 w-full md:w-64'} ${className}`}>
             {/* Badge "Publicité" */}
            <span className="absolute top-2 right-2 z-10 text-[10px] bg-white/80 px-1 rounded uppercase tracking-wider text-gray-600">Publicité</span>
            
            {/* Image */}
            <img 
                src={adImageUrl} 
                alt="Publicité" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
        </a>
    );
}
```

### Emplacements actuels
- **Fil d'actualité (Explore)** : Haut de page.
- **Tableau de bord** : Entre les sections "Covoiturage" et "Entraide".
