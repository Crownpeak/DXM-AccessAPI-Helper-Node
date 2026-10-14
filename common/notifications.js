//@ts-check
const Util = require("./util");

/*
 * The CMS pushes compile results (and a few other things) to the browser UI over a Pusher
 * WebSocket rather than returning them from the save call. This module subscribes to the same
 * channel so a Node client can see them too, which is what makes it possible to find out whether
 * a code save compiled without polling a slow recompile endpoint.
 *
 * The flow, all verified against a live CMS:
 *   1. POST /Sockets/PusherInfo          -> ourUniqueId (and, for the UI, appKey + authEndpoint)
 *   2. POST /Sockets/PusherAuth          -> { auth: "<appKey>:<signature>" } for one channel
 *   3. wss://ws.pusherapp.com/app/<appKey>
 *   4. pusher:subscribe with the signature from step 2 for the connection's socket_id
 *   5. event "notify-event" carries { message: "<json string>" }, whose JSON is
 *      { serverNumber, message: "CompilationSucceeded" | "CompilationFailed", rawData, notificationType }
 *      rawData is null on success and holds the compiler output on failure.
 */

// Pusher's default cluster, which is what the CMS UI connects to.
const SOCKET_HOST = "ws.pusherapp.com";
const SOCKET_PORT = 443;
// Pusher wire protocol version; 7 is what the UI's client negotiates.
const PROTOCOL = 7;
// The UI builds its channel as "private-ui" + ourUniqueId + instance. The "ui" is part of the
// prefix, not a typo: subscribing to "private-" + ourUniqueId + instance is accepted and signed
// quite happily by the CMS, but no event is ever published to it (verified by subscribing to both
// at once - only the "private-ui" one received anything).
const CHANNEL_PREFIX = "private-ui";
const NOTIFY_EVENT = "notify-event";
const COMPILE_SUCCEEDED = "CompilationSucceeded";
const COMPILE_FAILED = "CompilationFailed";

/**
 * A live subscription to the CMS notification channel for the logged-in user.
 */
class Notifications {

    constructor(api) {
        this._api = api;
        this._socket = null;
        this._channel = null;
        this._handlers = [];
        this._closeHandlers = [];
    }

    /**
     * The result shape returned by waitForCompilation, in one place so that every path - a real
     * result, a timeout, and a socket we could not use - returns the same set of properties.
     * @param {object=} values  properties to override on the "nothing known" default
     */
    static compilationResult(values = {}) {
        return Object.assign({
            succeeded: null,        // true | false, or null when no verdict was received
            message: null,          // "CompilationSucceeded" | "CompilationFailed"
            rawData: null,          // compiler output when a compile failed
            serverNumber: null,
            timedOut: false,        // listening worked, but nothing arrived in time
            unavailable: false,     // could not listen at all; the compile result is unknown
            error: null             // why it was unavailable
        }, values);
    }

    get isConnected() {
        return this._socket !== null && this._socket.readyState === 1;
    }

    get channel() {
        return this._channel;
    }

    /**
     * Register a function to be called with every notification that arrives. The argument is the
     * decoded inner message, e.g.
     * { serverNumber: "WEB-3", message: "CompilationSucceeded", rawData: null, notificationType: 2 }
     * @param {function(object)} handler
     */
    on(handler) {
        this._handlers.push(handler);
    }

    /**
     * @param {function(object)} handler  a function previously passed to on()
     */
    off(handler) {
        this._handlers = this._handlers.filter(h => h !== handler);
    }

