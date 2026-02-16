package middleware

import (
	"net/http"
	"time"

	"github.com/go-chi/httprate"
)

// GlobalRateLimit applies a per-IP rate limit to all requests.
func GlobalRateLimit(requestsPerMinute int) func(http.Handler) http.Handler {
	return httprate.Limit(
		requestsPerMinute,
		time.Minute,
		httprate.WithKeyFuncs(httprate.KeyByRealIP),
		httprate.WithLimitHandler(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Retry-After", "60")
			w.WriteHeader(http.StatusTooManyRequests)
			w.Write([]byte(`{"error":"rate limit exceeded, try again later"}`))
		}),
	)
}

// AuthRateLimit applies a stricter per-IP rate limit for auth endpoints.
func AuthRateLimit() func(http.Handler) http.Handler {
	return httprate.Limit(
		10,
		time.Minute,
		httprate.WithKeyFuncs(httprate.KeyByRealIP),
		httprate.WithLimitHandler(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Retry-After", "60")
			w.WriteHeader(http.StatusTooManyRequests)
			w.Write([]byte(`{"error":"too many auth requests, try again later"}`))
		}),
	)
}

// ApiKeyRateLimit applies a per-API-key rate limit.
// The key ID is extracted from the context (set by ApiKeyAuth middleware).
func ApiKeyRateLimit(defaultLimit int) func(http.Handler) http.Handler {
	return httprate.Limit(
		defaultLimit,
		time.Minute,
		httprate.WithKeyFuncs(func(r *http.Request) (string, error) {
			// Use the API key ID from context for per-key limiting
			if keyID, ok := r.Context().Value(apiKeyIDKey).(string); ok && keyID != "" {
				return keyID, nil
			}
			// Fallback to IP if no key found
			return httprate.KeyByRealIP(r)
		}),
		httprate.WithLimitHandler(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Retry-After", "60")
			w.WriteHeader(http.StatusTooManyRequests)
			w.Write([]byte(`{"error":"api rate limit exceeded"}`))
		}),
	)
}
