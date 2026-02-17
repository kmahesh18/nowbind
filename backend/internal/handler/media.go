package handler

import (
	"net/http"
	"strings"

	"github.com/nowbind/nowbind/internal/middleware"
	"github.com/nowbind/nowbind/internal/service"
)

const maxUploadSize = 10 << 20 // 10 MB

type MediaHandler struct {
	mediaService *service.MediaService
}

func NewMediaHandler(mediaService *service.MediaService) *MediaHandler {
	return &MediaHandler{mediaService: mediaService}
}

func (h *MediaHandler) Upload(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	if userID == "" {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)

	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		writeError(w, http.StatusBadRequest, "file too large (max 10MB)")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		writeError(w, http.StatusBadRequest, "file is required")
		return
	}
	defer file.Close()

	mimeType := header.Header.Get("Content-Type")
	if !isAllowedMime(mimeType) {
		writeError(w, http.StatusBadRequest, "unsupported file type")
		return
	}

	media, err := h.mediaService.Upload(r.Context(), userID, file, header.Filename, mimeType, header.Size)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to upload file")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"url":       media.URL,
		"mime_type": media.MimeType,
		"size":      media.SizeBytes,
	})
}

func isAllowedMime(mime string) bool {
	return strings.HasPrefix(mime, "image/") ||
		strings.HasPrefix(mime, "video/") ||
		strings.HasPrefix(mime, "audio/")
}
