import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// ─── Types ───────────────────────────────────────────────
export interface User {
    id: string;
    email: string;
    password: string;
    name: string;
    bio?: string;
    avatarUrl?: string;
    createdAt: string;
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
    completed?: number; // 0 or 1
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
    location?: string;
    lat?: number;
    lon?: number;
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
    type: string; // 'new_message' | 'new_booking' | 'booking_cancelled' | 'new_review'
    title: string;
    message: string;
    relatedType?: string;
    relatedId?: string;
    read: number; // 0 or 1
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
    status: string; // 'pending' | 'confirmed' | 'rejected' | 'cancelled'
    createdAt: string;
}

// ─── Database setup ──────────────────────────────────────
const DB_DIR = path.join(__dirname, '..', '..', 'data');
const DB_PATH = path.join(DB_DIR, 'voisigo.db');
const JSON_PATH = path.join(DB_DIR, 'database.json');

if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ──────────────────────────────────────────────
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        bio TEXT DEFAULT '',
        avatarUrl TEXT DEFAULT '',
        createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS trips (
        id TEXT PRIMARY KEY,
        driverId TEXT NOT NULL,
        driverName TEXT NOT NULL,
        departure TEXT NOT NULL,
        destination TEXT NOT NULL,
        departureLat REAL,
        departureLon REAL,
        destinationLat REAL,
        destinationLon REAL,
        date TEXT NOT NULL,
        price REAL NOT NULL,
        seats INTEGER NOT NULL,
        description TEXT DEFAULT '',
        createdAt TEXT NOT NULL,
        FOREIGN KEY (driverId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS services (
        id TEXT PRIMARY KEY,
        authorId TEXT NOT NULL,
        authorName TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('request', 'offer')),
        category TEXT NOT NULL CHECK(category IN ('courses', 'bricolage', 'jardinage', 'visite', 'autre')),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        location TEXT,
        lat REAL,
        lon REAL,
        date TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (authorId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        participants TEXT NOT NULL,
        relatedType TEXT,
        relatedId TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversationId TEXT NOT NULL,
        senderId TEXT NOT NULL,
        senderName TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (conversationId) REFERENCES conversations(id),
        FOREIGN KEY (senderId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        relatedType TEXT,
        relatedId TEXT,
        read INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        reviewerId TEXT NOT NULL,
        reviewerName TEXT NOT NULL,
        targetUserId TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
        comment TEXT DEFAULT '',
        relatedType TEXT,
        relatedId TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (reviewerId) REFERENCES users(id),
        FOREIGN KEY (targetUserId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        tripId TEXT NOT NULL,
        passengerId TEXT NOT NULL,
        passengerName TEXT NOT NULL,
        seats INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'rejected', 'cancelled')),
        createdAt TEXT NOT NULL,
        FOREIGN KEY (tripId) REFERENCES trips(id),
        FOREIGN KEY (passengerId) REFERENCES users(id)
    );
`);

// ─── Migration from JSON ─────────────────────────────────
if (fs.existsSync(JSON_PATH)) {
    try {
        const jsonData = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
        const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

        if (userCount.count === 0) {
            console.log('Migrating data from database.json to SQLite...');

            const insertUser = db.prepare(`
                INSERT OR IGNORE INTO users (id, email, password, name, bio, avatarUrl, createdAt)
                VALUES (@id, @email, @password, @name, @bio, @avatarUrl, @createdAt)
            `);

            const insertTrip = db.prepare(`
                INSERT OR IGNORE INTO trips (id, driverId, driverName, departure, destination, departureLat, departureLon, destinationLat, destinationLon, date, price, seats, description, createdAt)
                VALUES (@id, @driverId, @driverName, @departure, @destination, @departureLat, @departureLon, @destinationLat, @destinationLon, @date, @price, @seats, @description, @createdAt)
            `);

            const insertService = db.prepare(`
                INSERT OR IGNORE INTO services (id, authorId, authorName, type, category, title, description, location, lat, lon, date, createdAt)
                VALUES (@id, @authorId, @authorName, @type, @category, @title, @description, @location, @lat, @lon, @date, @createdAt)
            `);

            const migrate = db.transaction(() => {
                for (const user of (jsonData.users || [])) {
                    insertUser.run({
                        id: user.id,
                        email: user.email,
                        password: user.password,
                        name: user.name,
                        bio: user.bio || '',
                        avatarUrl: user.avatarUrl || '',
                        createdAt: user.createdAt,
                    });
                }
                for (const trip of (jsonData.trips || [])) {
                    insertTrip.run({
                        id: trip.id,
                        driverId: trip.driverId,
                        driverName: trip.driverName,
                        departure: trip.departure,
                        destination: trip.destination,
                        departureLat: trip.departureLat || null,
                        departureLon: trip.departureLon || null,
                        destinationLat: trip.destinationLat || null,
                        destinationLon: trip.destinationLon || null,
                        date: trip.date,
                        price: trip.price,
                        seats: trip.seats,
                        description: trip.description || '',
                        createdAt: trip.createdAt,
                    });
                }
                for (const service of (jsonData.services || [])) {
                    insertService.run({
                        id: service.id,
                        authorId: service.authorId,
                        authorName: service.authorName,
                        type: service.type,
                        category: service.category,
                        title: service.title,
                        description: service.description,
                        location: service.location || null,
                        lat: service.lat || null,
                        lon: service.lon || null,
                        date: service.date,
                        createdAt: service.createdAt,
                    });
                }
            });

            migrate();
            console.log('Migration complete! Renaming database.json to database.json.bak');
            fs.renameSync(JSON_PATH, JSON_PATH + '.bak');
        }
    } catch (err) {
        console.error('Migration error:', err);
    }
}

// ─── Migrations ──────────────────────────────────────────
try {
    db.exec(`ALTER TABLE trips ADD COLUMN completed INTEGER DEFAULT 0`);
} catch {
    // Column already exists
}

try {
    db.exec(`ALTER TABLE services ADD COLUMN location TEXT`);
    db.exec(`ALTER TABLE services ADD COLUMN lat REAL`);
    db.exec(`ALTER TABLE services ADD COLUMN lon REAL`);
} catch {
    // Columns already exist
}

try {
    db.exec(`ALTER TABLE services ADD COLUMN price REAL DEFAULT 0`);
} catch {
    // Column already exists
}

try {
    const tableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='bookings'").get() as { sql: string };
    if (tableInfo && !tableInfo.sql.includes("'pending'")) {
        console.log("Migrating bookings table constraint...");
        db.transaction(() => {
            db.prepare("ALTER TABLE bookings RENAME TO bookings_old").run();
            db.prepare(`
                CREATE TABLE bookings (
                    id TEXT PRIMARY KEY,
                    tripId TEXT NOT NULL,
                    passengerId TEXT NOT NULL,
                    passengerName TEXT NOT NULL,
                    seats INTEGER NOT NULL DEFAULT 1,
                    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'rejected', 'cancelled')),
                    createdAt TEXT NOT NULL,
                    FOREIGN KEY (tripId) REFERENCES trips(id),
                    FOREIGN KEY (passengerId) REFERENCES users(id)
                )
            `).run();
            // Copy data. Note: Old schema might not have 'seats' column if it's very old, but we added a column migration above.
            // However, the column migration above runs BEFORE this.
            // So bookings_old SHOULD have 'seats'.
            // But if the previous run failed to add column because of constraint?
            // SQLite allows ADD COLUMN even with CHECK constraints usually.
            // Let's assume 'seats' exists or default to 1.

            // transform records
            const oldBookings = db.prepare("SELECT * FROM bookings_old").all() as any[];
            const insert = db.prepare(`
                INSERT INTO bookings (id, tripId, passengerId, passengerName, seats, status, createdAt)
                VALUES (@id, @tripId, @passengerId, @passengerName, @seats, @status, @createdAt)
            `);
            for (const b of oldBookings) {
                insert.run({
                    ...b,
                    seats: b.seats || 1,
                    status: b.status // preserve status
                });
            }
            db.prepare("DROP TABLE bookings_old").run();
        })();
        console.log("Bookings table migration complete.");
    }
} catch (error) {
    console.error("Migration error (bookings constraint):", error);
}

try {
    db.exec(`ALTER TABLE bookings ADD COLUMN seats INTEGER DEFAULT 1`);
} catch {
    // Column already exists
}

try {
    db.exec(`ALTER TABLE conversations ADD COLUMN deletedBy TEXT DEFAULT '[]'`);
} catch {
    // Column already exists
}

// ─── User queries ────────────────────────────────────────
export const findUserByEmail = (email: string): User | undefined => {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
};

export const findUserById = (id: string): User | undefined => {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
};

export const createUser = (user: User): void => {
    db.prepare(`
        INSERT INTO users (id, email, password, name, bio, avatarUrl, createdAt)
        VALUES (@id, @email, @password, @name, @bio, @avatarUrl, @createdAt)
    `).run(user);
};

export const updateUser = (id: string, fields: { name?: string; bio?: string; avatarUrl?: string }): void => {
    const sets: string[] = [];
    const values: any = { id };

    if (fields.name !== undefined) { sets.push('name = @name'); values.name = fields.name; }
    if (fields.bio !== undefined) { sets.push('bio = @bio'); values.bio = fields.bio; }
    if (fields.avatarUrl !== undefined) { sets.push('avatarUrl = @avatarUrl'); values.avatarUrl = fields.avatarUrl; }

    if (sets.length > 0) {
        db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = @id`).run(values);
    }
};

