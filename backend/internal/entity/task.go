package entity

import (
	"time"

	"github.com/google/uuid"
)

// TaskStatus represents the processing lifecycle of an audit task.
type TaskStatus string

const (
	TaskStatusPending    TaskStatus = "PENDING"    // created, not yet picked up
	TaskStatusProcessing TaskStatus = "PROCESSING" // goroutine is running the pipeline
	TaskStatusCompleted  TaskStatus = "COMPLETED"  // pipeline finished successfully
	TaskStatusFailed     TaskStatus = "FAILED"     // pipeline encountered a fatal error
)

// TaskStats holds aggregate counts produced when a task completes.
type TaskStats struct {
	TotalLand          int `json:"total_land"`
	TotalEstate        int `json:"total_estate"`
	Matched            int `json:"matched"`
	DiscrepanciesCount int `json:"discrepancies_count"`
}

type Task struct {
	ID           uuid.UUID  `json:"id"`
	UserID       int64      `json:"user_id"`
	Status       TaskStatus `json:"status"`
	CreatedAt    time.Time  `json:"created_at"`
	CompletedAt  *time.Time `json:"completed_at,omitempty"`
	ErrorMessage *string    `json:"error_message,omitempty"`
	Stats        *TaskStats `json:"stats,omitempty"`
}
