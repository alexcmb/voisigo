import { Pool } from 'pg';

// ─── Types ───────────────────────────────────────────────
export interface User {
    id: string;
    email: string;
    password: string;
    name: string;
    bio?: string;
    avatarUrl?: string;
    createdAt: string;
    isPremium?: boolean;
    isVerified?: boolean;
}

export interface Trip {
    id: string;
    driverId: string;
    driverName: string;
    departure: string;
    destination: string;
    departureLat?: number | null;
    departureLon?: number | null;
    destinationLat?: number | null;
    destinationLon?: number | null;
    date: string;
    price: number;
    seats: number;
    description?: string;
    completed?: boolean;
    createdAt: string;
}

export interface Service {
    id: string;
    authorId: string;
    authorName: string;
    type: 'request' | 'offer';
    category: 'courses' | 'bricolage' | 'jardinage' | 'visite' | 'autre';
    title: string;
    description: string;
    location?: string | null;
    lat?: number | null;
    lon?: number | null;
    price: number;
    date: string;
    createdAt: string;
}

export interface Conversation {
    id: string;
    participants: string; // JSON array of user IDs
    relatedType?: string;
    relatedId?: string;
    deletedBy?: string; // JSON array of user IDs
    createdAt: string;
    updatedAt: string;
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    content: string;
    createdAt: string;
}

export interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    relatedType?: string;
    relatedId?: string;
    read?: number | boolean;
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
}

// ─── Pool ─────────────────────────────────────────────────
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost')
        ? undefined
        : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
    console.error('Unexpected pg pool error:', err);
});

// ─── Helpers ──────────────────────────────────────────────
async function rows<T>(sql: string, params: any[] = []): Promise<T[]> {
    const result = await pool.query(sql, params);
    return result.rows as T[];
}

async function row<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    const result = await pool.query(sql, params);
    return result.rows[0] as T | undefined;
}

async function exec(sql: string, params: any[] = []): Promise<number> {
    const result = await pool.query(sql, params);
    return result.rowCount ?? 0;
}