// ─── Trip queries ────────────────────────────────────────
export const getTrips = (page = 1, limit = 20, driverId?: string): { trips: Trip[], total: number } => {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM trips';
    let countQuery = 'SELECT COUNT(*) as count FROM trips';
    const params: any[] = [];

    if (driverId) {
        query += ' WHERE driverId = ?';
        countQuery += ' WHERE driverId = ?';
        params.push(driverId);
    }

    query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const trips = db.prepare(query).all(...params) as Trip[];
    const count = db.prepare(countQuery).get(driverId ? [driverId] : []) as { count: number };
    return { trips, total: count.count };
};

export const findTripById = (id: string): Trip | undefined => {
    return db.prepare('SELECT * FROM trips WHERE id = ?').get(id) as Trip | undefined;
};

export const createTrip = (trip: Trip): void => {
    db.prepare(`
        INSERT INTO trips (id, driverId, driverName, departure, destination, departureLat, departureLon, destinationLat, destinationLon, date, price, seats, description, createdAt)
        VALUES (@id, @driverId, @driverName, @departure, @destination, @departureLat, @departureLon, @destinationLat, @destinationLon, @date, @price, @seats, @description, @createdAt)
    `).run({
        ...trip,
        departureLat: trip.departureLat || null,
        departureLon: trip.departureLon || null,
        destinationLat: trip.destinationLat || null,
        destinationLon: trip.destinationLon || null,
        description: trip.description || '',
    });
};

