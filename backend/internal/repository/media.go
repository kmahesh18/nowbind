package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nowbind/nowbind/internal/model"
)

type MediaRepository struct {
	pool *pgxpool.Pool
}

func NewMediaRepository(pool *pgxpool.Pool) *MediaRepository {
	return &MediaRepository{pool: pool}
}

func (r *MediaRepository) Create(ctx context.Context, media *model.Media) error {
	return r.pool.QueryRow(ctx,
		`INSERT INTO media (user_id, filename, original_name, mime_type, size_bytes, url, r2_key)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id, created_at`,
		media.UserID, media.Filename, media.OriginalName, media.MimeType,
		media.SizeBytes, media.URL, media.R2Key,
	).Scan(&media.ID, &media.CreatedAt)
}

func (r *MediaRepository) GetByID(ctx context.Context, id string) (*model.Media, error) {
	m := &model.Media{}
	err := r.pool.QueryRow(ctx,
		`SELECT id, user_id, filename, original_name, mime_type, size_bytes, url, r2_key, created_at
		 FROM media WHERE id = $1`, id,
	).Scan(&m.ID, &m.UserID, &m.Filename, &m.OriginalName, &m.MimeType,
		&m.SizeBytes, &m.URL, &m.R2Key, &m.CreatedAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("getting media by id: %w", err)
	}
	return m, nil
}

func (r *MediaRepository) ListByUser(ctx context.Context, userID string) ([]model.Media, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, user_id, filename, original_name, mime_type, size_bytes, url, r2_key, created_at
		 FROM media WHERE user_id = $1 ORDER BY created_at DESC`, userID,
	)
	if err != nil {
		return nil, fmt.Errorf("listing media: %w", err)
	}
	defer rows.Close()

	var items []model.Media
	for rows.Next() {
		var m model.Media
		if err := rows.Scan(&m.ID, &m.UserID, &m.Filename, &m.OriginalName, &m.MimeType,
			&m.SizeBytes, &m.URL, &m.R2Key, &m.CreatedAt); err != nil {
			return nil, fmt.Errorf("scanning media: %w", err)
		}
		items = append(items, m)
	}
	return items, nil
}

func (r *MediaRepository) Delete(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, "DELETE FROM media WHERE id = $1", id)
	return err
}