// ─── Schema init ─────────────────────────────────────────
export const initDb = async (): Promise<void> => {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                bio TEXT DEFAULT '',
                "avatarUrl" TEXT DEFAULT '',
                "createdAt" TEXT NOT NULL,
                "isPremium" BOOLEAN DEFAULT FALSE,
                "isVerified" BOOLEAN DEFAULT FALSE
            )
        `);

        // Migration pour les tables existantes
        try {
            await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "isPremium" BOOLEAN DEFAULT FALSE');
            await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN DEFAULT FALSE');
        } catch (e) {
            console.log('Columns isPremium/isVerified already exist or alteration failed:', e);
        }

        await client.query(`
            CREATE TABLE IF NOT EXISTS trips (
                id TEXT PRIMARY KEY,
                "driverId" TEXT NOT NULL,
                "driverName" TEXT NOT NULL,
                departure TEXT NOT NULL,
                destination TEXT NOT NULL,
                "departureLat" DOUBLE PRECISION,
                "departureLon" DOUBLE PRECISION,
                "destinationLat" DOUBLE PRECISION,
                "destinationLon" DOUBLE PRECISION,
                date TEXT NOT NULL,
                price DOUBLE PRECISION NOT NULL,
                seats INTEGER NOT NULL,
                description TEXT DEFAULT '',
                "createdAt" TEXT NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                FOREIGN KEY ("driverId") REFERENCES users(id)
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS services (
                id TEXT PRIMARY KEY,
                "authorId" TEXT NOT NULL,
                "authorName" TEXT NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('request', 'offer')),
                category TEXT NOT NULL CHECK(category IN ('courses', 'bricolage', 'jardinage', 'visite', 'autre')),
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                location TEXT,
                lat DOUBLE PRECISION,
                lon DOUBLE PRECISION,
                date TEXT NOT NULL,
                "createdAt" TEXT NOT NULL,
                price DOUBLE PRECISION DEFAULT 0,
                FOREIGN KEY ("authorId") REFERENCES users(id)
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                participants TEXT NOT NULL,
                "relatedType" TEXT,
                "relatedId" TEXT,
                "createdAt" TEXT NOT NULL,
                "updatedAt" TEXT NOT NULL,
                "deletedBy" TEXT DEFAULT '[]'
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                "conversationId" TEXT NOT NULL,
                "senderId" TEXT NOT NULL,
                "senderName" TEXT NOT NULL,
                content TEXT NOT NULL,
                "createdAt" TEXT NOT NULL,
                FOREIGN KEY ("conversationId") REFERENCES conversations(id),
                FOREIGN KEY ("senderId") REFERENCES users(id)
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id TEXT PRIMARY KEY,
                "userId" TEXT NOT NULL,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                "relatedType" TEXT,
                "relatedId" TEXT,
                read BOOLEAN DEFAULT FALSE,
                "createdAt" TEXT NOT NULL,
                FOREIGN KEY ("userId") REFERENCES users(id)
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id TEXT PRIMARY KEY,
                "reviewerId" TEXT NOT NULL,
                "reviewerName" TEXT NOT NULL,
                "targetUserId" TEXT NOT NULL,
                rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
                comment TEXT DEFAULT '',
                "relatedType" TEXT,
                "relatedId" TEXT,
                "createdAt" TEXT NOT NULL,
                FOREIGN KEY ("reviewerId") REFERENCES users(id),
                FOREIGN KEY ("targetUserId") REFERENCES users(id)
            )
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                id TEXT PRIMARY KEY,
                "tripId" TEXT NOT NULL,
                "passengerId" TEXT NOT NULL,
                "passengerName" TEXT NOT NULL,
                seats INTEGER NOT NULL DEFAULT 1,
                status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'rejected', 'cancelled')),
                "createdAt" TEXT NOT NULL,
                FOREIGN KEY ("tripId") REFERENCES trips(id),
                FOREIGN KEY ("passengerId") REFERENCES users(id)
            )
        `);

        console.log('✅ Database schema ready');
    } finally {
        client.release();
    }
};

// ─── User queries ────────────────────────────────────────
export const findUserByEmail = (email: string): Promise<User | undefined> =>
    row<User>('SELECT * FROM users WHERE email = $1', [email]);

export const findUserById = (id: string): Promise<User | undefined> =>
    row<User>('SELECT * FROM users WHERE id = $1', [id]);

export const createUser = async (user: User): Promise<void> => {
    await exec(
        `INSERT INTO users (id, email, password, name, bio, "avatarUrl", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [user.id, user.email, user.password, user.name, user.bio ?? '', user.avatarUrl ?? '', user.createdAt]
    );
};

export const updateUser = async (id: string, fields: { name?: string; bio?: string; avatarUrl?: string }): Promise<void> => {
    const sets: string[] = [];
    const values: any[] = [];
    let n = 1;

    if (fields.name !== undefined)      { sets.push(`name = $${n++}`);          values.push(fields.name); }
    if (fields.bio !== undefined)       { sets.push(`bio = $${n++}`);           values.push(fields.bio); }
    if (fields.avatarUrl !== undefined) { sets.push(`"avatarUrl" = $${n++}`);   values.push(fields.avatarUrl); }

    if (sets.length > 0) {
        values.push(id);
        await exec(`UPDATE users SET ${sets.join(', ')} WHERE id = $${n}`, values);
    }
};

// ─── Trip queries ────────────────────────────────────────
export const getTrips = async (page = 1, limit = 20, driverId?: string): Promise<{ trips: Trip[]; total: number }> => {
    const offset = (page - 1) * limit;

    let trips: Trip[];
    let totalStr: string | undefined;

    if (driverId) {
        trips = await rows<Trip>(
            'SELECT * FROM trips WHERE "driverId" = $1 ORDER BY "createdAt" DESC LIMIT $2 OFFSET $3',
            [driverId, limit, offset]
        );
        const r = await row<{ count: string }>('SELECT COUNT(*)::TEXT as count FROM trips WHERE "driverId" = $1', [driverId]);
        totalStr = r?.count;
    } else {
        trips = await rows<Trip>('SELECT * FROM trips ORDER BY "createdAt" DESC LIMIT $1 OFFSET $2', [limit, offset]);
        const r = await row<{ count: string }>('SELECT COUNT(*)::TEXT as count FROM trips');
        totalStr = r?.count;
    }

    return { trips, total: parseInt(totalStr ?? '0', 10) };
};

export const findTripById = (id: string): Promise<Trip | undefined> =>
    row<Trip>('SELECT * FROM trips WHERE id = $1', [id]);

