package handler

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"net"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/nowbind/nowbind/internal/middleware"
	"github.com/nowbind/nowbind/internal/repository"
)

type AnalyticsHandler struct {
	analytics *repository.AnalyticsRepository
	posts     *repository.PostRepository
}

type trackViewInput struct {
	Referrer string `json:"referrer"`
}

func NewAnalyticsHandler(analytics *repository.AnalyticsRepository, posts *repository.PostRepository) *AnalyticsHandler {
	return &AnalyticsHandler{analytics: analytics, posts: posts}
}

func (h *AnalyticsHandler) TrackView(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")

	post, err := h.posts.GetBySlug(r.Context(), slug)
	if err != nil || post == nil {
		writeError(w, http.StatusNotFound, "post not found")
		return
	}

	viewerIP := r.RemoteAddr
	// Strip port from ip:port format (r.RemoteAddr includes port)
	if host, _, err := net.SplitHostPort(viewerIP); err == nil {
		viewerIP = host
	}

	referrer := h.normalizeReferrer(readTrackViewReferrer(r), r)
	if referrer == "" {
		referrer = h.normalizeReferrer(r.Header.Get("Referer"), r)
	}
	userAgent := r.Header.Get("User-Agent")

	go func() {
		if err := h.analytics.RecordView(context.Background(), post.ID, viewerIP, referrer, "web", userAgent); err != nil {
			log.Printf("failed to record view for post %s: %v", post.ID, err)
		}
	}()

	w.WriteHeader(http.StatusNoContent)
}

func readTrackViewReferrer(r *http.Request) string {
	if r.Body == nil {
		return ""
	}

	defer r.Body.Close()

	var input trackViewInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		if err == io.EOF {
			return ""
		}
		return ""
	}

	return input.Referrer
}

func (h *AnalyticsHandler) normalizeReferrer(raw string, r *http.Request) string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return ""
	}

	refURL, err := url.Parse(raw)
	if err != nil || refURL.Hostname() == "" {
		return ""
	}

	originURL, err := url.Parse(r.Header.Get("Origin"))
	if err == nil && originURL.Hostname() != "" && sameHostname(refURL.Hostname(), originURL.Hostname()) {
		return ""
	}

	if sameHostname(refURL.Hostname(), r.Host) {
		return ""
	}

	host := strings.ToLower(refURL.Hostname())
	return strings.TrimPrefix(host, "www.")
}

func sameHostname(a, b string) bool {
	return strings.EqualFold(stripHostPort(a), stripHostPort(b))
}

func stripHostPort(value string) string {
	if host, _, err := net.SplitHostPort(value); err == nil {
		return host
	}
	return value
}

func (h *AnalyticsHandler) Overview(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	overview, err := h.analytics.GetOverview(r.Context(), userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to get overview")
		return
	}
	writeJSON(w, http.StatusOK, overview)
}

func (h *AnalyticsHandler) Timeline(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	days, _ := strconv.Atoi(r.URL.Query().Get("days"))
	if days < 1 {
		days = 30
	}

	views, err := h.analytics.GetViewsByDate(r.Context(), userID, days)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to get timeline")
		return
	}
	writeJSON(w, http.StatusOK, views)
}

func (h *AnalyticsHandler) TopPosts(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	days, _ := strconv.Atoi(r.URL.Query().Get("days"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if days < 1 {
		days = 30
	}
	if limit < 1 {
		limit = 10
	}

	posts, err := h.analytics.GetTopPosts(r.Context(), userID, days, limit)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to get top posts")
		return
	}
	writeJSON(w, http.StatusOK, posts)
}

func (h *AnalyticsHandler) Referrers(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	days, _ := strconv.Atoi(r.URL.Query().Get("days"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if days < 1 {
		days = 30
	}
	if limit < 1 {
		limit = 10
	}

	refs, err := h.analytics.GetReferrers(r.Context(), userID, days, limit)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to get referrers")
		return
	}
	writeJSON(w, http.StatusOK, refs)
}