export const deleteTripById = (id: string): boolean => {
    const deleteTx = db.transaction(() => {
        // 1. Delete bookings
        db.prepare('DELETE FROM bookings WHERE tripId = ?').run(id);

        // 2. Delete reviews linked to this trip
        db.prepare('DELETE FROM reviews WHERE relatedType = ? AND relatedId = ?').run('trip', id);

        // 3. Delete notifications linked to this trip
        db.prepare('DELETE FROM notifications WHERE relatedType = ? AND relatedId = ?').run('trip', id);

        // 4. Delete conversations linked to this trip (and their messages)
        const conversations = db.prepare('SELECT id FROM conversations WHERE relatedType = ? AND relatedId = ?').all('trip', id) as { id: string }[];
        const deleteMessages = db.prepare('DELETE FROM messages WHERE conversationId = ?');
        for (const conv of conversations) {
            deleteMessages.run(conv.id);
        }
        db.prepare('DELETE FROM conversations WHERE relatedType = ? AND relatedId = ?').run('trip', id);

        // 5. Delete the trip
        const result = db.prepare('DELETE FROM trips WHERE id = ?').run(id);
        return result.changes > 0;
    });

    return deleteTx();
};

export const completeTripById = (id: string): void => {
    db.prepare('UPDATE trips SET completed = 1 WHERE id = ?').run(id);
};