export const createTrip = async (trip: Trip): Promise<void> => {
    await exec(
        `INSERT INTO trips
            (id, "driverId", "driverName", departure, destination,
             "departureLat", "departureLon", "destinationLat", "destinationLon",
             date, price, seats, description, "createdAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [
            trip.id, trip.driverId, trip.driverName, trip.departure, trip.destination,
            trip.departureLat ?? null, trip.departureLon ?? null,
            trip.destinationLat ?? null, trip.destinationLon ?? null,
            trip.date, trip.price, trip.seats,
            trip.description ?? '', trip.createdAt,
        ]
    );
};

export const deleteTripById = async (id: string): Promise<boolean> => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM bookings WHERE "tripId" = $1', [id]);
        await client.query('DELETE FROM reviews WHERE "relatedType" = $1 AND "relatedId" = $2', ['trip', id]);
        await client.query('DELETE FROM notifications WHERE "relatedType" = $1 AND "relatedId" = $2', ['trip', id]);

        const convRows = await client.query<{ id: string }>(
            'SELECT id FROM conversations WHERE "relatedType" = $1 AND "relatedId" = $2', ['trip', id]
        );
        for (const conv of convRows.rows) {
            await client.query('DELETE FROM messages WHERE "conversationId" = $1', [conv.id]);
        }
        await client.query('DELETE FROM conversations WHERE "relatedType" = $1 AND "relatedId" = $2', ['trip', id]);

        const res = await client.query('DELETE FROM trips WHERE id = $1', [id]);
        await client.query('COMMIT');
        return (res.rowCount ?? 0) > 0;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

export const completeTripById = async (id: string): Promise<void> => {
    await exec('UPDATE trips SET completed = TRUE WHERE id = $1', [id]);
};

// ─── Service queries ─────────────────────────────────────
export const getServices = async (page = 1, limit = 20, authorId?: string): Promise<{ services: Service[]; total: number }> => {
    const offset = (page - 1) * limit;
    let services: Service[];
    let totalStr: string | undefined;

    if (authorId) {
        services = await rows<Service>(
            'SELECT s.*, u."isPremium" AS "authorIsPremium", u."isVerified" AS "authorIsVerified" FROM services s LEFT JOIN users u ON s."authorId" = u.id WHERE s."authorId" = $1 ORDER BY s."createdAt" DESC LIMIT $2 OFFSET $3',
            [authorId, limit, offset]
        );
        const r = await row<{ count: string }>('SELECT COUNT(*)::TEXT as count FROM services WHERE "authorId" = $1', [authorId]);
        totalStr = r?.count;
    } else {
        services = await rows<Service>('SELECT s.*, u."isPremium" AS "authorIsPremium", u."isVerified" AS "authorIsVerified" FROM services s LEFT JOIN users u ON s."authorId" = u.id ORDER BY s."createdAt" DESC LIMIT $1 OFFSET $2', [limit, offset]);
        const r = await row<{ count: string }>('SELECT COUNT(*)::TEXT as count FROM services');
        totalStr = r?.count;
    }

    return { services, total: parseInt(totalStr ?? '0', 10) };
};

export const findServiceById = (id: string): Promise<Service | undefined> =>
    row<Service>('SELECT s.*, u."isPremium" AS "authorIsPremium", u."isVerified" AS "authorIsVerified" FROM services s LEFT JOIN users u ON s."authorId" = u.id WHERE s.id = $1', [id]);

export const createService = async (service: Service): Promise<void> => {
    await exec(
        `INSERT INTO services
            (id, "authorId", "authorName", type, category, title, description, location, lat, lon, price, date, "createdAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [
            service.id, service.authorId, service.authorName, service.type, service.category,
            service.title, service.description,
            service.location ?? null, service.lat ?? null, service.lon ?? null,
            service.price ?? 0, service.date, service.createdAt,
        ]
    );
};

export const deleteServiceById = async (id: string): Promise<boolean> => {
    const n = await exec('DELETE FROM services WHERE id = $1', [id]);
    return n > 0;
};

