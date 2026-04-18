package entity

import (
	"time"

	"github.com/google/uuid"
)

type TaskStatus string

const (
	TaskStatusPending    TaskStatus = "PENDING"
	TaskStatusProcessing TaskStatus = "PROCESSING"
	TaskStatusCompleted  TaskStatus = "COMPLETED"
	TaskStatusFailed     TaskStatus = "FAILED"
)

type TaskStats struct {
	TotalLand          int `json:"total_land"`
	TotalEstate        int `json:"total_estate"`
	Matched            int `json:"matched"`
	DiscrepanciesCount int `json:"discrepancies_count"`
}

type Task struct {
	ID           uuid.UUID  `json:"id"`
	Status       TaskStatus `json:"status"`
	CreatedAt    time.Time  `json:"created_at"`
	CompletedAt  *time.Time `json:"completed_at,omitempty"`
	ErrorMessage *string    `json:"error_message,omitempty"`
	Stats        *TaskStats `json:"stats,omitempty"`
}
