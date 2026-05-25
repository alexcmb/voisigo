export interface User {
    id: string;
    name: string;
    email: string;
    bio?: string;
    avatarUrl?: string;
}

export interface Trip {
    id: string;
    driverId: string;
    driverName: string;
    departure: string;
    destination: string;
    departureLat?: number;
    departureLon?: number;
    destinationLat?: number;
    destinationLon?: number;
    date: string;
    price: number;
    seats: number;
    description?: string;
    completed?: number;
    createdAt: string;
    // Enriched fields (from API)
    availableSeats?: number;
    driverRating?: { avg: number; count: number } | null;
    pendingBookingsCount?: number;
}

export interface Service {
    id: string;
    authorId: string;
    authorName: string;
    type: 'request' | 'offer';
    category: 'courses' | 'bricolage' | 'jardinage' | 'visite' | 'autre';
    title: string;
    description: string;
    location?: string;
    lat?: number;
    lon?: number;
    price?: number;
    date: string;
    createdAt: string;
}

export type ServiceCategory = Service['category'];
export type ServiceType = Service['type'];

export const CATEGORY_EMOJIS: Record<ServiceCategory, string> = {
    courses: '🛒',
    bricolage: '🔨',
    jardinage: '🌻',
    visite: '☕',
    autre: '✨'
};

export interface Conversation {
    id: string;
    participants: string;
    relatedType?: string;
    relatedId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ConversationWithPreview extends Conversation {
    otherUserName: string;
    otherUserAvatar: string;
    lastMessage?: string;
    lastMessageAt?: string;
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    content: string;
    createdAt: string;
}

export interface AppNotification {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    relatedType?: string;
    relatedId?: string;
    read: number;
    createdAt: string;
}

export interface Review {
    id: string;
    reviewerId: string;
    reviewerName: string;
    targetUserId: string;
    rating: number;
    comment: string;
    relatedType?: string;
    relatedId?: string;
    createdAt: string;
}

export interface Booking {
    id: string;
    tripId: string;
    passengerId: string;
    passengerName: string;
    seats: number;
    status: string;
    createdAt: string;
    // Joined fields from trip
    departure?: string;
    destination?: string;
    date?: string;
    driverName?: string;
    price?: number;
}