// ─── Conversation queries ────────────────────────────────
export const findOrCreateConversation = async (
    id: string,
    userId1: string,
    userId2: string,
    relatedType?: string,
    relatedId?: string
): Promise<Conversation> => {
    const existing = await row<Conversation>(
        `SELECT * FROM conversations
         WHERE participants IN ($1, $2)
         AND ("relatedType" = $3 OR "relatedType" IS NULL)
         AND ("relatedId" = $4 OR "relatedId" IS NULL)`,
        [
            JSON.stringify([userId1, userId2]),
            JSON.stringify([userId2, userId1]),
            relatedType ?? null,
            relatedId ?? null,
        ]
    );
    if (existing) return existing;

    const now = new Date().toISOString();
    const conv: Conversation = {
        id,
        participants: JSON.stringify([userId1, userId2]),
        relatedType,
        relatedId,
        createdAt: now,
        updatedAt: now,
    };

    await exec(
        `INSERT INTO conversations (id, participants, "relatedType", "relatedId", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [conv.id, conv.participants, conv.relatedType ?? null, conv.relatedId ?? null, conv.createdAt, conv.updatedAt]
    );

    return conv;
};

export interface ConversationWithPreview extends Conversation {
    otherUserName: string;
    otherUserAvatar: string;
    lastMessage?: string;
    lastMessageAt?: string;
}

export const getConversationsForUser = async (userId: string): Promise<ConversationWithPreview[]> => {
    const convList = await rows<Conversation>(
        `SELECT * FROM conversations WHERE participants LIKE $1 ORDER BY "updatedAt" DESC`,
        [`%${userId}%`]
    );

    const visible = convList.filter(conv => {
        if (!conv.deletedBy) return true;
        try {
            const deletedBy = JSON.parse(conv.deletedBy);
            return !deletedBy.includes(userId);
        } catch {
            return true;
        }
    });

    const result: ConversationWithPreview[] = [];
    for (const conv of visible) {
        const participantIds: string[] = JSON.parse(conv.participants);
        const otherId = participantIds.find(p => p !== userId) ?? participantIds[0];
        const otherUser = await findUserById(otherId);

        const lastMsg = await row<{ content: string; createdAt: string }>(
            `SELECT content, "createdAt" FROM messages WHERE "conversationId" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
            [conv.id]
        );

        result.push({
            ...conv,
            otherUserName: otherUser?.name ?? 'Utilisateur inconnu',
            otherUserAvatar: otherUser?.avatarUrl ?? '',
            lastMessage: lastMsg?.content,
            lastMessageAt: lastMsg?.createdAt,
        });
    }

    return result;
};

export const getMessagesForConversation = (conversationId: string): Promise<Message[]> =>
    rows<Message>(
        `SELECT * FROM messages WHERE "conversationId" = $1 ORDER BY "createdAt" ASC`,
        [conversationId]
    );

export const createMessage = async (message: Message): Promise<void> => {
    await exec(
        `INSERT INTO messages (id, "conversationId", "senderId", "senderName", content, "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [message.id, message.conversationId, message.senderId, message.senderName, message.content, message.createdAt]
    );
    await exec(
        `UPDATE conversations SET "updatedAt" = $1 WHERE id = $2`,
        [message.createdAt, message.conversationId]
    );
};

export const findConversationById = (id: string): Promise<Conversation | undefined> =>
    row<Conversation>('SELECT * FROM conversations WHERE id = $1', [id]);

export const deleteConversations = async (conversationIds: string[], userId: string): Promise<void> => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const id of conversationIds) {
            const r = await client.query<{ id: string; deletedBy: string }>(
                'SELECT id, "deletedBy" FROM conversations WHERE id = $1', [id]
            );
            const conv = r.rows[0];
            if (conv) {
                let deletedBy: string[] = [];
                try { deletedBy = JSON.parse(conv.deletedBy ?? '[]'); } catch { /* ignore */ }
                if (!deletedBy.includes(userId)) {
                    deletedBy.push(userId);
                    await client.query(
                        'UPDATE conversations SET "deletedBy" = $1 WHERE id = $2',
                        [JSON.stringify(deletedBy), id]
                    );
                }
            }
        }
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// ─── Notification queries ────────────────────────────────
export const createNotification = async (notification: Notification): Promise<void> => {
    await exec(
        `INSERT INTO notifications (id, "userId", type, title, message, "relatedType", "relatedId", read, "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
            notification.id, notification.userId, notification.type,
            notification.title, notification.message,
            notification.relatedType ?? null, notification.relatedId ?? null,
            false, // always start as unread
            notification.createdAt,
        ]
    );
};

export const getNotificationsForUser = (userId: string): Promise<Notification[]> =>
    rows<Notification>(
        `SELECT * FROM notifications WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 50`,
        [userId]
    );