// ─── Service queries ─────────────────────────────────────
export const getServices = (page = 1, limit = 20, authorId?: string): { services: Service[], total: number } => {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM services';
    let countQuery = 'SELECT COUNT(*) as count FROM services';
    const params: any[] = [];

    if (authorId) {
        query += ' WHERE authorId = ?';
        countQuery += ' WHERE authorId = ?';
        params.push(authorId);
    }

    query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const services = db.prepare(query).all(...params) as Service[];
    const count = db.prepare(countQuery).get(authorId ? [authorId] : []) as { count: number };
    return { services, total: count.count };
};

export const findServiceById = (id: string): Service | undefined => {
    return db.prepare('SELECT * FROM services WHERE id = ?').get(id) as Service | undefined;
};

export const createService = (service: Service): void => {
    db.prepare(`
        INSERT INTO services (id, authorId, authorName, type, category, title, description, location, lat, lon, price, date, createdAt)
        VALUES (@id, @authorId, @authorName, @type, @category, @title, @description, @location, @lat, @lon, @price, @date, @createdAt)
    `).run({
        ...service,
        location: service.location || null,
        lat: service.lat || null,
        lon: service.lon || null,
        price: service.price || 0,
    });
};

export const deleteServiceById = (id: string): boolean => {
    const result = db.prepare('DELETE FROM services WHERE id = ?').run(id);
    return result.changes > 0;
};

// ─── Conversation queries ────────────────────────────────
export const findOrCreateConversation = (
    id: string,
    userId1: string,
    userId2: string,
    relatedType?: string,
    relatedId?: string
): Conversation => {
    // Check if a conversation already exists between these 2 users for this context
    const existing = db.prepare(`
        SELECT * FROM conversations
        WHERE participants IN (?, ?)
        AND (relatedType = ? OR relatedType IS NULL)
        AND (relatedId = ? OR relatedId IS NULL)
    `).get(
        JSON.stringify([userId1, userId2]),
        JSON.stringify([userId2, userId1]),
        relatedType || null,
        relatedId || null,
    ) as Conversation | undefined;

    if (existing) return existing;

    const now = new Date().toISOString();
    const conv: Conversation = {
        id,
        participants: JSON.stringify([userId1, userId2]),
        relatedType: relatedType || undefined,
        relatedId: relatedId || undefined,
        createdAt: now,
        updatedAt: now,
    };

    db.prepare(`
        INSERT INTO conversations (id, participants, relatedType, relatedId, createdAt, updatedAt)
        VALUES (@id, @participants, @relatedType, @relatedId, @createdAt, @updatedAt)
    `).run({
        ...conv,
        relatedType: conv.relatedType || null,
        relatedId: conv.relatedId || null,
    });

    return conv;
};

export interface ConversationWithPreview {
    id: string;
    participants: string;
    relatedType?: string;
    relatedId?: string;
    createdAt: string;
    updatedAt: string;
    otherUserName: string;
    otherUserAvatar: string;
    lastMessage?: string;
    lastMessageAt?: string;
}

export const getConversationsForUser = (userId: string): ConversationWithPreview[] => {
    const conversations = db.prepare(`
        SELECT * FROM conversations
        WHERE participants LIKE ?
        ORDER BY updatedAt DESC
    `).all(`%${userId}%`) as Conversation[];

    return conversations
        .filter(conv => {
            if (!conv.deletedBy) return true;
            try {
                const deletedBy = JSON.parse(conv.deletedBy);
                return !deletedBy.includes(userId);
            } catch {
                return true;
            }
        })
        .map(conv => {
            const participantIds: string[] = JSON.parse(conv.participants);
            const otherId = participantIds.find(p => p !== userId) || participantIds[0];
            const otherUser = findUserById(otherId);

            const lastMsg = db.prepare(`
            SELECT content, createdAt FROM messages
            WHERE conversationId = ?
            ORDER BY createdAt DESC LIMIT 1
        `).get(conv.id) as { content: string; createdAt: string } | undefined;

            return {
                ...conv,
                otherUserName: otherUser?.name || 'Utilisateur inconnu',
                otherUserAvatar: otherUser?.avatarUrl || '',
                lastMessage: lastMsg?.content,
                lastMessageAt: lastMsg?.createdAt,
            };
        });
};