    /**
     * Connect to the notification socket and subscribe to this user's private channel. Resolves
     * once the subscription has been accepted, so a caller that subscribes before triggering a
     * save cannot miss the resulting notification.
     * @param {number=} timeoutMs  how long to wait for the subscription (defaults to 15000)
     */
    async connect(timeoutMs = 15000) {
        if (this.isConnected) {
            return;
        }
        if (!this._api.isAuthenticated) {
            throw new Error("Notifications.connect requires a logged-in session; call login() or setSession() first");
        }

        const info = await Util.makeCall(this._api, "/Sockets/PusherInfo", {});
        if (!info.isSuccessful) {
            throw new Error("Unable to read socket details: " + (info.errorMessage || info.resultCode));
        }
        this._channel = CHANNEL_PREFIX + info.ourUniqueId + this._api.instance;

        // The UI reads its app key from PusherInfo, but that field comes back empty for a session
        // authenticated with an API key (verified repeatedly, with every body shape, while the
        // same call in a browser session returned a key). The app key is also the part of the
        // Pusher auth string before the colon, so sign a throwaway socket id purely to read it.
        // If a future CMS build populates appKey, that is used instead and no extra call is made.
        let appKey = info.appKey;
        if (!appKey) {
            const bootstrap = await this._authorise("0.0");
            appKey = String(bootstrap.auth).split(":")[0];
        }
        if (!appKey) {
            throw new Error("Unable to determine the notification app key for this instance");
        }

        const url = "wss://" + SOCKET_HOST + ":" + SOCKET_PORT + "/app/" + appKey +
            "?protocol=" + PROTOCOL + "&client=crownpeak-dxm-accessapi-helper&version=" + require("../package.json").version;

        await new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.disconnect();
                reject(new Error("Timed out after " + timeoutMs + "ms subscribing to the notification channel"));
            }, timeoutMs);

            const settle = (error) => {
                clearTimeout(timer);
                if (error) {
                    // Past the first call this rejects an already-settled promise, which does
                    // nothing - but the disconnect still matters, because a socket that drops
                    // after connect() resolved has to release anything waiting on it.
                    this.disconnect(error.message);
                    reject(error);
                } else {
                    resolve(undefined);
                }
            };

            const socket = new WebSocket(url);
            this._socket = socket;

            socket.addEventListener("error", () => settle(new Error("Unable to connect to the notification socket at " + SOCKET_HOST)));
            socket.addEventListener("close", event => settle(new Error("Notification socket closed: " + event.code + (event.reason ? " " + event.reason : ""))));
            socket.addEventListener("message", async event => {
                let frame;
                try {
                    frame = JSON.parse(event.data);
                } catch (e) {
                    return; // Not something we can act on; the protocol is JSON throughout.
                }
                try {
                    await this._handleFrame(frame, settle);
                } catch (error) {
                    settle(error);
                }
            });
        });
    }

    /**
     * Close the socket. Safe to call when not connected.
     * @param {string=} reason  reported to anything currently waiting on the channel
     */
    disconnect(reason = "The notification channel was disconnected") {
        if (this._socket !== null) {
            const socket = this._socket;
            this._socket = null;
            try {
                socket.close();
            } catch (e) {
                // Already closing or closed; nothing useful to do.
            }
        }
        this._notifyClosed(reason);
    }

    /**
     * @param {function(string)} handler  called when the socket closes, with the reason
     */
    _onClose(handler) {
        this._closeHandlers.push(handler);
    }

    _offClose(handler) {
        this._closeHandlers = this._closeHandlers.filter(h => h !== handler);
    }

    _notifyClosed(reason) {
        const handlers = this._closeHandlers;
        this._closeHandlers = [];
        for (const handler of handlers) {
            handler(reason);
        }
    }

    /**
     * Wait for the next compile result to arrive on the channel.
     *
     * The notification does not say which asset it belongs to, so this is "the next compile
     * result", not "the compile result for my save". The channel belongs to one user, so another
     * user's work cannot show up here, but a compile the same user triggers elsewhere (a second
     * save from this process, or one from their browser) can. Subscribe, save, and wait one at a
     * time if that matters.
     *
     * @param {number=} timeoutMs  how long to wait (defaults to 30000)
     * @returns {Promise<object>} see Notifications.compilationResult
     */
    async waitForCompilation(timeoutMs = 30000) {
        if (!this.isConnected) {
            return Notifications.compilationResult({
                unavailable: true,
                error: "Not connected to the notification channel"
            });
        }
        return await new Promise(resolve => {
            const finish = result => {
                clearTimeout(timer);
                this.off(handler);
                this._offClose(onClose);
                resolve(result);
            };
            const handler = notification => {
                if (notification.message !== COMPILE_SUCCEEDED && notification.message !== COMPILE_FAILED) {
                    return; // Thumbnails and other notices share this channel.
                }
                finish(Notifications.compilationResult({
                    succeeded: notification.message === COMPILE_SUCCEEDED,
                    message: notification.message,
                    rawData: notification.rawData,
                    serverNumber: notification.serverNumber
                }));
            };
            // If the socket goes away while we are waiting, say so straight away rather than
            // sitting out the full timeout and then reporting it as "nothing arrived in time" -
            // the two mean different things to a caller deciding whether to compile by hand.
            const onClose = reason => finish(Notifications.compilationResult({
                unavailable: true,
                error: reason
            }));
            const timer = setTimeout(() => {
                // A timeout is not a failed compile: the save itself already succeeded, and some
                // saves may not raise a compile notification at all. The caller is told which of
                // the two happened rather than being given a made-up verdict.
                finish(Notifications.compilationResult({ timedOut: true }));
            }, timeoutMs);
            this.on(handler);
            this._onClose(onClose);
        });
    }

    /**
     * Ask the CMS to sign a subscription to this user's channel for one socket id.
     * @param {string} socketId
     */
    async _authorise(socketId) {
        // Note the snake_case field names: the camelCase spellings the rest of the Access API uses
        // return an internal server error here, because these are Pusher's own parameter names.
        const response = await Util.makeCall(this._api, "/Sockets/PusherAuth", {
            "channel_name": this._channel,
            "socket_id": socketId
        });
        if (!response.isSuccessful || !response.auth) {
            throw new Error("Unable to authorise the notification channel: " + (response.errorMessage || response.resultCode));
        }
        return response;
    }

    async _handleFrame(frame, onSubscribed) {
        const data = (typeof frame.data === "string" && frame.data.startsWith("{")) ? JSON.parse(frame.data) : frame.data;

        switch (frame.event) {
            case "pusher:connection_established": {
                const auth = await this._authorise(data.socket_id);
                this._send({ event: "pusher:subscribe", data: { channel: this._channel, auth: auth.auth } });
                return;
            }
            case "pusher:ping":
                // The server drops connections that do not answer; the browser client does the same.
                this._send({ event: "pusher:pong", data: {} });
                return;
            case "pusher_internal:subscription_succeeded":
                onSubscribed(null);
                return;
            case "pusher_internal:subscription_error":
            case "pusher:error":
                onSubscribed(new Error("Notification channel refused the subscription: " + JSON.stringify(data)));
                return;
            case NOTIFY_EVENT: {
                // The payload is a JSON string inside a JSON object, exactly as the UI receives it.
                let notification;
                try {
                    notification = JSON.parse(data.message);
                } catch (e) {
                    return;
                }
                for (const handler of [...this._handlers]) {
                    handler(notification);
                }
                return;
            }
            default:
                return; // thumbnail-generation-completed and anything else we do not act on.
        }
    }

    _send(message) {
        if (this._socket !== null) {
            this._socket.send(JSON.stringify(message));
        }
    }
}

module.exports = Notifications;