export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
    const r = await row<{ count: string }>(
        `SELECT COUNT(*)::TEXT as count FROM notifications WHERE "userId" = $1 AND read = FALSE`,
        [userId]
    );
    return parseInt(r?.count ?? '0', 10);
};

export const markNotificationRead = async (id: string, userId: string): Promise<void> => {
    await exec(
        `UPDATE notifications SET read = TRUE WHERE id = $1 AND "userId" = $2`,
        [id, userId]
    );
};

export const markAllNotificationsRead = async (userId: string): Promise<void> => {
    await exec(
        `UPDATE notifications SET read = TRUE WHERE "userId" = $1 AND read = FALSE`,
        [userId]
    );
};

// ─── Review queries ──────────────────────────────────────
export const createReview = async (review: Review): Promise<void> => {
    await exec(
        `INSERT INTO reviews (id, "reviewerId", "reviewerName", "targetUserId", rating, comment, "relatedType", "relatedId", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
            review.id, review.reviewerId, review.reviewerName, review.targetUserId,
            review.rating, review.comment ?? '',
            review.relatedType ?? null, review.relatedId ?? null,
            review.createdAt,
        ]
    );
};

export const getReviewsForUser = (targetUserId: string): Promise<Review[]> =>
    rows<Review>(
        `SELECT * FROM reviews WHERE "targetUserId" = $1 ORDER BY "createdAt" DESC`,
        [targetUserId]
    );

export const getAverageRating = async (targetUserId: string): Promise<{ avg: number; count: number }> => {
    const r = await row<{ avg: string | null; count: string }>(
        `SELECT ROUND(AVG(rating)::numeric, 1)::TEXT as avg, COUNT(*)::TEXT as count FROM reviews WHERE "targetUserId" = $1`,
        [targetUserId]
    );
    return {
        avg: r?.avg ? parseFloat(r.avg) : 0,
        count: parseInt(r?.count ?? '0', 10),
    };
};

export const hasAlreadyReviewed = async (reviewerId: string, relatedType: string, relatedId: string): Promise<boolean> => {
    const r = await row<{ count: string }>(
        `SELECT COUNT(*)::TEXT as count FROM reviews WHERE "reviewerId" = $1 AND "relatedType" = $2 AND "relatedId" = $3`,
        [reviewerId, relatedType, relatedId]
    );
    return parseInt(r?.count ?? '0', 10) > 0;
};

// ─── Booking queries ─────────────────────────────────────
export const createBooking = async (booking: Booking): Promise<void> => {
    await exec(
        `INSERT INTO bookings (id, "tripId", "passengerId", "passengerName", seats, status, "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [booking.id, booking.tripId, booking.passengerId, booking.passengerName,
         booking.seats ?? 1, booking.status, booking.createdAt]
    );
};

export const getBookingsForTrip = (tripId: string): Promise<Booking[]> =>
    rows<Booking>(
        `SELECT * FROM bookings WHERE "tripId" = $1 AND (status = 'confirmed' OR status = 'pending') ORDER BY "createdAt" ASC`,
        [tripId]
    );

export const getBookingsForUser = (passengerId: string): Promise<any[]> =>
    rows(
        `SELECT b.*, t.departure, t.destination, t.date, t."driverName", t.price
         FROM bookings b
         JOIN trips t ON b."tripId" = t.id
         WHERE b."passengerId" = $1 AND b.status = 'confirmed'
         ORDER BY t.date ASC`,
        [passengerId]
    );

export const getAvailableSeats = async (tripId: string): Promise<number> => {
    const trip = await findTripById(tripId);
    if (!trip) return 0;
    const r = await row<{ total: string | null }>(
        `SELECT SUM(seats)::TEXT as total FROM bookings WHERE "tripId" = $1 AND status = 'confirmed'`,
        [tripId]
    );
    return trip.seats - parseInt(r?.total ?? '0', 10);
};

export const hasAlreadyBooked = async (tripId: string, passengerId: string): Promise<boolean> => {
    const r = await row<{ count: string }>(
        `SELECT COUNT(*)::TEXT as count FROM bookings WHERE "tripId" = $1 AND "passengerId" = $2 AND status = 'confirmed'`,
        [tripId, passengerId]
    );
    return parseInt(r?.count ?? '0', 10) > 0;
};