export const getMessagesForConversation = (conversationId: string): Message[] => {
    return db.prepare(`
        SELECT * FROM messages
        WHERE conversationId = ?
        ORDER BY createdAt ASC
    `).all(conversationId) as Message[];
};

export const createMessage = (message: Message): void => {
    db.prepare(`
        INSERT INTO messages (id, conversationId, senderId, senderName, content, createdAt)
        VALUES (@id, @conversationId, @senderId, @senderName, @content, @createdAt)
    `).run(message);

    // Update conversation updatedAt
    db.prepare(`
        UPDATE conversations SET updatedAt = ? WHERE id = ?
    `).run(message.createdAt, message.conversationId);
};

export const findConversationById = (id: string): Conversation | undefined => {
    return db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) as Conversation | undefined;
};

export const deleteConversations = (conversationIds: string[], userId: string): void => {
    const getDeletedBy = db.prepare('SELECT id, deletedBy FROM conversations WHERE id = ?');
    const updateDeletedBy = db.prepare('UPDATE conversations SET deletedBy = ? WHERE id = ?');

    db.transaction(() => {
        for (const id of conversationIds) {
            const conv = getDeletedBy.get(id) as { id: string, deletedBy: string } | undefined;
            if (conv) {
                let deletedBy: string[] = [];
                try {
                    deletedBy = JSON.parse(conv.deletedBy || '[]');
                } catch { }

                if (!deletedBy.includes(userId)) {
                    deletedBy.push(userId);
                    updateDeletedBy.run(JSON.stringify(deletedBy), id);
                }
            }
        }
    })();
};

// ─── Notification queries ────────────────────────────────
export const createNotification = (notification: Notification): void => {
    db.prepare(`
        INSERT INTO notifications (id, userId, type, title, message, relatedType, relatedId, read, createdAt)
        VALUES (@id, @userId, @type, @title, @message, @relatedType, @relatedId, @read, @createdAt)
    `).run({
        ...notification,
        relatedType: notification.relatedType || null,
        relatedId: notification.relatedId || null,
    });
};

export const getNotificationsForUser = (userId: string): Notification[] => {
    return db.prepare(`
        SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 50
    `).all(userId) as Notification[];
};

export const getUnreadNotificationCount = (userId: string): number => {
    const result = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND read = 0').get(userId) as { count: number };
    return result.count;
};

export const markNotificationRead = (id: string, userId: string): void => {
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND userId = ?').run(id, userId);
};

export const markAllNotificationsRead = (userId: string): void => {
    db.prepare('UPDATE notifications SET read = 1 WHERE userId = ? AND read = 0').run(userId);
};

// ─── Review queries ──────────────────────────────────────
export const createReview = (review: Review): void => {
    db.prepare(`
        INSERT INTO reviews (id, reviewerId, reviewerName, targetUserId, rating, comment, relatedType, relatedId, createdAt)
        VALUES (@id, @reviewerId, @reviewerName, @targetUserId, @rating, @comment, @relatedType, @relatedId, @createdAt)
    `).run({
        ...review,
        relatedType: review.relatedType || null,
        relatedId: review.relatedId || null,
        comment: review.comment || '',
    });
};

export const getReviewsForUser = (targetUserId: string): Review[] => {
    return db.prepare('SELECT * FROM reviews WHERE targetUserId = ? ORDER BY createdAt DESC').all(targetUserId) as Review[];
};

export const getAverageRating = (targetUserId: string): { avg: number; count: number } => {
    const result = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE targetUserId = ?').get(targetUserId) as { avg: number | null; count: number };
    return { avg: result.avg || 0, count: result.count };
};

export const hasAlreadyReviewed = (reviewerId: string, relatedType: string, relatedId: string): boolean => {
    const result = db.prepare('SELECT COUNT(*) as count FROM reviews WHERE reviewerId = ? AND relatedType = ? AND relatedId = ?').get(reviewerId, relatedType, relatedId) as { count: number };
    return result.count > 0;
};

