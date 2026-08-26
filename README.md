# Social Media Backend (YouTube + Twitter)

A production-style backend that fuses **YouTube-like video hosting** with **Twitter-like short-form posts** into a single social platform. Built with Node.js, Express, and MongoDB, it covers everything a modern social app needs: auth, video uploads, tweets, comments, likes, subscriptions, playlists, and a creator dashboard.

## Features

- **Authentication** — JWT-based access/refresh token flow, secure password hashing (bcrypt), cookie-based sessions
- **User management** — registration with avatar/cover image upload, profile updates, password change, channel profile with subscriber counts
- **Videos** — upload, publish/unpublish, update, delete, and browse (Cloudinary-backed storage)
- **Tweets** — create, update, delete, and fetch short text posts
- **Comments** — threaded comments on videos with pagination
- **Likes** — toggleable likes on videos, comments, and tweets
- **Subscriptions** — subscribe/unsubscribe to channels, list subscribers and subscriptions
- **Playlists** — create playlists, add/remove videos, update/delete
- **Watch history** — automatically tracked per user
- **Dashboard** — channel-level stats and video analytics for creators
- **Healthcheck** — simple endpoint for uptime/monitoring

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ES Modules) |
| Framework | Express 5 |
| Database | MongoDB with Mongoose (+ `mongoose-aggregate-paginate-v2`) |
| Auth | JSON Web Tokens (`jsonwebtoken`), `bcrypt` |
| File uploads | `multer` (local temp storage) → `cloudinary` (persistent media hosting) |
| Dev tooling | `nodemon`, `prettier` |

## Project Structure

```
backend/
├── postman/
├── public/
│   └── temp/
├── src/
│   ├── controllers/
│   ├── db/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── validations/
│   ├── app.js
│   ├── constants.js
│   └── index.js
├── .env
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- A MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- A [Cloudinary](https://cloudinary.com/) account for media storage

### Installation

```bash
git clone <your-repo-url>
cd <project-folder>
npm install
```

### Environment Variables

Create a `.env` file in the project root with the following:

```env
PORT=8000
MONGODB_URL=your_mongodb_connection_string
CORS_ORIGIN=http://localhost:3000

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> Never commit your real `.env` file — it's already excluded via `.gitignore`.

### Running the Server

```bash
npm run dev
```

The server starts on `http://localhost:<PORT>` (default `8000`), with all routes mounted under `/api/v1`.

## API Overview

Base URL: `/api/v1`

### Users — `/users`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Register a new user (avatar + cover image upload) |
| POST | `/login` | — | Log in and receive access/refresh tokens |
| POST | `/logout` | Yes | Log out the current user |
| POST | `/refresh-token` | — | Get a new access token using a refresh token |
| PATCH | `/change-password` | Yes | Change the current password |
| GET | `/current-user` | Yes | Get the logged-in user's profile |
| PATCH | `/update-account` | Yes | Update account details |
| PATCH | `/update-avatar` | Yes | Update profile avatar |
| PATCH | `/update-coverImage` | Yes | Update cover image |
| GET | `/c/:username` | Yes | Get a channel profile (with subscriber stats) |
| GET | `/history` | Yes | Get watch history |

### Videos — `/video`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/:userId` | — | Get all videos for a user |
| POST | `/publish` | Yes | Upload and publish a video (thumbnail + video file) |
| GET | `/get/:videoId` | — | Get a single video by ID |
| PATCH | `/update/:videoId` | Yes | Update video details/thumbnail |
| DELETE | `/delete/:videoId` | Yes | Delete a video |
| PATCH | `/toggle/Publish-status/:videoId` | Yes | Toggle publish status |

### Tweets — `/tweet`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/create` | Yes | Create a tweet |
| GET | `/get/user-tweets` | Yes | Get the current user's tweets |
| PATCH | `/update/:tweetId` | Yes | Update a tweet |
| DELETE | `/delete/:tweetId` | Yes | Delete a tweet |

### Comments — `/comment`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/video/:videoId` | — | Get comments on a video |
| POST | `/add/:videoId` | Yes | Add a comment |
| PATCH | `/update/:commentId` | Yes | Update a comment |
| DELETE | `/delete/:commentId` | Yes | Delete a comment |

### Likes — `/like`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/video/:videoId` | Yes | Toggle like on a video |
| POST | `/comment/:commentId` | Yes | Toggle like on a comment |
| POST | `/tweet/:tweetId` | Yes | Toggle like on a tweet |
| GET | `/liked/videos` | Yes | Get all videos liked by the user |

### Subscriptions — `/subscription`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/toggle/:channelId` | Yes | Subscribe/unsubscribe to a channel |
| GET | `/get/subscribers/:channelId` | Yes | Get a channel's subscribers |
| GET | `/get/subscribed/:subscriberId` | Yes | Get channels a user is subscribed to |

### Playlists — `/playlist`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/create` | Yes | Create a playlist |
| GET | `/get/playlists/:userId` | — | Get a user's playlists |
| GET | `/get/playlist/:playlistId` | — | Get a playlist by ID |
| PATCH | `/add/video/:playlistId/:videoId` | Yes | Add a video to a playlist |
| DELETE | `/remove/video/:playlistId/:videoId` | Yes | Remove a video from a playlist |
| DELETE | `/delete/:playlistId` | Yes | Delete a playlist |
| PATCH | `/update/:playlistId` | Yes | Update a playlist |

### Dashboard — `/dashboard`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/get/channel/stats/:channelId` | — | Get channel statistics |
| GET | `/get/channel/videos/:channelId` | — | Get all videos for a channel |

### Healthcheck — `/healthcheck`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | — | Check API health/uptime |

*"Yes" in the Auth column means the endpoint requires a valid JWT access token (sent via cookie or `Authorization` header).*

## Data Models

- **User** — auth credentials, avatar/cover image, watch history, refresh token
- **Video** — video file, thumbnail, title, description, duration, views, publish status, owner
- **Tweet** — content, owner
- **Comment** — content, video reference, owner
- **Like** — polymorphic reference to a video, comment, or tweet + the user who liked it (unique per user/target)
- **Playlist** — name, description, list of videos, owner
- **Subscription** — subscriber ↔ channel relationship (unique pair)

## Error Handling & Responses

The API uses consistent response wrappers:
- `ApiResponse` — standardized success payload
- `ApiError` — standardized error payload with status code and message
- `asyncHandler` — wraps controllers to catch async errors and forward them to Express's error handler

## Postman Collection

A ready-to-use Postman collection covering all the endpoints above is included in this repo at `postman/BACKEND_SOCIALMEDIA_postman_collection.json`.

To use it:
1. Open Postman.
2. Click **Import** (top left).
3. Select the file `postman/BACKEND_SOCIALMEDIA_postman_collection.json`.
4. The collection will appear in your sidebar with all requests pre-configured.

## License

ISC

## Author

Daniyal Afzaal