export const findBookingById = (id: string): Promise<Booking | undefined> =>
    row<Booking>('SELECT * FROM bookings WHERE id = $1', [id]);

export const cancelBooking = async (id: string): Promise<void> => {
    await exec(`UPDATE bookings SET status = 'cancelled' WHERE id = $1`, [id]);
};

export const updateBookingStatus = async (id: string, status: string): Promise<void> => {
    await exec(`UPDATE bookings SET status = $1 WHERE id = $2`, [status, id]);
};

// ─── Enriched Trip queries ───────────────────────────────
export interface TripEnriched extends Trip {
    availableSeats: number;
    driverRatingAvg: number | null;
    driverRatingCount: number;
    pendingBookingsCount: number;
    driverIsPremium?: boolean;
    driverIsVerified?: boolean;
}

const ENRICHED_SQL = `
    SELECT
        t.*,
        u."isPremium" AS "driverIsPremium",
        u."isVerified" AS "driverIsVerified",
        (t.seats - COALESCE((
            SELECT SUM(b.seats) FROM bookings b
            WHERE b."tripId" = t.id AND b.status = 'confirmed'
        ), 0))::INTEGER AS "availableSeats",
        (SELECT ROUND(AVG(r.rating)::numeric, 1) FROM reviews r WHERE r."targetUserId" = t."driverId")::FLOAT AS "driverRatingAvg",
        (SELECT COUNT(*)::INTEGER FROM reviews r WHERE r."targetUserId" = t."driverId") AS "driverRatingCount",
        (SELECT COUNT(*)::INTEGER FROM bookings b WHERE b."tripId" = t.id AND b.status = 'pending') AS "pendingBookingsCount"
    FROM trips t
    LEFT JOIN users u ON t."driverId" = u.id
`;

export const getTripsEnriched = async (page = 1, limit = 20, driverId?: string): Promise<{ trips: TripEnriched[]; total: number }> => {
    const offset = (page - 1) * limit;
    let trips: TripEnriched[];
    let totalStr: string | undefined;

    if (driverId) {
        trips = await rows<TripEnriched>(
            `${ENRICHED_SQL} WHERE t."driverId" = $1 ORDER BY t."createdAt" DESC LIMIT $2 OFFSET $3`,
            [driverId, limit, offset]
        );
        const r = await row<{ count: string }>('SELECT COUNT(*)::TEXT as count FROM trips WHERE "driverId" = $1', [driverId]);
        totalStr = r?.count;
    } else {
        trips = await rows<TripEnriched>(
            `${ENRICHED_SQL} ORDER BY t."createdAt" DESC LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
        const r = await row<{ count: string }>('SELECT COUNT(*)::TEXT as count FROM trips');
        totalStr = r?.count;
    }

    return { trips, total: parseInt(totalStr ?? '0', 10) };
};

export const findTripEnrichedById = (id: string): Promise<TripEnriched | undefined> =>
    row<TripEnriched>(`${ENRICHED_SQL} WHERE t.id = $1`, [id]);

export const getDashboardStats = async (userId: string): Promise<{
    tripsCount: number;
    servicesCount: number;
    bookingsCount: number;
    avgRating: number;
    reviewsCount: number;
}> => {
    const trips = await row<{ count: string }>('SELECT COUNT(*) as count FROM trips WHERE "driverId" = $1', [userId]);
    const services = await row<{ count: string }>('SELECT COUNT(*) as count FROM services WHERE "authorId" = $1', [userId]);
    const bookings = await row<{ count: string }>('SELECT COUNT(*) as count FROM bookings WHERE "passengerId" = $1', [userId]);
    const rating = await getAverageRating(userId);

    return {
        tripsCount: parseInt(trips?.count || '0', 10),
        servicesCount: parseInt(services?.count || '0', 10),
        bookingsCount: parseInt(bookings?.count || '0', 10),
        avgRating: Math.round(rating.avg * 10) / 10,
        reviewsCount: rating.count,
    };
};

export const upgradeUserToPremium = async (userId: string, isPremium = true): Promise<void> => {
    await exec('UPDATE users SET "isPremium" = $1 WHERE id = $2', [isPremium, userId]);
};

export const verifyUserIdentity = async (userId: string, isVerified = true): Promise<void> => {
    await exec('UPDATE users SET "isVerified" = $1 WHERE id = $2', [isVerified, userId]);
};