// ─── Booking queries ─────────────────────────────────────
export const createBooking = (booking: Booking): void => {
    db.prepare(`
        INSERT INTO bookings (id, tripId, passengerId, passengerName, seats, status, createdAt)
        VALUES (@id, @tripId, @passengerId, @passengerName, @seats, @status, @createdAt)
    `).run({
        ...booking,
        seats: booking.seats || 1,
    });
};

export const getBookingsForTrip = (tripId: string): Booking[] => {
    return db.prepare('SELECT * FROM bookings WHERE tripId = ? AND (status = ? OR status = ?) ORDER BY createdAt ASC').all(tripId, 'confirmed', 'pending') as Booking[];
};

export const getBookingsForUser = (passengerId: string): Booking[] => {
    return db.prepare(`
        SELECT b.*, t.departure, t.destination, t.date, t.driverName, t.price
        FROM bookings b
        JOIN trips t ON b.tripId = t.id
        WHERE b.passengerId = ? AND b.status = 'confirmed'
        ORDER BY t.date ASC
    `).all(passengerId) as any[];
};

export const getAvailableSeats = (tripId: string): number => {
    const trip = findTripById(tripId);
    if (!trip) return 0;
    const booked = db.prepare('SELECT SUM(seats) as total FROM bookings WHERE tripId = ? AND status = ?').get(tripId, 'confirmed') as { total: number | null };
    return trip.seats - (booked.total || 0);
};

export const hasAlreadyBooked = (tripId: string, passengerId: string): boolean => {
    const result = db.prepare('SELECT COUNT(*) as count FROM bookings WHERE tripId = ? AND passengerId = ? AND status = ?').get(tripId, passengerId, 'confirmed') as { count: number };
    return result.count > 0;
};

export const findBookingById = (id: string): Booking | undefined => {
    return db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as Booking | undefined;
};

export const cancelBooking = (id: string): void => {
    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run('cancelled', id);
};

export const updateBookingStatus = (id: string, status: string): void => {
    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, id);
};

// ─── Enriched Trip queries ───────────────────────────────
export interface TripEnriched extends Trip {
    availableSeats: number;
    driverRatingAvg: number | null;
    driverRatingCount: number;
    pendingBookingsCount: number;
}

const ENRICHED_TRIP_SELECT = `
    SELECT
        t.*,
        (t.seats - COALESCE((
            SELECT SUM(b.seats) FROM bookings b
            WHERE b.tripId = t.id AND b.status = 'confirmed'
        ), 0)) as availableSeats,
        (SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.targetUserId = t.driverId) as driverRatingAvg,
        (SELECT COUNT(*) FROM reviews r WHERE r.targetUserId = t.driverId) as driverRatingCount,
        (SELECT COUNT(*) FROM bookings b WHERE b.tripId = t.id AND b.status = 'pending') as pendingBookingsCount
    FROM trips t
`;

export const getTripsEnriched = (page = 1, limit = 20, driverId?: string): { trips: TripEnriched[], total: number } => {
    const offset = (page - 1) * limit;
    const whereClause = driverId ? 'WHERE t.driverId = ?' : '';
    const countWhere = driverId ? 'WHERE driverId = ?' : '';

    const query = `${ENRICHED_TRIP_SELECT} ${whereClause} ORDER BY t.createdAt DESC LIMIT ? OFFSET ?`;
    const countQuery = `SELECT COUNT(*) as count FROM trips ${countWhere}`;

    const trips = driverId
        ? db.prepare(query).all(driverId, limit, offset) as TripEnriched[]
        : db.prepare(query).all(limit, offset) as TripEnriched[];

    const count = driverId
        ? db.prepare(countQuery).get(driverId) as { count: number }
        : db.prepare(countQuery).get() as { count: number };

    return { trips, total: count.count };
};

export const findTripEnrichedById = (id: string): TripEnriched | undefined => {
    return db.prepare(`${ENRICHED_TRIP_SELECT} WHERE t.id = ?`).get(id) as TripEnriched | undefined;
};

