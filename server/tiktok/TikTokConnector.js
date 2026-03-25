/**
 * TikTok Live Connector
 * Uses tiktok-live-connector to capture live stream events
 */

const { WebcastPushConnection } = require('tiktok-live-connector');

class TikTokConnector {
    constructor(username, eventProcessor) {
        this.username = username.replace('@', '');
        this.eventProcessor = eventProcessor;
        this.connection = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            console.log(`[TikTok] Connecting to @${this.username}'s live stream...`);

            this.connection = new WebcastPushConnection(this.username, {
                sessionLengthInMinutes: 240,
                fetchExistingStreamEvents: true,
                enableWebsocketUpgrade: true,
                rtmpUrl: null,
                livehost: undefined,
            });

            // Setup event listeners
            this.setupEventListeners();

            // Connect
            await this.connection.connect();
            this.isConnected = true;

            console.log(`[TikTok] Successfully connected to @${this.username}`);
            
            return true;
        } catch (error) {
            console.error('[TikTok] Connection error:', error.message);
            throw error;
        }
    }

    setupEventListeners() {
        // Chat messages (comments)
        this.connection.on('chat', (data) => {
            const comment = {
                userId: data.user?.userId || 'unknown',
                username: data.uniqueId || data.commentUser?.uniqueId || 'anonymous',
                text: data.comment || '',
                // Display name from commenter
                nickname: data.nickname || data.commentUser?.nickname || 'Anonymous',
                // Profile picture
                avatar: data.user?.avatarThumb?.urlList?.[0] || null
            };
            
            this.eventProcessor.processComment(comment);
        });

        // Gift events
        this.connection.on('gift', (data) => {
            const gift = {
                userId: data.user?.userId || 'unknown',
                username: data.uniqueId || 'anonymous',
                nickname: data.nickname || 'Anonymous',
                giftName: data.giftName || 'Unknown',
                giftCount: data.repeatCount || 1,
                giftId: data.giftId,
                diamondCount: data.diamondCount || 0,
                // Whether this gift should trigger Mega Pet
                isViralGift: this.isViralGift(data.giftName, data.diamondCount)
            };
            
            this.eventProcessor.processGift(gift);
        });

        // Like events
        this.connection.on('like', (data) => {
            const likeEvent = {
                userId: data.user?.userId || 'unknown',
                username: data.uniqueId || 'anonymous',
                likeCount: data.likeCount || 1,
                // Cumulative likes for this stream
                totalLikes: data.totalLikedCount || 0
            };
            
            this.eventProcessor.processLikes(likeEvent.likeCount);
        });

        // Subscribe/Follow events
        this.connection.on('subscribe', (data) => {
            const subscriber = {
                userId: data.user?.userId || 'unknown',
                username: data.uniqueId || 'anonymous',
                nickname: data.nickname || 'Anonymous'
            };
            
            // Followers give a small buff to all pets
            this.eventProcessor.processFollow(subscriber);
        });

        // Share events
        this.connection.on('share', (data) => {
            const sharer = {
                username: data.uniqueId || 'anonymous'
            };
            
            // Shares spawn a special helper pet
            this.eventProcessor.processShare(sharer);
        });

        // Viewer's card (social peer)
        this.connection.on('social', (data) => {
            console.log('[TikTok] Social event:', data);
        });

        // Stream end
        this.connection.on('streamEnd', () => {
            console.log('[TikTok] Stream has ended');
            this.isConnected = false;
            // Attempt reconnection
            this.reconnect();
        });

        // Error handling
        this.connection.on('error', (error) => {
            console.error('[TikTok] WebSocket error:', error.message);
        });

        // Disconnect
        this.connection.on('disconnect', () => {
            console.log('[TikTok] Disconnected from live stream');
            this.isConnected = false;
        });
    }

    isViralGift(giftName, diamondCount) {
        // Viral gifts that trigger Mega Pet mode
        const viralGifts = [
            'Lion', 'Universe', 'Galaxy', 'Meteor', 
            'Dragon', 'Phoenix', 'Rainbow', 'Crown',
            'TikTok', 'Gold', 'Diamond'
        ];

        // Also trigger on gifts worth 3000+ diamonds
        const isHighValue = diamondCount >= 3000;

        return viralGifts.some(vg => 
            giftName?.toLowerCase().includes(vg.toLowerCase())
        ) || isHighValue;
    }

    async reconnect() {
        console.log('[TikTok] Attempting to reconnect in 10 seconds...');
        setTimeout(async () => {
            try {
                await this.connect();
            } catch (error) {
                console.error('[TikTok] Reconnection failed:', error.message);
                // Try again
                this.reconnect();
            }
        }, 10000);
    }

    disconnect() {
        if (this.connection) {
            this.connection.disconnect();
            this.isConnected = false;
            console.log('[TikTok] Disconnected');
        }
    }

    getStatus() {
        return {
            connected: this.isConnected,
            username: this.username,
            roomId: this.connection?.roomInfo?.roomId || null
        };
    }
}

module.exports = TikTokConnector;
